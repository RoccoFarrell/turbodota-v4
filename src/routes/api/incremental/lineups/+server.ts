import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import {
	createLineup,
	getLineupsBySaveId,
	type IncrementalDb
} from '$lib/incremental/data/lineup';
import { getHeroDef } from '$lib/incremental/constants';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

const MIN_HEROES = 1;
const MAX_HEROES = 5;

/** GET /api/incremental/lineups – list lineups for current save. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const lineups = await getLineupsBySaveId(prisma as unknown as IncrementalDb, resolvedSaveId);
	return json({ lineups, saveId: resolvedSaveId });
};

/** POST /api/incremental/lineups – create lineup. Body: { saveId?, name, heroIds } */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: { saveId?: string; name?: string; heroIds?: number[] };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
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
	const rosterRows = await prisma.incrementalRosterHero.findMany({
		where: { saveId: resolvedSaveId },
		select: { heroId: true }
	});
	const rosterSet = new Set(rosterRows.map((r) => r.heroId));
	for (const id of heroIds) {
		if (!rosterSet.has(id)) error(400, `Hero ${id} is not on your roster`);
	}
	const lineup = await createLineup(prisma as unknown as IncrementalDb, {
		saveId: resolvedSaveId,
		name: name.trim(),
		heroIds
	});
	return json({ ...lineup, saveId: resolvedSaveId });
};
