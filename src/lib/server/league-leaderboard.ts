/**
 * Pure aggregation logic for the Dark Rift league leaderboard.
 * No database calls — accepts pre-fetched data and returns ranked rows.
 */

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
