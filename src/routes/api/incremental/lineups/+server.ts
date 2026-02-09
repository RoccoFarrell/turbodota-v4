import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import {
	createLineup,
	getLineupsByUserId,
	type IncrementalDb
} from '$lib/incremental/data/lineup';
import { getHeroDef } from '$lib/incremental/constants';

const MIN_HEROES = 1;
const MAX_HEROES = 5;

/** GET /api/incremental/lineups – list current user's lineups */
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;
	const lineups = await getLineupsByUserId(prisma as unknown as IncrementalDb, userId);
	return json(lineups);
};

/** POST /api/incremental/lineups – create lineup. Body: { name, heroIds } */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;
	let body: { name?: string; heroIds?: number[] };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { name, heroIds } = body;
	if (typeof name !== 'string' || !name.trim()) error(400, 'name is required');
	if (!Array.isArray(heroIds)) error(400, 'heroIds must be an array of numbers');
	if (heroIds.length < MIN_HEROES || heroIds.length > MAX_HEROES) {
		error(400, `heroIds must have ${MIN_HEROES}–${MAX_HEROES} heroes`);
	}
	for (const id of heroIds) {
		if (typeof id !== 'number' || !Number.isInteger(id)) error(400, 'heroIds must be integers');
		if (!getHeroDef(id)) error(400, `Unknown hero id: ${id}`);
	}
	const lineup = await createLineup(prisma as unknown as IncrementalDb, {
		userId,
		name: name.trim(),
		heroIds
	});
	return json(lineup);
};
