import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceRun, type RunServiceDb } from '$lib/incremental/run/run-service';
import { getCachedBattle, clearBattleState } from '$lib/server/incremental-battle-cache';
import type { NodeClearance } from '$lib/incremental/types';
import { getRunState, type MapRunDb } from '$lib/incremental/data/run-map';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';
import { IncrementalRunStatus } from '@prisma/client';

/**
 * POST /api/incremental/runs/[runId]/battle/complete
 * Call after a win: advance run to the pending node (from battle/enter), record clearance, clear cache.
 * Returns runState so client can navigate to map.
 */
export const POST: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { userId: true, lineupId: true, currentNodeId: true, nodeClearances: true }
	});
	if (!run || run.userId !== user.id) error(404, 'Run not found');

	const cached = getCachedBattle(runId);
	if (!cached) error(400, 'No active battle to complete');
	if (cached.state.result !== 'win') error(400, 'Battle did not end in victory');
	const pendingNodeId = cached.pendingNodeId;
	if (!pendingNodeId) error(400, 'No pending node for this battle');

	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: run.lineupId },
		select: { saveId: true }
	});
	const defs = await getHeroDefsFromDb(lineup?.saveId ?? null);

	await advanceRun(prisma as unknown as RunServiceDb, runId, user.id, pendingNodeId, {
		getHeroDef: defs.getHeroDef
	});

	const clearance: NodeClearance = {
		outcome: 'victory',
		durationSeconds: cached.state.elapsedTime
	};
	const prev = (run.nodeClearances as Record<string, NodeClearance> | null) ?? {};
	const nodeClearances = { ...prev, [pendingNodeId]: clearance };

	const runAfter = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { currentNodeId: true }
	});
	const newNodeId = runAfter?.currentNodeId;
	const newNode =
		newNodeId &&
		(await prisma.incrementalMapNode.findUnique({
			where: { id: newNodeId },
			select: { nextNodeIds: true }
		}));
	const isFinalNode = (typeof newNode === 'object' && newNode?.nextNodeIds?.length ? newNode.nextNodeIds.length : 0) === 0;

	await prisma.incrementalRun.update({
		where: { id: runId },
		data: {
			nodeClearances: nodeClearances as any,
			...(isFinalNode ? { status: IncrementalRunStatus.WON, finishedAt: new Date() } : {})
		}
	});

	clearBattleState(runId);

	const runState = await getRunState(prisma as unknown as MapRunDb, runId);
	if (!runState) error(500, 'Run state not found after complete');
	return json({ runState });
};
