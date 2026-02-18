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
	account_id: number | null; // Per-save Dota account ID
	/** @deprecated Read essence from Bank via getBankBalance(saveId, 'essence') instead. */
	essence: number;
}

/**
 * Get save for incremental APIs. Requires auth.
 * - If saveId is provided (query or body), load it and verify save.userId === user.id.
 * - Otherwise, get the first save for the user, or create one if none exist.
 *
 * When creating a new save, account_id is initialized from the user's account_id if available.
 *
 * Note: `essence` in the return value is always 0 – callers should use the Bank service
 * (`getBankBalance(saveId, 'essence')`) for actual balances.
 */
export async function resolveIncrementalSave(
	event: RequestEvent,
	opts: { saveId?: string | null }
): Promise<ResolvedSave> {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');
	const userId = user.id;

	const saveId = opts.saveId?.trim() || null;

	if (saveId) {
		const save = await prisma.incrementalSave.findUnique({
			where: { id: saveId },
			select: { id: true, userId: true, account_id: true }
		});
		if (!save) error(404, 'Save not found');
		if (save.userId !== userId) error(403, 'Forbidden');
		const account_id = await ensureSaveAccountId(save, user.account_id);
		return { saveId: save.id, userId: save.userId, account_id, essence: 0 };
	}

	// No saveId: use first save or create one
	let save = await prisma.incrementalSave.findFirst({
		where: { userId },
		select: { id: true, userId: true, account_id: true },
		orderBy: { createdAt: 'asc' }
	});
	if (!save) {
		// Create new save with account_id from user if available
		save = await prisma.incrementalSave.create({
			data: {
				userId,
				account_id: user.account_id || null
			},
			select: { id: true, userId: true, account_id: true }
		});
	}
	const account_id = await ensureSaveAccountId(save, user.account_id);
	return { saveId: save.id, userId: save.userId, account_id, essence: 0 };
}

/**
 * If the save has no account_id but the user has one (e.g. set on profile), use it and persist to the save.
 * Returns the effective account_id for the save.
 */
async function ensureSaveAccountId(
	save: { id: string; account_id: number | null },
	userAccountId: number | null
): Promise<number | null> {
	if (save.account_id != null) return save.account_id;
	if (userAccountId == null) return null;
	await prisma.incrementalSave.update({
		where: { id: save.id },
		data: { account_id: userAccountId }
	});
	return userAccountId;
}
