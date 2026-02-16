import type { LayoutServerLoad } from './$types';
import prisma from '$lib/server/prisma';

/** If match data is older than this, we refresh from OpenDota when entering incremental. */
const MATCH_REFRESH_STALE_MINUTES = 30;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.auth.validate();
	if (!session?.user?.account_id) {
		return {};
	}

	const accountId = session.user.account_id;
	const dotaUser = await prisma.dotaUser.findUnique({
		where: { account_id: accountId },
		select: { lastUpdated: true }
	});

	const staleThreshold = new Date(Date.now() - MATCH_REFRESH_STALE_MINUTES * 60 * 1000);
	const isStale = !dotaUser?.lastUpdated || dotaUser.lastUpdated < staleThreshold;

	if (isStale) {
		try {
			await fetch(`${url.origin}/api/updateMatchesForUser/${accountId}`, { method: 'GET' });
		} catch (e) {
			console.error(`[incremental layout] updateMatchesForUser failed for ${accountId}:`, e);
		}
	}

	return { accountId };
};
