import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import {
	createLineup,
	getLineupsBySaveId,
	type IncrementalDb
} from '$lib/incremental/data/lineup';
import { getAllowedHeroIds } from '$lib/server/incremental-hero-resolver';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

const MIN_HEROES = 1;
const MAX_HEROES = 5;

/** GET /api/incremental/lineups – list lineups for current save. Query: saveId (optional). Includes activeRun per lineup when authenticated. */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const lineups = await getLineupsBySaveId(prisma as unknown as IncrementalDb, resolvedSaveId);

	const user = event.locals.user;
	let lineupsWithRuns = lineups;
	if (user && lineups.length > 0) {
		const lineupIds = lineups.map((l) => l.id);
		const activeRuns = await prisma.incrementalRun.findMany({
			where: {
				userId: user.id,
				lineupId: { in: lineupIds },
				status: 'ACTIVE'
			},
			select: { id: true, lineupId: true, status: true, currentNodeId: true, startedAt: true },
			orderBy: { startedAt: 'desc' }
		});
		// One run per lineup: keep the most recent (first after orderBy desc)
		const runByLineupId = new Map<string, (typeof activeRuns)[0]>();
		for (const r of activeRuns) {
			if (!runByLineupId.has(r.lineupId)) runByLineupId.set(r.lineupId, r);
		}
		lineupsWithRuns = lineups.map((l) => {
			const run = runByLineupId.get(l.id);
			return {
				...l,
				activeRun: run
					? {
							runId: run.id,
							status: run.status,
							currentNodeId: run.currentNodeId,
							startedAt: run.startedAt.getTime()
						}
					: null
			};
		});
	} else {
		lineupsWithRuns = lineups.map((l) => ({ ...l, activeRun: null }));
	}

	return json({ lineups: lineupsWithRuns, saveId: resolvedSaveId });
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
	if (new Set(heroIds).size !== heroIds.length) {
		error(400, 'Each hero can only appear once in a lineup');
	}
	const allowedHeroIds = await getAllowedHeroIds();
	for (const id of heroIds) {
		if (typeof id !== 'number' || !Number.isInteger(id)) error(400, 'heroIds must be integers');
		if (!allowedHeroIds.has(id)) error(400, `Unknown hero id: ${id}`);
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
