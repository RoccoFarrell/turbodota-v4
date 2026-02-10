import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getAllowedHeroIds } from '$lib/server/incremental-hero-resolver';

const MIN_HEROES = 1;
const MAX_HEROES = 5;

function authLineup(lineup: { save?: { userId: string } | null }, sessionUserId: string) {
	if (!lineup?.save) error(404, 'Lineup not found');
	if (lineup.save.userId !== sessionUserId) error(403, 'Forbidden');
}

/** GET /api/incremental/lineups/[id] – get lineup (own only, via save) */
export const GET: RequestHandler<{ id: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: params.id },
		include: { save: { select: { userId: true } } }
	});
	authLineup(lineup, session.user.userId);
	return json(lineup);
};

/** PATCH /api/incremental/lineups/[id] – update name or heroIds */
export const PATCH: RequestHandler<{ id: string }> = async ({ params, request, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: params.id },
		include: { save: { select: { userId: true } } }
	});
	authLineup(lineup, session.user.userId);
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
		if (new Set(body.heroIds).size !== body.heroIds.length) {
			error(400, 'Each hero can only appear once in a lineup');
		}
		const allowedHeroIds = await getAllowedHeroIds();
		for (const hid of body.heroIds) {
			if (typeof hid !== 'number' || !Number.isInteger(hid)) error(400, 'heroIds must be integers');
			if (!allowedHeroIds.has(hid)) error(400, `Unknown hero id: ${hid}`);
		}
		const rosterRows = await prisma.incrementalRosterHero.findMany({
			where: { saveId: lineup!.saveId },
			select: { heroId: true }
		});
		const rosterSet = new Set(rosterRows.map((r) => r.heroId));
		for (const hid of body.heroIds) {
			if (!rosterSet.has(hid)) error(400, `Hero ${hid} is not on your roster`);
		}
		updates.heroIds = body.heroIds;
	}
	const updated = await prisma.incrementalLineup.update({
		where: { id: params.id },
		data: updates
	});
	return json(updated);
};

/** DELETE /api/incremental/lineups/[id] */
export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: params.id },
		include: { save: { select: { userId: true } } }
	});
	authLineup(lineup, session.user.userId);
	await prisma.incrementalLineup.delete({ where: { id: params.id } });
	return new Response(null, { status: 204 });
};
