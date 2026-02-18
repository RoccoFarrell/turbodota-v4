import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getRunState, type MapRunDb } from '$lib/incremental/data/run-map';

/** GET /api/incremental/runs/[runId] – run + map state (current node, next nodes). Own only. */
export const GET: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) error(404, 'Run not found');
	if (run.userId !== user.id) error(403, 'Forbidden');
	const runState = await getRunState(prisma as unknown as MapRunDb, runId);
	if (!runState) error(404, 'Run state not found');
	return json(runState);
};

/** PATCH /api/incremental/runs/[runId] – body { heroHp?: number[] | null }. Update run HP (e.g. heal). Own only. */
export const PATCH: RequestHandler<{ runId: string }> = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { userId: true, status: true, lineupId: true }
	});
	if (!run) error(404, 'Run not found');
	if (run.userId !== user.id) error(403, 'Forbidden');
	if (run.status !== 'ACTIVE') error(400, 'Run is not active');
	let body: { heroHp?: number[] | null };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	if (body.heroHp === undefined) error(400, 'heroHp is required');
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: run.lineupId },
		select: { heroIds: true }
	});
	if (!lineup) error(404, 'Lineup not found');
	if (body.heroHp === null) {
		await prisma.incrementalRun.update({
			where: { id: runId },
			data: { heroHp: null }
		});
		const runState = await getRunState(prisma as unknown as MapRunDb, runId);
		return json(runState);
	}
	if (!Array.isArray(body.heroHp) || body.heroHp.length !== lineup.heroIds.length) {
		error(400, 'heroHp must be an array with length matching lineup size');
	}
	for (const h of body.heroHp) {
		if (typeof h !== 'number' || h < 0 || !Number.isFinite(h)) error(400, 'Each heroHp must be a non-negative number');
	}
	await prisma.incrementalRun.update({
		where: { id: runId },
		data: { heroHp: body.heroHp }
	});
	const runState = await getRunState(prisma as unknown as MapRunDb, runId);
	return json(runState);
};
