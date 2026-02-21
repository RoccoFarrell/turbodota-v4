import { describe, it, expect, vi } from 'vitest';

// Mock server-side imports that league-leaderboard.ts now pulls in
vi.mock('$lib/server/prisma', () => ({ default: {} }));
vi.mock('$lib/server/incremental-hero-resolver', () => ({ getHeroDefsFromDb: vi.fn() }));
vi.mock('$lib/incremental/stats/lineup-stats', () => ({ computeLineupStats: vi.fn() }));

import {
	aggregateLeaderboard,
	type WonRunRow,
	type MemberInfo,
	type LineupDpsInfo
} from './league-leaderboard';

describe('aggregateLeaderboard', () => {
	it('returns empty array when no members', () => {
		const result = aggregateLeaderboard(
			[],
			new Map(),
			new Map()
		);
		expect(result).toEqual([]);
	});

	it('includes members with zero runs at deepestLevel 0', () => {
		const members = new Map<string, MemberInfo>([
			['user-1', { accountId: 100, displayName: 'Alice', avatarUrl: null }],
			['user-2', { accountId: 200, displayName: 'Bob', avatarUrl: 'https://example.com/bob.png' }]
		]);

		const result = aggregateLeaderboard([], members, new Map());

		expect(result).toHaveLength(2);
		for (const row of result) {
			expect(row.deepestLevel).toBe(0);
			expect(row.totalDps).toBe(0);
			expect(row.runCount).toBe(0);
			expect(row.heroIds).toEqual([]);
		}
		// Both should be ranked
		expect(result.map((r) => r.rank)).toEqual([1, 2]);
	});

	it('picks the deepest level run per user', () => {
		const members = new Map<string, MemberInfo>([
			['user-1', { accountId: 100, displayName: 'Alice', avatarUrl: null }]
		]);

		const runs: WonRunRow[] = [
			{ userId: 'user-1', level: 3, lineupId: 'lineup-a' },
			{ userId: 'user-1', level: 7, lineupId: 'lineup-b' },
			{ userId: 'user-1', level: 5, lineupId: 'lineup-c' }
		];

		const lineupDps = new Map<string, LineupDpsInfo>([
			['lineup-b', { totalDps: 1500, heroIds: [1, 2, 3] }]
		]);

		const result = aggregateLeaderboard(runs, members, lineupDps);

		expect(result).toHaveLength(1);
		expect(result[0].deepestLevel).toBe(7);
		expect(result[0].totalDps).toBe(1500);
		expect(result[0].heroIds).toEqual([1, 2, 3]);
		expect(result[0].runCount).toBe(3);
	});

	it('sorts by deepest level desc, then DPS desc as tiebreaker', () => {
		const members = new Map<string, MemberInfo>([
			['user-1', { accountId: 100, displayName: 'Alice', avatarUrl: null }],
			['user-2', { accountId: 200, displayName: 'Bob', avatarUrl: null }],
			['user-3', { accountId: 300, displayName: 'Charlie', avatarUrl: null }]
		]);

		const runs: WonRunRow[] = [
			{ userId: 'user-1', level: 5, lineupId: 'lineup-1' },
			{ userId: 'user-2', level: 5, lineupId: 'lineup-2' },
			{ userId: 'user-3', level: 10, lineupId: 'lineup-3' }
		];

		const lineupDps = new Map<string, LineupDpsInfo>([
			['lineup-1', { totalDps: 800, heroIds: [1] }],
			['lineup-2', { totalDps: 1200, heroIds: [2] }],
			['lineup-3', { totalDps: 500, heroIds: [3] }]
		]);

		const result = aggregateLeaderboard(runs, members, lineupDps);

		// Charlie first (level 10), then Bob (level 5, DPS 1200), then Alice (level 5, DPS 800)
		expect(result.map((r) => r.displayName)).toEqual(['Charlie', 'Bob', 'Alice']);
		expect(result.map((r) => r.deepestLevel)).toEqual([10, 5, 5]);
		expect(result.map((r) => r.totalDps)).toEqual([500, 1200, 800]);
	});

	it('assigns sequential 1-based ranks', () => {
		const members = new Map<string, MemberInfo>([
			['user-1', { accountId: 100, displayName: 'Alice', avatarUrl: null }],
			['user-2', { accountId: 200, displayName: 'Bob', avatarUrl: null }],
			['user-3', { accountId: 300, displayName: 'Charlie', avatarUrl: null }]
		]);

		const runs: WonRunRow[] = [
			{ userId: 'user-1', level: 10, lineupId: 'lineup-1' },
			{ userId: 'user-2', level: 5, lineupId: 'lineup-2' },
			{ userId: 'user-3', level: 1, lineupId: 'lineup-3' }
		];

		const lineupDps = new Map<string, LineupDpsInfo>([
			['lineup-1', { totalDps: 1000, heroIds: [1] }],
			['lineup-2', { totalDps: 500, heroIds: [2] }],
			['lineup-3', { totalDps: 100, heroIds: [3] }]
		]);

		const result = aggregateLeaderboard(runs, members, lineupDps);

		expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
		expect(result[0].displayName).toBe('Alice');
		expect(result[1].displayName).toBe('Bob');
		expect(result[2].displayName).toBe('Charlie');
	});

	it('falls back to DPS 0 and empty heroIds when lineup not in dps map', () => {
		const members = new Map<string, MemberInfo>([
			['user-1', { accountId: 100, displayName: 'Alice', avatarUrl: null }]
		]);

		const runs: WonRunRow[] = [
			{ userId: 'user-1', level: 8, lineupId: 'deleted-lineup' }
		];

		// lineupDps map does not contain 'deleted-lineup'
		const lineupDps = new Map<string, LineupDpsInfo>();

		const result = aggregateLeaderboard(runs, members, lineupDps);

		expect(result).toHaveLength(1);
		expect(result[0].deepestLevel).toBe(8);
		expect(result[0].totalDps).toBe(0);
		expect(result[0].heroIds).toEqual([]);
		expect(result[0].runCount).toBe(1);
	});
});
