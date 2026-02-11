import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { startRun, type RunServiceDb } from '$lib/incremental/run/run-service';

/** GET /api/incremental/runs – list current user's runs (most recent first). */
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const runs = await prisma.incrementalRun.findMany({
		where: { userId: session.user.userId },
		orderBy: { startedAt: 'desc' },
		select: { id: true, status: true, startedAt: true }
	});
	return json({ runs });
};

/** POST /api/incremental/runs – start run. Body: { lineupId, seed? } */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const userId = session.user.userId;
	let body: { lineupId?: string; seed?: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const lineupId = body.lineupId;
	if (typeof lineupId !== 'string' || !lineupId.trim()) error(400, 'lineupId is required');
	try {
		const result = await startRun(
			prisma as unknown as RunServiceDb,
			userId,
			lineupId.trim(),
			{ seed: body.seed }
		);
		return json(result);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to start run';
		if (msg.includes('not found') || msg.includes('does not belong')) error(404, msg);
		if (msg.includes('1–5 heroes')) error(400, msg);
		throw e;
	}
}
