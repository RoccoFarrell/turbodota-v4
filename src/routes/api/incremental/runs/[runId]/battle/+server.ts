import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { tick } from '$lib/incremental/engine/battle-loop';
import { getBattleState, setBattleState, clearBattleState } from '$lib/server/incremental-battle-cache';
import {
	GOLD_PER_ENCOUNTER_WIN,
	XP_PER_HERO_WIN,
	HEAL_PERCENT_ON_WIN
} from '$lib/incremental/constants';
import { IncrementalRunStatus } from '@prisma/client';

/** GET /api/incremental/runs/[runId]/battle – current battle state (if in encounter). */
export const GET: RequestHandler<{ runId: string }> = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) error(404, 'Run not found');
	if (run.userId !== session.user.userId) error(403, 'Forbidden');
	const state = getBattleState(runId);
	if (!state) error(404, 'No active battle for this run');
	return json(state);
};

/** PATCH /api/incremental/runs/[runId]/battle – tick battle. Body: { focusedHeroIndex?, targetIndex?, deltaTime }. */
export const PATCH: RequestHandler<{ runId: string }> = async ({
	params,
	request,
	locals
}) => {
	const session = await locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const runId = params.runId;
	const run = await prisma.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) error(404, 'Run not found');
	if (run.userId !== session.user.userId) error(403, 'Forbidden');
	let state = getBattleState(runId);
	if (!state) error(404, 'No active battle for this run');

	let body: { focusedHeroIndex?: number; targetIndex?: number; deltaTime?: number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const deltaTime = typeof body.deltaTime === 'number' ? body.deltaTime : 0.1;
	const options: { focusChange?: number; targetChange?: number } = {};
	if (typeof body.focusedHeroIndex === 'number') options.focusChange = body.focusedHeroIndex;
	if (typeof body.targetIndex === 'number') options.targetChange = body.targetIndex;

	state = tick(state, deltaTime, options);
	setBattleState(runId, state);

	if (state.result !== null) {
		clearBattleState(runId);
		if (state.result === 'lose') {
			await prisma.incrementalRun.update({
				where: { id: runId },
				data: { status: IncrementalRunStatus.DEAD, finishedAt: new Date() }
			});
		} else {
			// Win: apply small heal, grant gold/XP, persist hero HP; set WON + finishedAt only if final node
			const healed = state.player.map((p) => {
				const heal = p.maxHp * HEAL_PERCENT_ON_WIN;
				return Math.min(p.currentHp + heal, p.maxHp);
			});
			const runRewards = run as { gold?: number; xpByHeroId?: Record<string, number> | null };
			const newGold = (runRewards.gold ?? 0) + GOLD_PER_ENCOUNTER_WIN;
			const prevXp = runRewards.xpByHeroId ?? {};
			const newXpByHeroId: Record<string, number> = { ...prevXp };
			for (const p of state.player) {
				const key = String(p.heroId);
				newXpByHeroId[key] = (prevXp[key] ?? 0) + XP_PER_HERO_WIN;
			}
			const currentNode = await prisma.incrementalMapNode.findUnique({
				where: { id: run.currentNodeId }
			});
			const isFinalNode = (currentNode?.nextNodeIds?.length ?? 0) === 0;
			await prisma.incrementalRun.update({
				where: { id: runId },
				data: {
					gold: newGold,
					heroHp: healed,
					xpByHeroId: newXpByHeroId,
					...(isFinalNode
						? { status: IncrementalRunStatus.WON, finishedAt: new Date() }
						: {})
				}
			});
		}
	}

	return json(state);
};
