import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { tick } from '$lib/incremental/engine/battle-loop';
import {
	getBattleState,
	getCachedBattle,
	getPendingNodeId,
	setBattleState,
	clearBattleState,
	withBattleTickLock
} from '$lib/server/incremental-battle-cache';
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
	let body: {
		focusedHeroIndex?: number;
		targetIndex?: number;
		deltaTime?: number;
		autoRotateFrontLiner?: boolean;
		resetHp?: boolean;
	};
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const cached = getCachedBattle(runId);
	if (!cached) error(404, 'No active battle for this run');

	if (body.resetHp) {
		const state = {
			...cached.state,
			player: cached.state.player.map((p) => ({ ...p, currentHp: p.maxHp })),
			enemy: cached.state.enemy.map((e) => ({ ...e, currentHp: e.maxHp }))
		};
		setBattleState(runId, state, cached.heroDefs, cached.abilityDefs, cached.pendingNodeId);
		return json(state);
	}

	const deltaTime = typeof body.deltaTime === 'number' ? body.deltaTime : 0.1;
	const options: { focusChange?: number; targetChange?: number; autoRotateFrontLiner?: boolean } = {};
	if (typeof body.focusedHeroIndex === 'number') options.focusChange = body.focusedHeroIndex;
	if (typeof body.targetIndex === 'number') options.targetChange = body.targetIndex;
	if (body.autoRotateFrontLiner === true) options.autoRotateFrontLiner = true;

	// Serialize ticks per runId so each PATCH sees the previous tick's state (e.g. lastSpellAbilityIndex advances)
	const state = await withBattleTickLock(runId, async () => {
		const c = getCachedBattle(runId);
		if (!c) return null;
		const defs = {
			getHeroDef: (heroId: number) => c.heroDefs[String(heroId)],
			getAbilityDef: (abilityId: string) => c.abilityDefs[abilityId]
		};
		const next = tick(c.state, deltaTime, options, defs);
		setBattleState(runId, next, c.heroDefs, c.abilityDefs, c.pendingNodeId);
		return next;
	});
	if (!state) error(404, 'No active battle for this run');

	if (state.result !== null) {
		if (state.result === 'lose') {
			clearBattleState(runId);
			await prisma.incrementalRun.update({
				where: { id: runId },
				data: { status: IncrementalRunStatus.DEAD, finishedAt: new Date() }
			});
		} else {
			// Win: apply small heal, grant gold/XP, persist hero HP. Do NOT clear cache – battle/complete will advance run and clear.
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
			await prisma.incrementalRun.update({
				where: { id: runId },
				data: {
					gold: newGold,
					heroHp: healed,
					xpByHeroId: newXpByHeroId
				}
			});
		}
	}

	return json(state);
};
