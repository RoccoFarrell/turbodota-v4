/**
 * Run service: startRun, advanceRun, encounter on combat node.
 */

import { describe, it, expect, vi } from 'vitest';
import { startRun, advanceRun, type RunServiceDb, type RunRecord } from './run-service';
import { createLineup, createRun, type IncrementalDb } from '../data/lineup';
import type { HeroDef } from '../types';

/** Inline hero defs for run-service tests (avoids circular-import issue with engine/test-fixtures). */
const heroDefs: HeroDef[] = [
	{ heroId: 99, primaryAttribute: 'str', baseAttackInterval: 1.2, baseAttackDamage: 24, baseMaxHp: 150, baseArmor: 4, baseMagicResist: 0.25, baseSpellInterval: null, abilityIds: ['bristleback_return'] },
	{ heroId: 25, primaryAttribute: 'int', baseAttackInterval: 1.4, baseAttackDamage: 21, baseMaxHp: 100, baseArmor: 1, baseMagicResist: 0.25, baseSpellInterval: 10, abilityIds: ['laguna_blade'] },
	{ heroId: 50, primaryAttribute: 'universal', baseAttackInterval: 1.2, baseAttackDamage: 22, baseMaxHp: 120, baseArmor: 2, baseMagicResist: 0.25, baseSpellInterval: 8, abilityIds: ['poison_touch'] }
];
const heroById = new Map(heroDefs.map((h) => [h.heroId, h]));
function getHeroDef(heroId: number): HeroDef | undefined { return heroById.get(heroId); }

