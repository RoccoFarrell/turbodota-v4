import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getQuestProgress } from '$lib/incremental/quests/quest-progress.server';
import { getOnboardingProgress } from '$lib/incremental/quests/onboarding-progress.server';
import {
	QUEST_DEFINITIONS,
	ONBOARDING_DEFINITIONS,
	rewardDescription,
	type QuestDef,
	type OnboardingDef
} from '$lib/incremental/quests/quest-definitions';
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';

/**
 * GET /api/incremental/quests?saveId=...
 *
 * Returns all quest definitions (recurring + onboarding) with current progress
 * and claim state for the given save.
 */
export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');

	const saveIdParam = event.url.searchParams.get('saveId') ?? undefined;
	const save = await resolveIncrementalSave(event, { saveId: saveIdParam });
	const accountId = save.account_id;

	// ── 1. Fetch both progress sources in parallel ───────────────────────
	const [recurringProgress, onboardingProgress] = await Promise.all([
		accountId ? getQuestProgress(accountId, save.matchCutoff) : Promise.resolve([]),
		getOnboardingProgress(save.saveId)
	]);

	const recurringProgressMap = new Map(recurringProgress.map((p) => [p.questId, p]));
	const onboardingProgressMap = new Map(onboardingProgress.map((p) => [p.questId, p]));

	// ── 2. Load all save-quest rows in one query ─────────────────────────
	const allSaveQuestRows = await prisma.incrementalSaveQuest.findMany({
		where: { saveId: save.saveId },
		select: { questId: true, type: true, startedAt: true, claimCount: true, claimedAt: true }
	});
	const saveQuestMap = new Map(allSaveQuestRows.map((r) => [r.questId, r]));

	// ── 3. Ensure recurring rows exist (first-time initialization) ───────
	const now = new Date();
	const missingRecurringIds = QUEST_DEFINITIONS.filter(
		(def) => !saveQuestMap.has(def.id)
	).map((d) => d.id);

	if (missingRecurringIds.length > 0) {
		await prisma.incrementalSaveQuest.createMany({
			data: missingRecurringIds.map((questId) => ({
				saveId: save.saveId,
				questId,
				type: 'recurring',
				startedAt: now,
				claimCount: 0
			}))
		});
		const fresh = await prisma.incrementalSaveQuest.findMany({
			where: { saveId: save.saveId },
			select: { questId: true, type: true, startedAt: true, claimCount: true, claimedAt: true }
		});
		for (const row of fresh) saveQuestMap.set(row.questId, row);
	}

	// ── 4. Build recurring quest response items ──────────────────────────
	let qualifyingMatches: { start_time: bigint; game_mode: number }[] = [];
	if (accountId) {
		const saveQuestValues = [...saveQuestMap.values()];
		const minStartedUnix =
			saveQuestValues.length > 0
				? Math.min(
						...saveQuestValues.map((r) => Math.floor(r.startedAt.getTime() / 1000))
					)
				: 0;
		const cutoffSeconds = Number(save.matchCutoff);
		qualifyingMatches = await prisma.match.findMany({
			where: {
				account_id: accountId,
				game_mode: { in: [GAME_MODE_TURBO, ...GAME_MODES_RANKED] },
				start_time: { gte: BigInt(Math.max(cutoffSeconds, minStartedUnix)) }
			},
			select: { start_time: true, game_mode: true }
		});
	}

	const recurringItems = QUEST_DEFINITIONS.map((def: QuestDef) => {
		const prog = recurringProgressMap.get(def.id);
		const rawTotal = prog?.current ?? 0;
		const saveQuest = saveQuestMap.get(def.id);
		const claimCount = saveQuest?.claimCount ?? 0;
		const startedAt = saveQuest?.startedAt ?? now;
		const startedAtUnix = Math.floor(startedAt.getTime() / 1000);

		const current = Math.max(0, rawTotal - def.threshold * claimCount);
		const completed = current >= def.threshold;

		const matchesSinceStart = qualifyingMatches.filter(
			(m) => Number(m.start_time) >= startedAtUnix
		);

		return {
			id: def.id,
			type: 'recurring' as const,
			label: def.label,
			description: null as string | null,
			iconId: def.iconId ?? null,
			statKey: def.statKey as string | null,
			current,
			threshold: def.threshold,
			completed,
			claimCount,
			canClaim: completed,
			lastActivityAt: prog?.lastActivityAt ?? null,
			rewardDescription: rewardDescription(def.reward),
			startedAt: startedAt.toISOString(),
			turboMatchesSinceStart: matchesSinceStart.filter(
				(m) => m.game_mode === GAME_MODE_TURBO
			).length,
			rankedMatchesSinceStart: matchesSinceStart.filter((m) =>
				GAME_MODES_RANKED.includes(m.game_mode)
			).length,
			order: null as number | null,
			locked: false,
			navLink: null as string | null
		};
	});

	// ── 5. Build onboarding quest response items (with sequential lock) ──
	const claimedOnboardingIds = new Set(
		ONBOARDING_DEFINITIONS.filter(
			(def) => (saveQuestMap.get(def.id)?.claimCount ?? 0) > 0
		).map((def) => def.id)
	);

	const onboardingItems = ONBOARDING_DEFINITIONS.map((def: OnboardingDef) => {
		const prog = onboardingProgressMap.get(def.id);
		const completed = prog?.completed ?? false;
		const claimCount = saveQuestMap.get(def.id)?.claimCount ?? 0;
		const alreadyClaimed = claimCount > 0;

		// Sequential lock: locked if previous step not claimed AND this step not yet completed
		const previousDef = ONBOARDING_DEFINITIONS.find((d) => d.order === def.order - 1);
		const previousClaimed = previousDef ? claimedOnboardingIds.has(previousDef.id) : true;
		const locked = !previousClaimed && !completed;
		const canClaim = completed && !alreadyClaimed && !locked;

		return {
			id: def.id,
			type: 'onboarding' as const,
			label: def.label,
			description: def.description as string | null,
			iconId: def.iconId ?? null,
			statKey: null as string | null,
			current: prog?.current ?? 0,
			threshold: 1,
			completed,
			claimCount,
			canClaim,
			lastActivityAt: null as number | null,
			rewardDescription: rewardDescription(def.reward),
			startedAt: null as string | null,
			turboMatchesSinceStart: null as number | null,
			rankedMatchesSinceStart: null as number | null,
			order: def.order,
			locked,
			navLink: def.navLink as string | null
		};
	});

	return json({
		quests: [...onboardingItems, ...recurringItems],
		saveId: save.saveId
	});
};
