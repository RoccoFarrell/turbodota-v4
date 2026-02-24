import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MATCH_CUTOFF_START_TIME } from '$lib/constants/matches';

// Mock prisma before importing the module under test
vi.mock('$lib/server/prisma', () => ({
	default: {
		season: { findUnique: vi.fn() },
		dotaUser: { findUnique: vi.fn() }
	}
}));

import prisma from '$lib/server/prisma';
import { computeMatchCutoff } from './incremental-save';

describe('computeMatchCutoff', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns season.startDate when save has a linked season', async () => {
		const seasonStart = new Date('2026-02-15T00:00:00Z');
		vi.mocked(prisma.season.findUnique).mockResolvedValue({
			startDate: seasonStart
		} as never);

		const result = await computeMatchCutoff(1, 12345);

		const expected = BigInt(Math.floor(seasonStart.getTime() / 1000));
		expect(result).toBe(expected);
		expect(prisma.season.findUnique).toHaveBeenCalledWith({
			where: { id: 1 },
			select: { startDate: true }
		});
		// Should not query dotaUser when season is found
		expect(prisma.dotaUser.findUnique).not.toHaveBeenCalled();
	});

	it('falls back to DotaUser.createdDate when no season', async () => {
		const userCreated = new Date('2026-01-10T00:00:00Z');
		vi.mocked(prisma.dotaUser.findUnique).mockResolvedValue({
			createdDate: userCreated
		} as never);

		const result = await computeMatchCutoff(null, 12345);

		const expected = BigInt(Math.floor(userCreated.getTime() / 1000));
		expect(result).toBe(expected);
		expect(prisma.season.findUnique).not.toHaveBeenCalled();
		expect(prisma.dotaUser.findUnique).toHaveBeenCalledWith({
			where: { account_id: 12345 },
			select: { createdDate: true }
		});
	});

	it('returns global cutoff when no season and no accountId', async () => {
		const result = await computeMatchCutoff(null, null);

		expect(result).toBe(MATCH_CUTOFF_START_TIME);
		expect(prisma.season.findUnique).not.toHaveBeenCalled();
		expect(prisma.dotaUser.findUnique).not.toHaveBeenCalled();
	});

	it('applies MATCH_CUTOFF_START_TIME as floor when season predates it', async () => {
		const ancientStart = new Date('2020-01-01T00:00:00Z');
		vi.mocked(prisma.season.findUnique).mockResolvedValue({
			startDate: ancientStart
		} as never);

		const result = await computeMatchCutoff(1, 12345);

		expect(result).toBe(MATCH_CUTOFF_START_TIME);
	});

	it('applies MATCH_CUTOFF_START_TIME as floor when user predates it', async () => {
		const ancientUser = new Date('2020-06-01T00:00:00Z');
		vi.mocked(prisma.dotaUser.findUnique).mockResolvedValue({
			createdDate: ancientUser
		} as never);

		const result = await computeMatchCutoff(null, 12345);

		expect(result).toBe(MATCH_CUTOFF_START_TIME);
	});

	it('falls back to dotaUser when season lookup returns null', async () => {
		vi.mocked(prisma.season.findUnique).mockResolvedValue(null);
		const userCreated = new Date('2026-02-01T00:00:00Z');
		vi.mocked(prisma.dotaUser.findUnique).mockResolvedValue({
			createdDate: userCreated
		} as never);

		const result = await computeMatchCutoff(99, 12345);

		const expected = BigInt(Math.floor(userCreated.getTime() / 1000));
		expect(result).toBe(expected);
	});

	it('falls back to global cutoff when dotaUser lookup returns null', async () => {
		vi.mocked(prisma.dotaUser.findUnique).mockResolvedValue(null);

		const result = await computeMatchCutoff(null, 99999);

		expect(result).toBe(MATCH_CUTOFF_START_TIME);
	});
});