describe('run-service', () => {
	it('startRun creates run with map and returns run state', async () => {
		const lineupStore: Array<{ id: string; userId: string; name: string; heroIds: number[] }> = [];
		const runs = new Map<string, RunRecord>();
		const nodes = new Map<string, { nextNodeIds: string[]; nodeType: string; encounterId: string | null }>();
		let runIdCounter = 0;

		const db: RunServiceDb = {
			incrementalLineup: {
				findUnique: async (args) => {
					const row = lineupStore.find((l) => l.id === args.where.id);
					if (!row) return null;
					return { id: row.id, saveId: 'save_1', heroIds: row.heroIds, save: { userId: row.userId } };
				}
			},
			incrementalRun: {
				create: async (args) => {
					runIdCounter += 1;
					const id = `run_${runIdCounter}`;
					const run = {
						id,
						userId: args.data.userId,
						lineupId: args.data.lineupId,
						status: args.data.status ?? 'ACTIVE',
						currentNodeId: args.data.currentNodeId,
						startedAt: new Date(),
						seed: args.data.seed ?? null,
						level: args.data.level ?? 1
					};
					runs.set(id, { id, userId: run.userId, lineupId: run.lineupId, status: run.status, currentNodeId: run.currentNodeId, level: run.level });
					return run;
				},
				findUnique: async (args) => runs.get(args.where.id) ?? null,
				update: async (args) => {
					const r = runs.get(args.where.id);
					if (r) {
						r.currentNodeId = args.data.currentNodeId;
						runs.set(r.id, r);
					}
				}
			},
			incrementalMapNode: {
				createMany: async (args) => {
					for (const n of args.data) {
						nodes.set(n.id, { nextNodeIds: n.nextNodeIds, nodeType: n.nodeType, encounterId: n.encounterId });
					}
					if (args.data.length > 0) {
						const r = runs.get(args.data[0].runId);
						if (r) {
							r.currentNodeId = args.data[0].id;
							runs.set(r.id, r);
						}
					}
				},
				findUnique: async (args) => {
					const n = nodes.get(args.where.id);
					if (!n) return null;
					return { id: args.where.id, ...n };
				},
				findMany: async () => []
			}
		};

		lineupStore.push({
			id: 'lineup_1',
			userId: 'user_1',
			name: 'Team',
			heroIds: [99, 25, 50]
		});

		const result = await startRun(db, 'user_1', 'lineup_1', { seed: 'test' });
		expect(result.runId).toBeDefined();
		expect(result.runState.runId).toBe(result.runId);
		expect(result.runState.status).toBe('active');
		expect(result.runState.currentNodeId).toBeDefined();
		expect(result.runState.nextNodeIds.length).toBe(1);
	});

	it('advanceRun moves to next node; on combat node returns encounter and battle state', async () => {
		// Use real createRunMap so nodes exist; we need a minimal db that stores runs and nodes
		const { createRunMap, getRunState } = await import('../data/run-map');
		const lineupStore: Array<{ id: string; userId: string; name: string; heroIds: number[] }> = [];
		const lineupDb: IncrementalDb = {
			incrementalLineup: {
				create: async (args) => {
					const row = { id: `lineup_${lineupStore.length + 1}`, userId: args.data.userId, name: args.data.name, heroIds: args.data.heroIds };
					lineupStore.push(row);
					return row;
				},
				findMany: async (args) => lineupStore.filter((l) => l.userId === args.where.userId)
			},
			incrementalRun: {
				create: async (args) => ({
					id: `run_${Date.now()}`,
					userId: args.data.userId,
					lineupId: args.data.lineupId,
					status: 'ACTIVE',
					currentNodeId: '',
					startedAt: new Date(),
					finishedAt: null,
					seed: args.data.seed ?? null
				}),
				findMany: async () => []
			}
		};
		const lineup = await createLineup(lineupDb, { userId: 'u1', name: 'L', heroIds: [99, 25] });
		lineupStore.push(lineup);
		const run = await createRun(lineupDb, { userId: 'u1', lineupId: lineup.id, currentNodeId: '' });
		const runs = new Map<string, RunRecord>();
		runs.set(run.id, { id: run.id, userId: run.userId, lineupId: run.lineupId, status: run.status, currentNodeId: '' });
		const nodes = new Map<string, { nextNodeIds: string[]; nodeType: string; encounterId: string | null }>();

		const db: RunServiceDb = {
			incrementalLineup: {
				findUnique: async (args) => {
					const row = lineupStore.find((l) => l.id === args.where.id);
					if (!row) return null;
					return { id: row.id, saveId: 'save_1', heroIds: row.heroIds, save: { userId: row.userId } };
				}
			},
			incrementalRun: {
				create: async (args) => ({
					id: `run_${Date.now()}`,
					userId: args.data.userId,
					lineupId: args.data.lineupId,
					status: args.data.status ?? 'ACTIVE',
					currentNodeId: args.data.currentNodeId,
					startedAt: new Date(),
					seed: args.data.seed ?? null,
					level: args.data.level ?? 1
				}),
				findUnique: async (args) => runs.get(args.where.id) ?? null,
				update: async (args) => {
					const r = runs.get(args.where.id);
					if (r) {
						r.currentNodeId = args.data.currentNodeId;
						runs.set(r.id, r);
					}
				}
			},
			incrementalMapNode: {
				createMany: async (args) => {
					for (const n of args.data) {
						nodes.set(n.id, { nextNodeIds: n.nextNodeIds, nodeType: n.nodeType, encounterId: n.encounterId });
					}
					if (args.data.length > 0) {
						const r = runs.get(args.data[0].runId);
						if (r) {
							r.currentNodeId = args.data[0].id;
							runs.set(r.id, r);
						}
					}
				},
				findUnique: async (args) => {
					const n = nodes.get(args.where.id);
					if (!n) return null;
					return { id: args.where.id, ...n };
				},
				findMany: async () => []
			}
		};

		await createRunMap(db, run.id, 'seed');
		const firstState = await getRunState(db, run.id);
		expect(firstState).not.toBeNull();
		const firstNodeId = firstState!.currentNodeId;
		const nextId = firstState!.nextNodeIds[0];
		expect(nextId).toBeDefined();

		const advanceResult = await advanceRun(db, run.id, 'u1', nextId, { getHeroDef });
		expect(advanceResult.runState.currentNodeId).toBe(nextId);
		// First advance: we moved to second node (still combat). So encounter should be present
		expect(advanceResult.encounter).toBeDefined();
		expect(advanceResult.encounter!.encounterId).toBe('wolf_pack');
		expect(advanceResult.encounter!.heroIds).toEqual([99, 25]);
		expect(advanceResult.encounter!.battleState.player.length).toBe(2);
		expect(advanceResult.encounter!.battleState.enemy.length).toBeGreaterThan(0);
	});

	it('startRun throws when lineup has wrong user or invalid hero count', async () => {
		const lineupStore: Array<{ id: string; userId: string; name: string; heroIds: number[] }> = [];
		lineupStore.push({ id: 'l1', userId: 'user_1', name: 'L', heroIds: [99] });
		const runs = new Map<string, RunRecord>();
		const nodes = new Map<string, { nextNodeIds: string[]; nodeType: string; encounterId: string | null }>();
		const db: RunServiceDb = {
			incrementalLineup: {
				findUnique: async (args) => {
					const row = lineupStore.find((l) => l.id === args.where.id);
					if (!row) return null;
					return { id: row.id, saveId: 'save_1', heroIds: row.heroIds, save: { userId: row.userId } };
				}
			},
			incrementalRun: {
				create: async () => ({ id: 'r1', userId: 'u', lineupId: 'l1', status: 'ACTIVE', currentNodeId: '', startedAt: new Date(), seed: null, level: 1 }),
				findUnique: async (args) => runs.get(args.where.id) ?? null,
				update: async () => {}
			},
			incrementalMapNode: { createMany: async () => {}, findUnique: async () => null, findMany: async () => [] }
		};
		await expect(startRun(db, 'user_2', 'l1')).rejects.toThrow('Lineup does not belong to user');
		lineupStore.push({ id: 'l2', userId: 'user_1', name: 'Empty', heroIds: [] });
		await expect(startRun(db, 'user_1', 'l2')).rejects.toThrow('1–5 heroes');
	});

	it('advanceRun throws when nextNodeId not in current node nextNodeIds', async () => {
		const lineupStore: Array<{ id: string; userId: string; name: string; heroIds: number[] }> = [];
		lineupStore.push({ id: 'l1', userId: 'u1', name: 'L', heroIds: [99] });
		const runs = new Map<string, RunRecord>();
		runs.set('r1', { id: 'r1', userId: 'u1', lineupId: 'l1', status: 'ACTIVE', currentNodeId: 'n1' });
		const nodes = new Map<string, { nextNodeIds: string[]; nodeType: string; encounterId: string | null }>();
		nodes.set('n1', { nextNodeIds: ['n2'], nodeType: 'COMBAT', encounterId: 'wolf_pack' });
		const db: RunServiceDb = {
			incrementalLineup: { findUnique: async (args) => lineupStore.find((l) => l.id === args.where.id) ?? null },
			incrementalRun: {
				create: async () => ({ id: 'r1', userId: 'u1', lineupId: 'l1', status: 'ACTIVE', currentNodeId: 'n1', startedAt: new Date(), seed: null, level: 1 }),
				findUnique: async (args) => runs.get(args.where.id) ?? null,
				update: async () => {}
			},
			incrementalMapNode: {
				createMany: async () => {},
				findUnique: async (args) => {
					const n = nodes.get(args.where.id);
					return n ? { id: args.where.id, ...n } : null;
				},
				findMany: async () => []
			}
		};
		await expect(advanceRun(db, 'r1', 'u1', 'invalid_node')).rejects.toThrow('Invalid next node');
	});
});
