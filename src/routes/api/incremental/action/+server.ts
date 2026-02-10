import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceIdleTimer } from '$lib/incremental/actions/idle-timer';
import { getActionDef, applyRewards, MINING_ACTION_ID, TRAINING_ACTION_ID } from '$lib/incremental/actions/action-definitions';
import { TRAINING_STAT_KEYS, type TrainingStatKey } from '$lib/incremental/actions/constants';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

/** POST /api/incremental/action – tick or set action. Body: { saveId?, lastTickAt, progress?, actionType?, actionHeroId?, actionStatKey? } */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: {
		saveId?: string;
		lastTickAt?: number;
		progress?: number;
		actionType?: string;
		actionHeroId?: number;
		actionStatKey?: string;
	};
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });

	const now = Date.now();
	const lastTickAt = typeof body.lastTickAt === 'number' ? body.lastTickAt : now;
	const progress = typeof body.progress === 'number' ? Math.max(0, Math.min(1, body.progress)) : 0;
	const actionId =
		body.actionType === TRAINING_ACTION_ID ? TRAINING_ACTION_ID : MINING_ACTION_ID;
	const actionHeroId = actionId === TRAINING_ACTION_ID ? body.actionHeroId : null;
	const actionStatKey =
		actionId === TRAINING_ACTION_ID && isValidStatKey(body.actionStatKey)
			? body.actionStatKey
			: null;

	if (actionId === TRAINING_ACTION_ID) {
		if (typeof actionHeroId !== 'number' || !isValidStatKey(actionStatKey)) {
			error(400, 'Training requires actionHeroId (number) and actionStatKey (valid stat key)');
		}
		const roster = await prisma.incrementalRosterHero.findMany({
			where: { saveId },
			select: { heroId: true }
		});
		if (!roster.some((r) => r.heroId === actionHeroId)) {
			error(400, 'Hero is not on your roster');
		}
	}

	const def = getActionDef(actionId);
	const durationPerCompletionSec = def?.durationPerCompletionSec ?? 5;
	const rateModifier = def?.rateModifier ?? 1;

	const { progress: newProgress, completions } = advanceIdleTimer({
		progress,
		lastTickAt,
		now,
		durationPerCompletionSec,
		rateModifier
	});

	const params: Record<string, unknown> =
		actionId === TRAINING_ACTION_ID && actionHeroId != null && actionStatKey != null
			? { heroId: actionHeroId, statKey: actionStatKey }
			: {};

	await prisma.$transaction(async (tx) => {
		await applyRewards(actionId, params, completions, { saveId, tx });
		await tx.incrementalActionState.upsert({
			where: { saveId },
			create: {
				saveId,
				actionType: actionId,
				progress: newProgress,
				lastTickAt: new Date(now),
				actionHeroId: actionHeroId ?? undefined,
				actionStatKey: actionStatKey ?? undefined
			},
			update: {
				actionType: actionId,
				progress: newProgress,
				lastTickAt: new Date(now),
				actionHeroId: actionHeroId ?? null,
				actionStatKey: actionStatKey ?? null
			}
		});
	});

	const save = await prisma.incrementalSave.findUnique({
		where: { id: saveId },
		select: { essence: true }
	});
	const actionState = await prisma.incrementalActionState.findUnique({
		where: { saveId },
		select: { actionHeroId: true, actionStatKey: true }
	});

	return json({
		essence: save?.essence ?? 0,
		saveId,
		progress: newProgress,
		lastTickAt: now,
		essenceEarned: actionId === MINING_ACTION_ID ? completions * 1 : 0,
		actionType: actionId,
		actionHeroId: actionState?.actionHeroId ?? null,
		actionStatKey: actionState?.actionStatKey ?? null
	});
};
