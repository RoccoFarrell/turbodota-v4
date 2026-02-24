/**
 * Resolve the incremental "save" (slot) for the current user.
 * APIs can pass saveId via query param or body; if missing, use or create the user's first save.
 */

import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { MATCH_CUTOFF_START_TIME } from '$lib/constants/matches';

export interface ResolvedSave {
	saveId: string;
	userId: string;
	account_id: number | null; // Per-save Dota account ID
	/** @deprecated Read essence from Bank via getBankBalance(saveId, 'essence') instead. */
	essence: number;
	/** Effective earliest match timestamp (unix seconds as BigInt) for season-aware queries. */
	matchCutoff: bigint;
}

/**
 * Compute the effective match cutoff for a save.
 * Fallback chain:
 *   1. Explicit season (seasonId)
 *   2. User's most recent active darkrift season (via league membership)
 *   3. DotaUser.createdDate
 *   4. MATCH_CUTOFF_START_TIME
 * Exported for unit testing.
 */
export async function computeMatchCutoff(
	seasonId: number | null,
	accountId: number | null
): Promise<bigint> {
	// 1. Explicit season linked to this save
	if (seasonId != null) {
		const season = await prisma.season.findUnique({
			where: { id: seasonId },
			select: { startDate: true }
		});
		if (season) {
			const seasonStart = BigInt(Math.floor(season.startDate.getTime() / 1000));
			return seasonStart > MATCH_CUTOFF_START_TIME ? seasonStart : MATCH_CUTOFF_START_TIME;
		}
	}

	// 2. Auto-detect: user's most recent active darkrift season
	if (accountId != null) {
		const activeSeason = await prisma.season.findFirst({
			where: {
				type: 'darkrift',
				active: true,
				members: { some: { account_id: accountId } }
			},
			select: { startDate: true },
			orderBy: { startDate: 'desc' }
		});
		if (activeSeason) {
			const seasonStart = BigInt(Math.floor(activeSeason.startDate.getTime() / 1000));
			return seasonStart > MATCH_CUTOFF_START_TIME ? seasonStart : MATCH_CUTOFF_START_TIME;
		}
	}

	// 3. DotaUser creation date
	if (accountId != null) {
		const dotaUser = await prisma.dotaUser.findUnique({
			where: { account_id: accountId },
			select: { createdDate: true }
		});
		if (dotaUser) {
			const userFloor = BigInt(Math.floor(dotaUser.createdDate.getTime() / 1000));
			return userFloor > MATCH_CUTOFF_START_TIME ? userFloor : MATCH_CUTOFF_START_TIME;
		}
	}

	// 4. Global floor
	return MATCH_CUTOFF_START_TIME;
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
			select: { id: true, userId: true, account_id: true, seasonId: true }
		});
		if (!save) error(404, 'Save not found');
		if (save.userId !== userId) error(403, 'Forbidden');
		const account_id = await ensureSaveAccountId(save, user.account_id);
		const seasonId = await ensureSaveSeasonId(save, account_id);
		const matchCutoff = await computeMatchCutoff(seasonId, account_id);
		return { saveId: save.id, userId: save.userId, account_id, essence: 0, matchCutoff };
	}

	// No saveId: use first save or create one
	let save = await prisma.incrementalSave.findFirst({
		where: { userId },
		select: { id: true, userId: true, account_id: true, seasonId: true },
		orderBy: { createdAt: 'asc' }
	});
	if (!save) {
		const detectedSeasonId = await detectActiveDarkriftSeason(user.account_id);
		save = await prisma.incrementalSave.create({
			data: {
				userId,
				account_id: user.account_id || null,
				seasonId: detectedSeasonId
			},
			select: { id: true, userId: true, account_id: true, seasonId: true }
		});
	}
	const account_id = await ensureSaveAccountId(save, user.account_id);
	const seasonId = await ensureSaveSeasonId(save, account_id);
	const matchCutoff = await computeMatchCutoff(seasonId, account_id);
	return { saveId: save.id, userId: save.userId, account_id, essence: 0, matchCutoff };
}

/**
 * Detect the user's most recent active darkrift season from league membership.
 * Returns the season id or null if none found.
 */
async function detectActiveDarkriftSeason(accountId: number | null): Promise<number | null> {
	if (accountId == null) return null;
	const season = await prisma.season.findFirst({
		where: {
			type: 'darkrift',
			active: true,
			members: { some: { account_id: accountId } }
		},
		select: { id: true },
		orderBy: { startDate: 'desc' }
	});
	return season?.id ?? null;
}

/**
 * If the save has no seasonId, auto-detect from the user's active darkrift season and persist.
 * Returns the effective seasonId for the save.
 */
async function ensureSaveSeasonId(
	save: { id: string; seasonId: number | null },
	accountId: number | null
): Promise<number | null> {
	if (save.seasonId != null) return save.seasonId;
	const detectedSeasonId = await detectActiveDarkriftSeason(accountId);
	if (detectedSeasonId == null) return null;
	await prisma.incrementalSave.update({
		where: { id: save.id },
		data: { seasonId: detectedSeasonId }
	});
	return detectedSeasonId;
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
