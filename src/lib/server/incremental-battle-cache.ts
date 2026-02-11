/**
 * In-memory battle state cache keyed by runId.
 * When advanceRun enters combat/elite/boss, the API stores battle state and hero/ability defs (from DB) here.
 * When battle/enter is used, we also store pendingNodeId so battle/complete can advance on win without relying on URL.
 * PATCH battle reads/updates it; when result is win/lose, run is updated and cache entry is cleared.
 */

import type { BattleState, HeroDef, AbilityDef } from '$lib/incremental/types';

export interface CachedBattle {
	state: BattleState;
	/** Hero defs for lineup heroes (key = String(heroId)). From DB when battle was created. */
	heroDefs: Record<string, HeroDef>;
	/** Ability defs for lineup abilities (key = abilityId). From DB when battle was created. */
	abilityDefs: Record<string, AbilityDef>;
	/** When set (battle/enter), the node we are fighting for; battle/complete uses this to advance on win. */
	pendingNodeId?: string;
}

const cache = new Map<string, CachedBattle>();
/** Per-runId lock: ensures only one PATCH tick runs at a time so lastCastAbilityIndex etc. advance correctly. */
const tickLocks = new Map<string, Promise<unknown>>();

/**
 * Run a tick callback with exclusive access to this run's battle state.
 * Ensures sequential processing of PATCH requests for the same runId so lastCastAbilityIndex etc. advance correctly.
 */
export async function withBattleTickLock<T>(runId: string, fn: () => Promise<T>): Promise<T> {
	const prior = tickLocks.get(runId) ?? Promise.resolve();
	const p = prior.then(() => fn());
	tickLocks.set(runId, p);
	return p;
}

export function getBattleState(runId: string): BattleState | null {
	const entry = cache.get(runId);
	return entry?.state ?? null;
}

/** Returns full cache entry (state + defs) for ticking with DB defs. */
export function getCachedBattle(runId: string): CachedBattle | null {
	return cache.get(runId) ?? null;
}

export function getPendingNodeId(runId: string): string | null {
	const entry = cache.get(runId);
	return entry?.pendingNodeId ?? null;
}

export function setBattleState(
	runId: string,
	state: BattleState,
	heroDefs: Record<string, HeroDef> = {},
	abilityDefs: Record<string, AbilityDef> = {},
	pendingNodeId?: string
): void {
	// Store reference (clone was dropping lastSpellAbilityIndexByPlayer between reads; tick() returns new objects so no mutation)
	cache.set(runId, { state, heroDefs, abilityDefs, pendingNodeId });
}

export function clearBattleState(runId: string): void {
	cache.delete(runId);
	tickLocks.delete(runId);
}
