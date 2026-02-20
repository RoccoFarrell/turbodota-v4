import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import {
	getRunState,
	getRunMapNodes,
	type MapRunDb
} from '$lib/incremental/data/run-map';

/** GET /api/incremental/runs/[runId]/map – run state + all map nodes + lineup (for roster quick edit). */
export const GET: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { userId: true, lineupId: true, heroHp: true, status: true, level: true }
	});
	if (!run) error(404, 'Run not found');
	if (run.userId !== user.id) error(403, 'Forbidden');
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: run.lineupId },
		select: { heroIds: true }
	});
	const db = prisma as unknown as MapRunDb;
	const [runState, nodes] = await Promise.all([
		getRunState(db, runId),
		getRunMapNodes(db, runId)
	]);
	if (!runState) error(404, 'Run state not found');
	const lineupForEdit =
		lineup && run.status === 'ACTIVE'
			? { lineupId: run.lineupId, heroIds: lineup.heroIds, heroHp: run.heroHp }
			: null;
	return json({ runState, nodes, lineup: lineupForEdit, level: run.level ?? 1 });
};
