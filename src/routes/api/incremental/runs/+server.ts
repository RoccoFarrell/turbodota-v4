import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { startRun, type RunServiceDb } from '$lib/incremental/run/run-service';

/** GET /api/incremental/runs – list current user's runs (most recent first). */
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runs = await prisma.incrementalRun.findMany({
		where: { userId: user.id },
		orderBy: { startedAt: 'desc' },
		select: { id: true, status: true, startedAt: true, level: true }
	});
	return json({ runs });
};

/** POST /api/incremental/runs – start run. Body: { lineupId, seed?, level? }
 *  When level is omitted, auto-advances to highestWonLevel + 1. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const userId = user.id;
	let body: { lineupId?: string; seed?: string; level?: number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const lineupId = body.lineupId;
	if (typeof lineupId !== 'string' || !lineupId.trim()) error(400, 'lineupId is required');
	try {
		// Auto-determine level: highest won level + 1 (unless client explicitly sets it)
		let level = body.level;
		if (level == null) {
			const wonRuns = await prisma.incrementalRun.findMany({
				where: { userId, status: 'WON' },
				select: { level: true }
			});
			const highestWon = wonRuns.reduce((max, r) => Math.max(max, r.level ?? 1), 0);
			level = highestWon + 1;
		}
		const result = await startRun(
			prisma as unknown as RunServiceDb,
			userId,
			lineupId.trim(),
			{ seed: body.seed, level }
		);
		return json(result);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to start run';
		if (msg.includes('not found') || msg.includes('does not belong')) error(404, msg);
		if (msg.includes('1–5 heroes')) error(400, msg);
		throw e;
	}
}
