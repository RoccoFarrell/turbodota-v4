import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { createEncounterForNode, type RunServiceDb } from '$lib/incremental/run/run-service';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';

/**
 * POST /api/incremental/runs/[runId]/battle/enter – body { nextNodeId }.
 * Start a battle for the given next node without advancing the run.
 * Returns full battleState + defs so client can run simulation locally.
 * Run advances only when the user wins (call battle/complete from battle page).
 */
export const POST: RequestHandler<{ runId: string }> = async ({
	params,
	request,
	locals
}) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
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
			select: { lineupId: true, userId: true }
		});
		if (!run || run.userId !== user.id) error(404, 'Run not found');
		const lineup = await prisma.incrementalLineup.findUnique({
			where: { id: run.lineupId },
			select: { saveId: true, heroIds: true }
		});
		const defs = await getHeroDefsFromDb(lineup?.saveId ?? null);

		const encounter = await createEncounterForNode(
			prisma as unknown as RunServiceDb,
			runId,
			user.id,
			nextNodeId.trim(),
			{ getHeroDef: defs.getHeroDef }
		);

		const heroDefs: Record<string, import('$lib/incremental/types').HeroDef> = {};
		const abilityDefs: Record<string, import('$lib/incremental/types').AbilityDef> = {};
		for (const heroId of encounter.heroIds) {
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

		return json({
			started: true,
			battleState: encounter.battleState,
			heroDefs,
			abilityDefs
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Enter battle failed';
		if (msg.includes('not found') || msg.includes('Invalid next node') || msg.includes('not a combat')) error(400, msg);
		if (msg.includes('does not belong')) error(403, msg);
		if (msg.includes('not active')) error(400, msg);
		throw e;
	}
};
