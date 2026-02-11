import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { advanceRun, type RunServiceDb } from '$lib/incremental/run/run-service';
import { setBattleState } from '$lib/server/incremental-battle-cache';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';

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
		const run = await prisma.incrementalRun.findUnique({
			where: { id: runId },
			select: { lineupId: true, userId: true, nodeClearances: true }
		});
		if (!run || run.userId !== session.user.userId) error(404, 'Run not found');
		const lineup = await prisma.incrementalLineup.findUnique({
			where: { id: run.lineupId },
			select: { saveId: true, heroIds: true }
		});
		const defs = await getHeroDefsFromDb(lineup?.saveId ?? null);

		const result = await advanceRun(
			prisma as unknown as RunServiceDb,
			runId,
			session.user.userId,
			nextNodeId.trim(),
			{ getHeroDef: defs.getHeroDef }
		);
		// Record "skip" clearance when advancing to non-encounter node (e.g. BASE)
		if (!result.encounter) {
			const prev = (run.nodeClearances as Record<string, { outcome: string; [key: string]: unknown }> | null) ?? {};
			const nodeClearances = { ...prev, [nextNodeId.trim()]: { outcome: 'skip' as const } };
			await prisma.incrementalRun.update({
				where: { id: runId },
				data: { nodeClearances }
			});
		}
		if (result.encounter) {
			const heroDefs: Record<string, import('$lib/incremental/types').HeroDef> = {};
			const abilityDefs: Record<string, import('$lib/incremental/types').AbilityDef> = {};
			for (const heroId of result.encounter.heroIds) {
				const d = defs.getHeroDef(heroId);
				if (d) {
					heroDefs[String(heroId)] = d;
					for (const abilityId of d.abilityIds) {
						if (!(abilityId in abilityDefs)) {
							const a = defs.getAbilityDef(abilityId);
							if (a) abilityDefs[abilityId] = a;
						}
					}
				}
			}
			setBattleState(runId, result.encounter.battleState, heroDefs, abilityDefs);
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
