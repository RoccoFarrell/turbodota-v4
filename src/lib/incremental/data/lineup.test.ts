/**
 * Data layer: create lineup, run; query by saveId.
 */

import { describe, it, expect, vi } from 'vitest';
import {
	createLineup,
	getLineupsBySaveId,
	createRun,
	getRunsByUserId,
	type IncrementalDb
} from './lineup';

function mockDb(): IncrementalDb {
	const lineups: Array<{ id: string; saveId: string; name: string; heroIds: number[] }> = [];
	const runs: Array<{
		id: string;
		userId: string;
		lineupId: string;
		status: string;
		currentNodeId: string;
		startedAt: Date;
		finishedAt: Date | null;
		seed: string | null;
	}> = [];
	return {
		incrementalLineup: {
			create: vi.fn(async (args: { data: { saveId: string; name: string; heroIds: number[] } }) => {
				const row = {
					id: `lineup_${lineups.length + 1}`,
					saveId: args.data.saveId,
					name: args.data.name,
					heroIds: args.data.heroIds
				};
				lineups.push(row);
				return row;
			}),
			findMany: vi.fn(async (args: { where: { saveId: string } }) =>
				lineups.filter((l) => l.saveId === args.where.saveId)
			)
		},
		incrementalRun: {
			create: vi.fn(
				async (args: {
					data: {
						userId: string;
						lineupId: string;
						currentNodeId: string;
						status?: string;
						seed?: string | null;
					};
				}) => {
					const row = {
						id: `run_${runs.length + 1}`,
						userId: args.data.userId,
						lineupId: args.data.lineupId,
						status: args.data.status ?? 'ACTIVE',
						currentNodeId: args.data.currentNodeId,
						startedAt: new Date(),
						finishedAt: null as Date | null,
						seed: args.data.seed ?? null
					};
					runs.push(row);
					return row;
				}
			),
			findMany: vi.fn(async (args: { where: { userId: string } }) =>
				runs.filter((r) => r.userId === args.where.userId).map((r) => ({ ...r }))
			)
		}
	};
}

describe('incremental data layer', () => {
	it('createLineup and getLineupsBySaveId: store and query by saveId', async () => {
		const db = mockDb();
		const saveId = 'save_1';
		const lineup = await createLineup(db, {
			saveId,
			name: 'Wolf pack team',
			heroIds: [99, 25, 50]
		});
		expect(lineup.saveId).toBe(saveId);
		expect(lineup.name).toBe('Wolf pack team');
		expect(lineup.heroIds).toEqual([99, 25, 50]);
		expect(lineup.id).toBeDefined();

		const list = await getLineupsBySaveId(db, saveId);
		expect(list.length).toBeGreaterThanOrEqual(1);
		expect(list.some((l) => l.id === lineup.id)).toBe(true);
	});

	it('createRun and getRunsByUserId: store and query by userId', async () => {
		const db = mockDb();
		const userId = 'user_2';
		const saveId = 'save_2';
		const lineup = await createLineup(db, {
			saveId,
			name: 'Test',
			heroIds: [25]
		});
		const run = await createRun(db, {
			userId,
			lineupId: lineup.id,
			currentNodeId: 'node_1',
			seed: 'abc'
		});
		expect(run.userId).toBe(userId);
		expect(run.lineupId).toBe(lineup.id);
		expect(run.currentNodeId).toBe('node_1');
		expect(run.status).toBe('ACTIVE');
		expect(run.seed).toBe('abc');

		const list = await getRunsByUserId(db, userId);
		expect(list.length).toBeGreaterThanOrEqual(1);
		expect(list.some((r) => r.id === run.id)).toBe(true);
	});
});
