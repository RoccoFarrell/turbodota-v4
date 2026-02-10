/**
 * Resolve the incremental "save" (slot) for the current user.
 * APIs can pass saveId via query param or body; if missing, use or create the user's first save.
 */

import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export interface ResolvedSave {
	saveId: string;
	userId: string;
	essence: number;
}

/**
 * Get save for incremental APIs. Requires auth.
 * - If saveId is provided (query or body), load it and verify save.userId === session.userId.
 * - Otherwise, get the first save for the user, or create one if none exist.
 */
export async function resolveIncrementalSave(
	event: RequestEvent,
	opts: { saveId?: string | null }
): Promise<ResolvedSave> {
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;

	const saveId = opts.saveId?.trim() || null;

	if (saveId) {
		const save = await prisma.incrementalSave.findUnique({
			where: { id: saveId },
			select: { id: true, userId: true, essence: true }
		});
		if (!save) error(404, 'Save not found');
		if (save.userId !== userId) error(403, 'Forbidden');
		return { saveId: save.id, userId: save.userId, essence: save.essence ?? 0 };
	}

	// No saveId: use first save or create one
	let save = await prisma.incrementalSave.findFirst({
		where: { userId },
		select: { id: true, userId: true, essence: true },
		orderBy: { createdAt: 'asc' }
	});
	if (!save) {
		save = await prisma.incrementalSave.create({
			data: { userId },
			select: { id: true, userId: true, essence: true }
		});
	}
	return { saveId: save.id, userId: save.userId, essence: save.essence ?? 0 };
}
