/**
 * Quest progress service — computes progress for all quests in one query + one loop.
 * Server-only (uses Prisma).
 */

import prisma from '$lib/server/prisma';
import { GAME_MODE_TURBO, GAME_MODES_RANKED, MATCH_CUTOFF_START_TIME } from '$lib/constants/matches';
import {
	QUEST_DEFINITIONS,
	ACTIVE_STAT_KEYS,
	NULLABLE_STAT_KEYS,
	STAT_KEY_TO_COLUMN,
	type StatKey
} from './quest-definitions';

/** Game modes that qualify for quest progress (turbo + ranked). */
const QUALIFYING_GAME_MODES = [GAME_MODE_TURBO, ...GAME_MODES_RANKED];

export interface QuestProgress {
	questId: string;
	current: number;
	threshold: number;
	completed: boolean;
	/** Unix seconds of the most recent match that contributed to this quest's stat. */
	lastActivityAt: number | null;
}

/**
 * Compute progress for all active quests for the given Dota account.
 *
 * One DB query (Match ⋈ PlayersMatchDetail), one loop over results.
 * Returns one entry per quest definition.
 *
 * @param accountId - Dota account ID
 * @param startAfter - Earliest match timestamp (unix seconds BigInt). Defaults to MATCH_CUTOFF_START_TIME.
 */
export async function getQuestProgress(
	accountId: number,
	startAfter: bigint = MATCH_CUTOFF_START_TIME
): Promise<QuestProgress[]> {
	// ── 1. Single query: qualifying match details ──────────────────────────
	// We need PlayersMatchDetail rows where the corresponding Match row has
	// the right account_id, game_mode, and start_time.
	const rows = await prisma.playersMatchDetail.findMany({
		where: {
			account_id: accountId,
			match_detail: {
				start_time: { gte: startAfter }
			}
		},
		select: {
			match_id: true,
			last_hits: true,
			denies: true,
			net_worth: true,
			hero_damage: true,
			tower_damage: true,
			hero_healing: true,
			match_detail: { select: { start_time: true } }
		}
	});

	// We also need to filter by game_mode which lives on Match, not MatchDetail.
	// Load the game_mode for matching match_ids from the Match table.
	const matchIds = [...new Set(rows.map((r) => r.match_id))];
	const qualifyingMatchIds = new Set<string>();

	if (matchIds.length > 0) {
		const matches = await prisma.match.findMany({
			where: {
				match_id: { in: matchIds },
				account_id: accountId,
				game_mode: { in: QUALIFYING_GAME_MODES },
				start_time: { gte: startAfter }
			},
			select: { match_id: true }
		});
		for (const m of matches) {
			qualifyingMatchIds.add(m.match_id.toString());
		}
	}

	// ── 2. Single loop: aggregate all stats + track latest match time per stat ──
	const sums: Record<string, number> = {};
	const maxes: Record<string, number> = {};
	const lastActivityPerStat: Record<string, number> = {};

	for (const key of ACTIVE_STAT_KEYS) {
		sums[key] = 0;
		maxes[key] = 0;
		lastActivityPerStat[key] = 0;
	}

	for (const row of rows) {
		if (!qualifyingMatchIds.has(row.match_id.toString())) continue;

		const startTime = row.match_detail?.start_time != null ? Number(row.match_detail.start_time) : 0;

		for (const key of ACTIVE_STAT_KEYS) {
			const col = STAT_KEY_TO_COLUMN[key] as keyof typeof row;
			const raw = row[col];
			const val = NULLABLE_STAT_KEYS.has(key) ? (raw ?? 0) : raw;
			const numVal = typeof val === 'number' ? val : 0;

			sums[key] += numVal;
			if (numVal > maxes[key]) {
				maxes[key] = numVal;
			}
			if (startTime > lastActivityPerStat[key]) {
				lastActivityPerStat[key] = startTime;
			}
		}
	}

	// ── 3. Map aggregates to quests ────────────────────────────────────────
	return QUEST_DEFINITIONS.map((quest) => {
		const current =
			quest.scope === 'across_games'
				? sums[quest.statKey] ?? 0
				: maxes[quest.statKey] ?? 0;
		const lastActivityAt = lastActivityPerStat[quest.statKey] > 0 ? lastActivityPerStat[quest.statKey] : null;

		return {
			questId: quest.id,
			current,
			threshold: quest.threshold,
			completed: current >= quest.threshold,
			lastActivityAt
		};
	});
}
