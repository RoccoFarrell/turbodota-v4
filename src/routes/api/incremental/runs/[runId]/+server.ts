import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getRunState, type MapRunDb } from '$lib/incremental/data/run-map';

/** GET /api/incremental/runs/[runId] – run + map state (current node, next nodes). Own only. */
export const GET: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) error(404, 'Run not found');
	if (run.userId !== session.user.userId) error(403, 'Forbidden');
	const runState = await getRunState(prisma as unknown as MapRunDb, runId);
	if (!runState) error(404, 'Run state not found');
	return json(runState);
};
