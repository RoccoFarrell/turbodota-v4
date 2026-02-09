import type { RequestHandler } from '@sveltejs/kit';

/**
 * Placeholder endpoint to reserve the api/incremental prefix.
 * Phase 6 will add lineups, runs, and battle API routes.
 */
export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
