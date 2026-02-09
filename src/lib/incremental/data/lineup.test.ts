/**
 * Data layer: create lineup, run; query by userId.
 */

import { describe, it, expect, vi } from 'vitest';
import {
	createLineup,
	getLineupsByUserId,
	createRun,
	getRunsByUserId,
	type IncrementalDb
} from './lineup';

function mockDb(): IncrementalDb {
	const lineups: Array<{ id: string; userId: string; name: string; heroIds: number[] }> = [];
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
			create: vi.fn(async (args: { data: { userId: string; name: string; heroIds: number[] } }) => {
				const row = {
					id: `lineup_${lineups.length + 1}`,
					userId: args.data.userId,
					name: args.data.name,
					heroIds: args.data.heroIds
				};
				lineups.push(row);
				return row;
			}),
			findMany: vi.fn(async (args: { where: { userId: string } }) =>
				lineups.filter((l) => l.userId === args.where.userId)
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
	it('createLineup and getLineupsByUserId: store and query by userId', async () => {
		const db = mockDb();
		const userId = 'user_1';
		const lineup = await createLineup(db, {
			userId,
			name: 'Wolf pack team',
			heroIds: [99, 25, 50]
		});
		expect(lineup.userId).toBe(userId);
		expect(lineup.name).toBe('Wolf pack team');
		expect(lineup.heroIds).toEqual([99, 25, 50]);
		expect(lineup.id).toBeDefined();

		const list = await getLineupsByUserId(db, userId);
		expect(list.length).toBeGreaterThanOrEqual(1);
		expect(list.some((l) => l.id === lineup.id)).toBe(true);
	});

	it('createRun and getRunsByUserId: store and query by userId', async () => {
		const db = mockDb();
		const userId = 'user_2';
		const lineup = await createLineup(db, {
			userId,
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
