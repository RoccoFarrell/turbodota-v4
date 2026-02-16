import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { grantRunesForNewMatches } from '$lib/incremental/bank/grant-runes.server';
import { GAME_MODE_TURBO } from '$lib/constants/matches';

/**
 * POST /api/incremental/debug/simulate-dota-win
 *
 * Debug-only: simulates the flow "played a turbo/ranked game" by calling the same
 * grant logic used when real matches are synced. No Match row is created; we pass
 * a unique fake match_id so grantRunesForNewMatches runs and gives 1 Arcane Rune.
 *
 * Body: { count? } — number of "wins" to simulate (default 1, max 10). Each gets a unique fake match_id.
 * Only available when import.meta.env.DEV is true.
 */
export const POST: RequestHandler = async (event) => {
	if (!import.meta.env.DEV) {
		error(404, 'Not found');
	}

	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');

	const accountId = session.user.account_id;

	let body: { count?: number } = {};
	try {
		body = await event.request.json();
	} catch {
		// optional body
	}
	const count = Math.min(Math.max(1, Math.floor(Number(body.count) || 1)), 10);

	// Fake matches: use negative "match_id" so they never collide with real OpenDota ids.
	// Each call uses a unique id so we can simulate multiple wins.
	const baseId = -Math.abs(Date.now());
	const fakeMatches = Array.from({ length: count }, (_, i) => ({
		match_id: baseId - i,
		game_mode: GAME_MODE_TURBO
	}));

	const granted = await grantRunesForNewMatches(accountId, fakeMatches);

	return json({
		success: true,
		simulatedWins: count,
		runesGranted: granted,
		message: `Simulated ${count} Dota win(s). Granted ${granted} Arcane Rune(s). Open Inventory to use them.`
	});
};
