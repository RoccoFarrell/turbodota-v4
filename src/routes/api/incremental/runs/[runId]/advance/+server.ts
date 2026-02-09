import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceRun, type RunServiceDb } from '$lib/incremental/run/run-service';
import { setBattleState } from '$lib/server/incremental-battle-cache';

/** POST /api/incremental/runs/[runId]/advance – body { nextNodeId }. Advance run; if combat/elite/boss, store battle and return encounter. */
export const POST: RequestHandler<{ runId: string }> = async ({
	params,
	request,
	locals
}) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const runId = params.runId;
	let body: { nextNodeId?: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const nextNodeId = body.nextNodeId;
	if (typeof nextNodeId !== 'string' || !nextNodeId.trim()) error(400, 'nextNodeId is required');
	try {
		const result = await advanceRun(
			prisma as unknown as RunServiceDb,
			runId,
			session.user.userId,
			nextNodeId.trim()
		);
		if (result.encounter) {
			setBattleState(runId, result.encounter.battleState);
			return json({
				runState: result.runState,
				encounter: {
					encounterId: result.encounter.encounterId,
					heroIds: result.encounter.heroIds,
					started: true
				}
			});
		}
		return json({ runState: result.runState });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Advance failed';
		if (msg.includes('not found') || msg.includes('Invalid next node')) error(400, msg);
		if (msg.includes('does not belong')) error(403, msg);
		if (msg.includes('not active')) error(400, msg);
		throw e;
	}
};
