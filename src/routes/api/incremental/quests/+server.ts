import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getQuestProgress } from '$lib/incremental/quests/quest-progress.server';
import { QUEST_DEFINITIONS, rewardDescription } from '$lib/incremental/quests/quest-definitions';
import { GAME_MODE_TURBO, GAME_MODES_RANKED, MATCH_CUTOFF_START_TIME } from '$lib/constants/matches';

/**
 * GET /api/incremental/quests?saveId=...
 *
 * Returns all quest definitions with current progress and claim state for the given save.
 * Uses IncrementalSaveQuest for startedAt and claimCount. Creates a row per quest on first use with startedAt = now (when first assigned).
 */
export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');

	const accountId = session.user.account_id;
	const saveIdParam = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId } = await resolveIncrementalSave(event, { saveId: saveIdParam });

	const progress = await getQuestProgress(accountId);
	const progressMap = new Map(progress.map((p) => [p.questId, p]));

	let saveQuestMap = new Map(
		(
			await prisma.incrementalSaveQuest.findMany({
				where: { saveId },
				select: { questId: true, startedAt: true, claimCount: true }
			})
		).map((r) => [r.questId, r] as const)
	);

	// Ensure a row exists for every quest (first assignment uses default start date)
	const missingQuestIds = QUEST_DEFINITIONS.filter((def) => !saveQuestMap.has(def.id)).map(
		(d) => d.id
	);
	if (missingQuestIds.length > 0) {
		const now = new Date();
		await prisma.incrementalSaveQuest.createMany({
			data: missingQuestIds.map((questId) => ({
				saveId,
				questId,
				startedAt: now,
				claimCount: 0
			}))
		});
		saveQuestMap = new Map(
			(
				await prisma.incrementalSaveQuest.findMany({
					where: { saveId },
					select: { questId: true, startedAt: true, claimCount: true }
				})
			).map((r) => [r.questId, r] as const)
		);
	}

	const cutoffSeconds = Number(MATCH_CUTOFF_START_TIME);
	const minStartedUnix =
		saveQuestMap.size > 0
			? Math.min(
					...[...saveQuestMap.values()].map((r) => Math.floor(r.startedAt.getTime() / 1000))
				)
			: 0;
	const qualifyingMatches = await prisma.match.findMany({
		where: {
			account_id: accountId,
			game_mode: { in: [GAME_MODE_TURBO, ...GAME_MODES_RANKED] },
			start_time: { gte: BigInt(Math.max(cutoffSeconds, Math.floor(minStartedUnix))) }
		},
		select: { start_time: true, game_mode: true }
	});

	const quests = QUEST_DEFINITIONS.map((def) => {
		const prog = progressMap.get(def.id);
		const rawTotal = prog?.current ?? 0;
		const saveQuest = saveQuestMap.get(def.id)!;
		const claimCount = saveQuest.claimCount;
		const threshold = def.threshold;

		const current = Math.max(0, rawTotal - threshold * claimCount);
		const completed = current >= threshold;
		const lastActivityAt = prog?.lastActivityAt ?? null;

		const startedAt = saveQuest.startedAt;
		const startedAtUnix = Math.floor(startedAt.getTime() / 1000);

		const matchesSinceStart = qualifyingMatches.filter(
			(m) => Number(m.start_time) >= startedAtUnix
		);
		const turboMatchesSinceStart = matchesSinceStart.filter((m) => m.game_mode === GAME_MODE_TURBO).length;
		const rankedMatchesSinceStart = matchesSinceStart.filter((m) =>
			GAME_MODES_RANKED.includes(m.game_mode)
		).length;

		return {
			id: def.id,
			label: def.label,
			iconId: def.iconId ?? null,
			statKey: def.statKey,
			current,
			threshold,
			completed,
			claimCount,
			canClaim: completed,
			lastActivityAt,
			rewardDescription: rewardDescription(def),
			startedAt: startedAt.toISOString(),
			turboMatchesSinceStart,
			rankedMatchesSinceStart
		};
	});

	return json({ quests, saveId });
};
