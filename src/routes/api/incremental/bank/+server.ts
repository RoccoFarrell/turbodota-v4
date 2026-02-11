import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** GET /api/incremental/bank – return Essence and current action state for idle UI. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const [save, actionState] = await Promise.all([
		prisma.incrementalSave.findUnique({
			where: { id: resolvedSaveId },
			select: { essence: true }
		}),
		prisma.incrementalActionState.findUnique({
			where: { saveId: resolvedSaveId },
			select: { actionType: true, progress: true, lastTickAt: true, actionHeroId: true, actionStatKey: true }
		})
	]);
	return json({
		essence: save?.essence ?? 0,
		saveId: resolvedSaveId,
		actionType: actionState?.actionType ?? 'mining',
		progress: actionState?.progress ?? 0,
		lastTickAt: actionState?.lastTickAt ? new Date(actionState.lastTickAt).getTime() : Date.now(),
		actionHeroId: actionState?.actionHeroId ?? null,
		actionStatKey: actionState?.actionStatKey ?? null
	});
};
