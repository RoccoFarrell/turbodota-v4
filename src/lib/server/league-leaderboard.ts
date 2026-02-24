/**
 * Dark Rift league leaderboard: pure aggregation + DB orchestrator.
 *
 * aggregateLeaderboard   — pure function, no DB
 * computeDarkRiftLeaderboard — fetches data from Prisma and calls the pure function
 */

import prisma from '$lib/server/prisma';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';
import { computeLineupStats } from '$lib/incremental/stats/lineup-stats';
import type { AbilityDef } from '$lib/incremental/types';

// ── Input types ─────────────────────────────────────────────────────────────

/** A single won run (cleared floor) within the season window. */
export interface WonRunRow {
	userId: string;
	level: number;
	lineupId: string;
}

/** Identity info for a league member. */
export interface MemberInfo {
	accountId: number;
	displayName: string;
	avatarUrl: string | null;
}

/** Pre-computed DPS snapshot for a lineup. */
export interface LineupDpsInfo {
	totalDps: number;
	heroIds: number[];
}

// ── Output type ─────────────────────────────────────────────────────────────

/** A single row in the ranked leaderboard. */
export interface DarkRiftLeaderboardRow {
	rank: number;
	accountId: number;
	displayName: string;
	avatarUrl: string | null;
	deepestLevel: number;
	totalDps: number;
	runCount: number;
	heroIds: number[];
}

// ── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Build a ranked leaderboard from raw data.
 *
 * @param runs     All won runs in the season window for league members.
 * @param members  Map of userId -> MemberInfo for every league member.
 * @param lineupDps Map of lineupId -> LineupDpsInfo (pre-computed).
 * @returns Ranked leaderboard rows sorted by deepest level desc, then DPS desc.
 */
export function aggregateLeaderboard(
	runs: WonRunRow[],
	members: Map<string, MemberInfo>,
	lineupDps: Map<string, LineupDpsInfo>
): DarkRiftLeaderboardRow[] {
	if (members.size === 0) return [];

	// Group runs by userId
	const runsByUser = new Map<string, WonRunRow[]>();
	for (const run of runs) {
		const list = runsByUser.get(run.userId);
		if (list) {
			list.push(run);
		} else {
			runsByUser.set(run.userId, [run]);
		}
	}

	// Build an unsorted entry for every member (including those with zero runs)
	const entries: Omit<DarkRiftLeaderboardRow, 'rank'>[] = [];

	for (const [userId, member] of members) {
		const userRuns = runsByUser.get(userId) ?? [];
		const runCount = userRuns.length;

		if (runCount === 0) {
			entries.push({
				accountId: member.accountId,
				displayName: member.displayName,
				avatarUrl: member.avatarUrl,
				deepestLevel: 0,
				totalDps: 0,
				runCount: 0,
				heroIds: []
			});
			continue;
		}

		// Find the deepest run
		let best = userRuns[0];
		for (let i = 1; i < userRuns.length; i++) {
			if (userRuns[i].level > best.level) {
				best = userRuns[i];
			}
		}

		// Look up DPS for the lineup used on the deepest run
		const dpsInfo = lineupDps.get(best.lineupId);

		entries.push({
			accountId: member.accountId,
			displayName: member.displayName,
			avatarUrl: member.avatarUrl,
			deepestLevel: best.level,
			totalDps: dpsInfo?.totalDps ?? 0,
			runCount,
			heroIds: dpsInfo?.heroIds ?? []
		});
	}

	// Sort: deepest level descending, then DPS descending as tiebreaker
	entries.sort((a, b) => {
		if (b.deepestLevel !== a.deepestLevel) return b.deepestLevel - a.deepestLevel;
		return b.totalDps - a.totalDps;
	});

	// Assign 1-based ranks
	return entries.map((entry, idx) => ({
		rank: idx + 1,
		...entry
	}));
}

// ── DB-facing types ────────────────────────────────────────────────────────

/** Minimal league shape expected by the orchestrator. */
export interface LeagueWithMembers {
	members: {
		account_id: number;
		display_name: string | null;
		avatar_url: string | null;
		user: { username: string; avatar_url: string | null } | null;
	}[];
}

