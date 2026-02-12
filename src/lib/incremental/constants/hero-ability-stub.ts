/**
 * Stub: hero and ability definitions come from the database only (IncrementalHeroBaseStat, IncrementalHeroAbility).
 * Use GET /api/incremental/heroes for client-side defs; use getHeroDefsFromDb() for server-side.
 */
import type { HeroDef, AbilityDef } from '../types';

export function getHeroDef(_heroId: number): HeroDef | undefined {
	return undefined;
}

export function getAbilityDef(_id: string): AbilityDef | undefined {
	return undefined;
}

export const heroes: HeroDef[] = [];
export const abilities: AbilityDef[] = [];
