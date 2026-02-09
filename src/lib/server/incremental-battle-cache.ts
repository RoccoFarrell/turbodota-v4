/**
 * In-memory battle state cache keyed by runId.
 * When advanceRun enters combat/elite/boss, the API stores battle state here.
 * PATCH battle reads/updates it; when result is win/lose, run is updated and cache entry is cleared.
 */

import type { BattleState } from '$lib/incremental/types';

const cache = new Map<string, BattleState>();

export function getBattleState(runId: string): BattleState | null {
	return cache.get(runId) ?? null;
}

export function setBattleState(runId: string, state: BattleState): void {
	cache.set(runId, state);
}

export function clearBattleState(runId: string): void {
	cache.delete(runId);
}
