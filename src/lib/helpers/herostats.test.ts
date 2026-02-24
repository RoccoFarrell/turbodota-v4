import { describe, it, expect } from 'vitest';
import { aggregateStats, filterMatchesByGameMode } from './herostats';
import { GAME_MODE_TURBO } from '$lib/constants/matches';

function makeMock(overrides: Partial<Match> = {}): Match {
    return {
        id: 1,
        match_id: BigInt(1),
        account_id: 100,
        assists: 5,
        deaths: 3,
        duration: 1800,
        game_mode: GAME_MODE_TURBO,
        hero_id: 1,
        kills: 10,
        player_slot: 0,
        radiant_win: true,
        start_time: new Date('2026-01-15'),
        ...overrides
    };
}

describe('filterMatchesByGameMode', () => {
    const turboMatch = makeMock({ game_mode: GAME_MODE_TURBO });
    const rankedMatch = makeMock({ game_mode: 22 });
    const otherMatch = makeMock({ game_mode: 2 });
    const matches = [turboMatch, rankedMatch, otherMatch];

    it('returns all matches when mode is "all"', () => {
        expect(filterMatchesByGameMode(matches, 'all')).toHaveLength(3);
    });

    it('filters to turbo only', () => {
        const result = filterMatchesByGameMode(matches, 'turbo');
        expect(result).toHaveLength(1);
        expect(result[0].game_mode).toBe(GAME_MODE_TURBO);
    });

    it('filters to ranked only', () => {
        const result = filterMatchesByGameMode(matches, 'ranked');
        expect(result).toHaveLength(1);
        expect(result[0].game_mode).toBe(22);
    });
});

describe('aggregateStats', () => {
    it('computes wins, losses, kda correctly for radiant wins', () => {
        const matches = [
            makeMock({ kills: 10, deaths: 2, assists: 8, player_slot: 0, radiant_win: true }),
            makeMock({ kills: 5, deaths: 5, assists: 3, player_slot: 0, radiant_win: false }),
        ];
        const result = aggregateStats(matches);
        expect(result.games).toBe(2);
        expect(result.wins).toBe(1);
        expect(result.losses).toBe(1);
        expect(result.win_percentage).toBeCloseTo(0.5);
        expect(result.kills).toBe(15);
        expect(result.deaths).toBe(7);
        expect(result.assists).toBe(11);
        expect(result.kda).toBeCloseTo((15 + 11) / 7);
    });

    it('handles zero deaths without NaN', () => {
        const matches = [makeMock({ kills: 5, deaths: 0, assists: 3 })];
        const result = aggregateStats(matches);
        expect(result.kda).toBe(0);
    });

    it('handles empty match array', () => {
        const result = aggregateStats([]);
        expect(result.games).toBe(0);
        expect(result.win_percentage).toBe(0);
        expect(result.kda).toBe(0);
    });
});
