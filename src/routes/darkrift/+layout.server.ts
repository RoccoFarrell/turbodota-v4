import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import prisma from '$lib/server/prisma';

/** If match data is older than this, we refresh from OpenDota when entering incremental. */
const MATCH_REFRESH_STALE_MINUTES = 30;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (!user?.account_id) {
		if (url.pathname === '/darkrift/welcome') {
			return {};
		}
		redirect(302, '/darkrift/welcome');
	}

	const accountId = user.account_id;

	const [dotaUser, saves] = await Promise.all([
		prisma.dotaUser.findUnique({
			where: { account_id: accountId },
			select: { lastUpdated: true }
		}),
		prisma.incrementalSave.findMany({
			where: { userId: user.id },
			select: {
				id: true,
				name: true,
				createdAt: true,
				seasonId: true,
				season: { select: { id: true, name: true, startDate: true, endDate: true, active: true } }
			},
			orderBy: { createdAt: 'asc' }
		})
	]);

	const staleThreshold = new Date(Date.now() - MATCH_REFRESH_STALE_MINUTES * 60 * 1000);
	const isStale = !dotaUser?.lastUpdated || dotaUser.lastUpdated < staleThreshold;

	if (isStale) {
		try {
			await fetch(`${url.origin}/api/updateMatchesForUser/${accountId}`, { method: 'GET' });
		} catch (e) {
			console.error(`[incremental layout] updateMatchesForUser failed for ${accountId}:`, e);
		}
	}

	return {
		accountId,
		saves: saves.map((s) => ({
			id: s.id,
			name: s.name,
			createdAt: s.createdAt.toISOString(),
			season: s.season
				? {
						id: s.season.id,
						name: s.season.name,
						startDate: s.season.startDate.toISOString(),
						endDate: s.season.endDate.toISOString(),
						active: s.season.active
					}
				: null
		}))
	};
};
