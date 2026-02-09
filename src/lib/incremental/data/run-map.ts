/**
 * Run map: createRunMap (assign map nodes to run), getRunState (run + current node + next choices).
 */

import type { RunState } from '../types';
import { generateMapForRun } from '../map/graph';

/** DB interface extended with run-by-id and map node operations. */
export interface MapRunDb {
	incrementalRun: {
		findUnique: (args: { where: { id: string } }) => Promise<{
			id: string;
			status: string;
			currentNodeId: string;
			heroHp?: number[] | null;
		} | null>;
		update: (args: {
			where: { id: string };
			data: { currentNodeId: string; heroHp?: null };
		}) => Promise<unknown>;
	};
	incrementalMapNode: {
		createMany: (args: {
			data: Array<{
				id: string;
				runId: string;
				nodeType: string;
				encounterId: string | null;
				nextNodeIds: string[];
				floor?: number;
				act?: number;
			}>;
		}) => Promise<unknown>;
		findUnique: (args: { where: { id: string } }) => Promise<{
			id: string;
			nodeType: string;
			encounterId: string | null;
			nextNodeIds: string[];
		} | null>;
	};
}

/** Map Prisma run status to RunStatus. */
function toRunStatus(status: string): RunState['status'] {
	const s = status.toUpperCase();
	if (s === 'WON') return 'won';
	if (s === 'DEAD') return 'dead';
	return 'active';
}

/**
 * Create map nodes for the run and set run.currentNodeId to the first node.
 * Run must already exist (e.g. created with a placeholder currentNodeId).
 */
export async function createRunMap(
	db: MapRunDb,
	runId: string,
	seed?: string
): Promise<{ firstNodeId: string; nodeCount: number }> {
	const nodes = generateMapForRun(runId, seed);
	if (nodes.length === 0) throw new Error('Generated map has no nodes');
	await db.incrementalMapNode.createMany({
		data: nodes.map((n) => ({
			id: n.id,
			runId: n.runId,
			nodeType: n.nodeType,
			encounterId: n.encounterId,
			nextNodeIds: n.nextNodeIds,
			floor: n.floor,
			act: n.act
		}))
	});
	await db.incrementalRun.update({
		where: { id: runId },
		data: { currentNodeId: nodes[0].id }
	});
	return { firstNodeId: nodes[0].id, nodeCount: nodes.length };
}

/**
 * Return run state for API: runId, status, current node id, and next node ids.
 */
export async function getRunState(db: MapRunDb, runId: string): Promise<RunState | null> {
	const run = await db.incrementalRun.findUnique({ where: { id: runId } });
	if (!run) return null;
	const currentNode = await db.incrementalMapNode.findUnique({
		where: { id: run.currentNodeId }
	});
	return {
		runId: run.id,
		status: toRunStatus(run.status),
		currentNodeId: run.currentNodeId,
		nextNodeIds: currentNode?.nextNodeIds ?? []
	};
}
