import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getHeroDef } from '$lib/incremental/constants';

const MIN_HEROES = 1;
const MAX_HEROES = 5;

/** GET /api/incremental/lineups/[id] – get lineup (own only) */
export const GET: RequestHandler<{ id: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const id = params.id;
	const lineup = await prisma.incrementalLineup.findUnique({ where: { id } });
	if (!lineup) error(404, 'Lineup not found');
	if (lineup.userId !== session.user.userId) error(403, 'Forbidden');
	return json(lineup);
};

/** PATCH /api/incremental/lineups/[id] – update name or heroIds */
export const PATCH: RequestHandler<{ id: string }> = async ({
	params,
	request,
	locals
}) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const id = params.id;
	const lineup = await prisma.incrementalLineup.findUnique({ where: { id } });
	if (!lineup) error(404, 'Lineup not found');
	if (lineup.userId !== session.user.userId) error(403, 'Forbidden');
	let body: { name?: string; heroIds?: number[] };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const updates: { name?: string; heroIds?: number[] } = {};
	if (body.name !== undefined) {
		if (typeof body.name !== 'string') error(400, 'name must be a string');
		updates.name = body.name.trim();
	}
	if (body.heroIds !== undefined) {
		if (!Array.isArray(body.heroIds)) error(400, 'heroIds must be an array of numbers');
		if (body.heroIds.length < MIN_HEROES || body.heroIds.length > MAX_HEROES) {
			error(400, `heroIds must have ${MIN_HEROES}–${MAX_HEROES} heroes`);
		}
		for (const hid of body.heroIds) {
			if (typeof hid !== 'number' || !Number.isInteger(hid)) error(400, 'heroIds must be integers');
			if (!getHeroDef(hid)) error(400, `Unknown hero id: ${hid}`);
		}
		updates.heroIds = body.heroIds;
	}
	const updated = await prisma.incrementalLineup.update({
		where: { id },
		data: updates
	});
	return json(updated);
};

/** DELETE /api/incremental/lineups/[id] */
export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const id = params.id;
	const lineup = await prisma.incrementalLineup.findUnique({ where: { id } });
	if (!lineup) error(404, 'Lineup not found');
	if (lineup.userId !== session.user.userId) error(403, 'Forbidden');
	await prisma.incrementalLineup.delete({ where: { id } });
	return new Response(null, { status: 204 });
};
