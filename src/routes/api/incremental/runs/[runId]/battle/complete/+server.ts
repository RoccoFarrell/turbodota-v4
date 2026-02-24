import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceRun, type RunServiceDb } from '$lib/incremental/run/run-service';
import type { NodeClearance } from '$lib/incremental/types';
import { getRunState, type MapRunDb } from '$lib/incremental/data/run-map';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';
import { IncrementalRunStatus } from '@prisma/client';
import {
	GOLD_PER_ENCOUNTER_WIN,
	XP_PER_HERO_WIN,
	HEAL_PERCENT_ON_WIN
} from '$lib/incremental/constants';

/**
 * POST /api/incremental/runs/[runId]/battle/complete
 * Called by client after battle ends.
 * Body: { nodeId, result: 'win'|'lose', elapsedTime?, heroHp?, playerHeroIds? }
 * Win: apply rewards, advance run, record clearance.
 * Lose: mark run DEAD.
 */
export const POST: RequestHandler<{ runId: string }> = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const runId = params.runId;

	let body: {
		nodeId?: string;
		result?: 'win' | 'lose';
		elapsedTime?: number;
		heroHp?: number[];
		playerHeroIds?: number[];
	};
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const nodeId = body.nodeId;
	const result = body.result;
	if (typeof nodeId !== 'string' || !nodeId.trim()) error(400, 'nodeId is required');
	if (result !== 'win' && result !== 'lose') error(400, 'result must be "win" or "lose"');

	const run = await prisma.incrementalRun.findUnique({
		where: { id: runId },
		select: { userId: true, lineupId: true, currentNodeId: true, nodeClearances: true, gold: true, xpByHeroId: true, heroHp: true }
	});
	if (!run || run.userId !== user.id) error(404, 'Run not found');

	if (result === 'lose') {
		await prisma.incrementalRun.update({
			where: { id: runId },
			data: { status: IncrementalRunStatus.DEAD, finishedAt: new Date() }
		});
		return json({ result: 'lose' });
	}

	// Win path: advance run, apply rewards
	const lineup = await prisma.incrementalLineup.findUnique({
		where: { id: run.lineupId },
		select: { saveId: true }
	});
	const defs = await getHeroDefsFromDb(lineup?.saveId ?? null);

	await advanceRun(prisma as unknown as RunServiceDb, runId, user.id, nodeId.trim(), {
		getHeroDef: defs.getHeroDef
	});

	// Record clearance
	const clearance: NodeClearance = {
		outcome: 'victory',
		durationSeconds: typeof body.elapsedTime === 'number' ? body.elapsedTime : 0
	};
	const prev = (run.nodeClearances as Record<string, NodeClearance> | null) ?? {};
	const nodeClearances = { ...prev, [nodeId.trim()]: clearance };

	// Apply gold + XP rewards
	const newGold = (run.gold ?? 0) + GOLD_PER_ENCOUNTER_WIN;
	const prevXp = (run.xpByHeroId as Record<string, number> | null) ?? {};
	const newXpByHeroId: Record<string, number> = { ...prevXp };
	const playerHeroIds = body.playerHeroIds ?? [];
	for (const heroId of playerHeroIds) {
		const key = String(heroId);
		newXpByHeroId[key] = (prevXp[key] ?? 0) + XP_PER_HERO_WIN;
	}

	// Apply healed HP from client (heroes heal HEAL_PERCENT_ON_WIN on win)
	const heroHp = body.heroHp ?? (run.heroHp as number[] | null) ?? [];

	// Check if run is won (final node)
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
			gold: newGold,
			heroHp,
			xpByHeroId: newXpByHeroId,
			...(isFinalNode ? { status: IncrementalRunStatus.WON, finishedAt: new Date() } : {})
		}
	});

	const runState = await getRunState(prisma as unknown as MapRunDb, runId);
	if (!runState) error(500, 'Run state not found after complete');
	return json({ runState });
};
