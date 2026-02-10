import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import {
	TALENT_NODES,
	getTalentNode,
	TALENT_POINTS_PER_HERO
} from '$lib/incremental/constants/talent-nodes';

/** GET /api/incremental/talents – points earned/spent and purchased nodes. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const [rosterCount, purchased] = await Promise.all([
		prisma.incrementalRosterHero.count({ where: { saveId: resolvedSaveId } }),
		prisma.incrementalTalentNode.findMany({
			where: { saveId: resolvedSaveId },
			select: { nodeId: true }
		})
	]);
	const pointsEarned = rosterCount * TALENT_POINTS_PER_HERO;
	const pointsSpent = purchased.length;
	const purchasedNodeIds = purchased.map((p) => p.nodeId);
	return json({
		saveId: resolvedSaveId,
		pointsEarned,
		pointsSpent,
		pointsAvailable: Math.max(0, pointsEarned - pointsSpent),
		purchasedNodeIds,
		nodes: TALENT_NODES
	});
};

/** POST /api/incremental/talents – purchase a talent node. Body: { saveId?, nodeId }. */
export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => ({})) as { saveId?: string; nodeId?: string };
	const nodeId = body.nodeId?.trim();
	if (!nodeId) error(400, 'nodeId is required');
	const def = getTalentNode(nodeId);
	if (!def) error(400, 'Unknown talent node');
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
	const [rosterCount, existing] = await Promise.all([
		prisma.incrementalRosterHero.count({ where: { saveId: resolvedSaveId } }),
		prisma.incrementalTalentNode.findUnique({
			where: { saveId_nodeId: { saveId: resolvedSaveId, nodeId } }
		})
	]);
	if (existing) error(400, 'Already purchased');
	const pointsEarned = rosterCount * TALENT_POINTS_PER_HERO;
	const purchasedCount = await prisma.incrementalTalentNode.count({
		where: { saveId: resolvedSaveId }
	});
	if (pointsEarned - purchasedCount < 1) error(400, 'Not enough talent points');
	for (const prereqId of def.prerequisiteIds) {
		const has = await prisma.incrementalTalentNode.findUnique({
			where: { saveId_nodeId: { saveId: resolvedSaveId, nodeId: prereqId } }
		});
		if (!has) error(400, `Requires talent: ${prereqId}`);
	}
	await prisma.incrementalTalentNode.create({
		data: { saveId: resolvedSaveId, nodeId }
	});
	return json({ saveId: resolvedSaveId, purchased: nodeId });
};
