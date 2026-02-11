/**
 * createRunMap and getRunState with mocked DB.
 */

import { describe, it, expect, vi } from 'vitest';
import { createRunMap, getRunState, type MapRunDb } from './run-map';

function mockMapRunDb(runId: string): {
	db: MapRunDb;
	run: { id: string; status: string; currentNodeId: string };
	nodes: Map<string, { id: string; nodeType: string; encounterId: string | null; nextNodeIds: string[] }>;
} {
	let runCurrentNodeId = 'placeholder';
	const nodes = new Map<string, { id: string; nodeType: string; encounterId: string | null; nextNodeIds: string[] }>();
	return {
		run: { id: runId, status: 'ACTIVE', currentNodeId: runCurrentNodeId },
		nodes,
		db: {
			incrementalRun: {
				findUnique: vi.fn(async (args: { where: { id: string } }) => {
					if (args.where.id !== runId) return null;
					return { id: runId, status: 'ACTIVE', currentNodeId: runCurrentNodeId };
				}),
				update: vi.fn(async (args: { where: { id: string }; data: { currentNodeId: string } }) => {
					if (args.where.id === runId) runCurrentNodeId = args.data.currentNodeId;
				})
			},
			incrementalMapNode: {
				createMany: vi.fn(async (args: { data: Array<{ id: string; runId: string; nodeType: string; encounterId: string | null; nextNodeIds: string[] }> }) => {
					for (const n of args.data) {
						nodes.set(n.id, { id: n.id, nodeType: n.nodeType, encounterId: n.encounterId, nextNodeIds: n.nextNodeIds });
					}
				}),
				findUnique: vi.fn(async (args: { where: { id: string } }) => {
					return nodes.get(args.where.id) ?? null;
				})
			}
		}
	};
}

describe('run-map', () => {
	it('createRunMap produces valid path and updates run currentNodeId', async () => {
		const runId = 'run_1';
		const { db, run, nodes } = mockMapRunDb(runId);
		const result = await createRunMap(db, runId);
		expect(result.nodeCount).toBe(6);
		expect(result.firstNodeId).toBeDefined();
		expect(nodes.size).toBe(6);
		// Run's currentNodeId should have been updated via update()
		expect(db.incrementalRun.update).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: runId }, data: { currentNodeId: result.firstNodeId } })
		);
	});

	it('getRunState returns run state with current node and next options', async () => {
		const runId = 'run_2';
		const { db, nodes } = mockMapRunDb(runId);
		await createRunMap(db, runId);
		const state = await getRunState(db, runId);
		expect(state).not.toBeNull();
		expect(state!.runId).toBe(runId);
		expect(state!.status).toBe('active');
		expect(state!.currentNodeId).toBeDefined();
		expect(Array.isArray(state!.nextNodeIds)).toBe(true);
		expect(state!.nextNodeIds.length).toBe(1);
	});

	it('getRunState returns null for unknown runId', async () => {
		const { db } = mockMapRunDb('run_3');
		const state = await getRunState(db, 'unknown_run');
		expect(state).toBeNull();
	});
});
