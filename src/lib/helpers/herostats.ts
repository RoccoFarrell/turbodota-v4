import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';
import winOrLoss from '$lib/helpers/winOrLoss';

export type GameMode = 'ranked' | 'turbo' | 'all';

export interface AggregatedRow {
    name: string;
    games: number;
    wins: number;
    losses: number;
    win_percentage: number;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
}

const RANKED_SET = new Set(GAME_MODES_RANKED);

export function filterMatchesByGameMode(matches: Match[], mode: GameMode): Match[] {
    if (mode === 'all') return matches;
    if (mode === 'turbo') return matches.filter(m => m.game_mode === GAME_MODE_TURBO);
    return matches.filter(m => RANKED_SET.has(m.game_mode));
}

export function aggregateStats(matches: Match[]): Omit<AggregatedRow, 'name'> {
    const games = matches.length;
    if (games === 0) {
        return { games: 0, wins: 0, losses: 0, win_percentage: 0, kda: 0, kills: 0, deaths: 0, assists: 0 };
    }

    const wins = matches.reduce((acc, m) => acc + (winOrLoss(m.player_slot, m.radiant_win) ? 1 : 0), 0);
    const losses = games - wins;
    const kills = matches.reduce((acc, m) => acc + m.kills, 0);
    const deaths = matches.reduce((acc, m) => acc + m.deaths, 0);
    const assists = matches.reduce((acc, m) => acc + m.assists, 0);

    return {
        games,
        wins,
        losses,
        win_percentage: wins / games,
        kda: deaths === 0 ? 0 : (kills + assists) / deaths,
        kills,
        deaths,
        assists
    };
}
