import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceAction } from '$lib/incremental/actions';
import { ACTION_TYPE_MINING } from '$lib/incremental/actions';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** POST /api/incremental/action – tick action (server-authoritative). Body: { saveId?, lastTickAt, progress?, actionType? } */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: { saveId?: string; lastTickAt?: number; progress?: number; actionType?: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });

	const now = Date.now();
	const lastTickAt = typeof body.lastTickAt === 'number' ? body.lastTickAt : now;
	const progress = typeof body.progress === 'number' ? Math.max(0, Math.min(1, body.progress)) : 0;
	const actionType = body.actionType === ACTION_TYPE_MINING ? ACTION_TYPE_MINING : ACTION_TYPE_MINING;

	const result = advanceAction({
		actionType,
		progress,
		lastTickAt,
		now,
		rateModifier: 1
	});

	await prisma.$transaction(async (tx) => {
		const save = await tx.incrementalSave.findUnique({ where: { id: saveId }, select: { essence: true } });
		if (!save) throw new Error('Save not found');
		const newEssence = (save.essence ?? 0) + result.essenceEarned;
		await tx.incrementalSave.update({
			where: { id: saveId },
			data: { essence: newEssence }
		});
		await tx.incrementalActionState.upsert({
			where: { saveId },
			create: {
				saveId,
				actionType,
				progress: result.progress,
				lastTickAt: new Date(now)
			},
			update: {
				actionType,
				progress: result.progress,
				lastTickAt: new Date(now)
			}
		});
	});

	const save = await prisma.incrementalSave.findUnique({
		where: { id: saveId },
		select: { essence: true }
	});

	return json({
		essence: save?.essence ?? 0,
		saveId,
		progress: result.progress,
		lastTickAt: now,
		essenceEarned: result.essenceEarned
	});
};