/** Season date window (inclusive). */
export interface SeasonWindow {
	startDate: Date;
	endDate: Date;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Fetch data from the database and compute the Dark Rift leaderboard
 * for a league's members within a season window.
 */
export async function computeDarkRiftLeaderboard(
	league: LeagueWithMembers,
	season: SeasonWindow
): Promise<DarkRiftLeaderboardRow[]> {
	const memberAccountIds = league.members.map((m) => m.account_id);
	if (memberAccountIds.length === 0) return [];

	// ── 1. Bridge DotaUser.account_id → User.id ─────────────────────────
	const users = await prisma.user.findMany({
		where: { account_id: { in: memberAccountIds } },
		select: { id: true, account_id: true }
	});

	const userIds = users.map((u) => u.id);
	if (userIds.length === 0) return [];

	// account_id → userId lookup
	const accountToUserId = new Map<number, string>();
	for (const u of users) {
		if (u.account_id != null) {
			accountToUserId.set(u.account_id, u.id);
		}
	}

	// ── 2. Fetch won runs in the season window ──────────────────────────
	const wonRuns = await prisma.incrementalRun.findMany({
		where: {
			userId: { in: userIds },
			status: 'WON',
			startedAt: { gte: season.startDate, lte: season.endDate }
		},
		select: { userId: true, level: true, lineupId: true }
	});

	// ── 3. Build MemberInfo map (keyed by userId) ───────────────────────
	const membersMap = new Map<string, MemberInfo>();
	for (const m of league.members) {
		const userId = accountToUserId.get(m.account_id);
		if (userId) {
			membersMap.set(userId, {
				accountId: m.account_id,
				displayName: m.user?.username ?? m.display_name ?? `Player ${m.account_id}`,
				avatarUrl: m.user?.avatar_url ?? m.avatar_url
			});
		}
	}

	// ── 4. Identify the lineup for each user's deepest run ──────────────
	const deepestRunByUser = new Map<string, WonRunRow>();
	for (const run of wonRuns) {
		const existing = deepestRunByUser.get(run.userId);
		if (!existing || run.level > existing.level) {
			deepestRunByUser.set(run.userId, run);
		}
	}

	const neededLineupIds = [...new Set([...deepestRunByUser.values()].map((r) => r.lineupId))];

	// ── 5. Fetch lineups with saveId ────────────────────────────────────
	const lineups =
		neededLineupIds.length > 0
			? await prisma.incrementalLineup.findMany({
					where: { id: { in: neededLineupIds } },
					select: { id: true, saveId: true, heroIds: true }
				})
			: [];

	// ── 6. Compute DPS per lineup ───────────────────────────────────────
	// Group lineups by saveId so we only call getHeroDefsFromDb once per save
	const lineupsBySaveId = new Map<string, typeof lineups>();
	for (const l of lineups) {
		const list = lineupsBySaveId.get(l.saveId);
		if (list) {
			list.push(l);
		} else {
			lineupsBySaveId.set(l.saveId, [l]);
		}
	}

	const lineupDps = new Map<string, LineupDpsInfo>();

	for (const [saveId, saveLineups] of lineupsBySaveId) {
		try {
			// getHeroDefsFromDb bakes training into base stats when saveId is passed
			const { getHeroDef, getAbilityDef } = await getHeroDefsFromDb(saveId);

			for (const lineup of saveLineups) {
				// Build abilityDefs record from heroes' abilityIds
				const abilityDefs: Record<string, AbilityDef> = {};
				for (const heroId of lineup.heroIds) {
					const def = getHeroDef(heroId);
					if (def) {
						for (const abilityId of def.abilityIds) {
							const ab = getAbilityDef(abilityId);
							if (ab) {
								abilityDefs[abilityId] = ab;
							}
						}
					}
				}

				// Do NOT pass trainingByHero — training is already baked into HeroDefs
				const stats = computeLineupStats(lineup.heroIds, getHeroDef, abilityDefs);

				lineupDps.set(lineup.id, {
					totalDps: stats.totalDps,
					heroIds: lineup.heroIds
				});
			}
		} catch {
			// If save/lineup was deleted, fall back to DPS=0 for all lineups in this save
			for (const lineup of saveLineups) {
				lineupDps.set(lineup.id, { totalDps: 0, heroIds: lineup.heroIds });
			}
		}
	}

	// ── 7. Aggregate and return ─────────────────────────────────────────
	return aggregateLeaderboard(wonRuns, membersMap, lineupDps);
}
