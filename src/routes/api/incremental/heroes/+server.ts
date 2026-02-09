import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { heroes } from '$lib/incremental/constants';

/** GET /api/incremental/heroes – hero definitions for lineup builder UI */
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	return json(heroes);
};
