import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

/** Delay between calling updateMatchesForUser for each member (OpenDota rate limit). */
const DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/leagues/[slug]/refresh-matches
 * Refreshes match data from OpenDota for every member of the league.
 * Slug = league id. Dev role required.
 */
export const POST: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user || !user.roles?.includes('dev')) {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const leagueId = parseInt(params.slug ?? '', 10);
	if (Number.isNaN(leagueId)) {
		return json({ ok: false, error: 'Invalid league' }, { status: 400 });
	}

	const league = await prisma.league.findUnique({
		where: { id: leagueId },
		select: { members: { select: { account_id: true } } }
	});
	if (!league || !league.members.length) {
		return json({ ok: false, error: 'League not found or has no members' }, { status: 404 });
	}

	const accountIds = league.members.map((m) => m.account_id);
	const origin = url.origin;

	let updated = 0;
	for (let i = 0; i < accountIds.length; i++) {
		const account_id = accountIds[i];
		try {
			const res = await fetch(`${origin}/api/updateMatchesForUser/${account_id}?full=1`);
			if (res.ok) updated += 1;
		} catch (e) {
			console.error(`[refresh-matches] Failed for account_id ${account_id}:`, e);
		}
		if (i < accountIds.length - 1) {
			await sleep(DELAY_MS);
		}
	}

	return json({ ok: true, updated, total: accountIds.length });
};
