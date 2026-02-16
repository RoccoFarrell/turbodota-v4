import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getMaxSlots } from '$lib/incremental/actions/slot-helpers';

/** GET /api/incremental/action/slots – return all active action slots for a save. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });

	const [slots, maxSlots] = await Promise.all([
		prisma.incrementalActionSlot.findMany({
			where: { saveId: resolvedSaveId },
			orderBy: { slotIndex: 'asc' }
		}),
		getMaxSlots(resolvedSaveId)
	]);

	return json({
		saveId: resolvedSaveId,
		maxSlots,
		slots: slots.map((s) => ({
			slotIndex: s.slotIndex,
			actionType: s.actionType,
			progress: s.progress,
			lastTickAt: s.lastTickAt.getTime(),
			actionHeroId: s.actionHeroId,
			actionStatKey: s.actionStatKey
		}))
	});
};

/** DELETE /api/incremental/action/slots – clear a specific slot. Body: { saveId?, slotIndex }. */
export const DELETE: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => ({}))) as {
		saveId?: string;
		slotIndex?: number;
	};
	const slotIndex = body.slotIndex;
	if (typeof slotIndex !== 'number' || slotIndex < 0) {
		error(400, 'slotIndex is required');
	}
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId: body.saveId });

	const now = new Date();

	await prisma.$transaction(async (tx) => {
		await tx.incrementalActionSlot.deleteMany({
			where: { saveId: resolvedSaveId, slotIndex }
		});

		// If clearing slot 0, also clear legacy table
		if (slotIndex === 0) {
			await tx.incrementalActionState.deleteMany({
				where: { saveId: resolvedSaveId }
			});
		}

		// Close any open history session for this slot
		await tx.incrementalActionHistory.updateMany({
			where: { saveId: resolvedSaveId, slotIndex, endedAt: null },
			data: { endedAt: now }
		});
	});

	return json({ saveId: resolvedSaveId, cleared: slotIndex });
};
