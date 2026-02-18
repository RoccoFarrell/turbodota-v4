import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { IncrementalRunStatus } from '@prisma/client';

/** POST /api/incremental/runs/[runId]/cancel – end all active runs for this run's lineup (set to DEAD) so a new run can be started. Own only; run must be ACTIVE. */
export const POST: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { userId: true, status: true, lineupId: true }
	});
	if (!run) error(404, 'Run not found');
	if (run.userId !== user.id) error(403, 'Forbidden');
	if (run.status !== 'ACTIVE') error(400, 'Only an active run can be cancelled');

	const finishedAt = new Date();
	// Cancel all ACTIVE runs for this lineup so the card clears and timestamp doesn't "move back" to an older run
	await prisma.incrementalRun.updateMany({
		where: { lineupId: run.lineupId, status: 'ACTIVE' },
		data: { status: IncrementalRunStatus.DEAD, finishedAt }
	});

	return json({ ok: true, runId });
};
