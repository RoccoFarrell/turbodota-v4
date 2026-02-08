import type { BattleState, HeroInstance, EnemyInstance } from '../types';
import { getHeroDef, getEncounterDef, getEnemyDef } from '../constants';

/** Used so the first focus change is allowed (elapsedTime - lastFocusChangeAt >= 2 at start). */
const FOCUS_CHANGE_COOLDOWN = 2;

export interface CreateBattleStateOptions {
	/** Optional initial elapsed time (default 0). */
	elapsedTime?: number;
	/** Optional initial lastFocusChangeAt (default 0). */
	lastFocusChangeAt?: number;
}

/**
 * Build initial battle state from lineup (hero ids) and encounter id.
 * Player heroes start at full HP with timers at 0; enemies from encounter def; focus and target at index 0.
 */
export function createBattleState(
	lineupHeroIds: number[],
	encounterId: string,
	options?: CreateBattleStateOptions
): BattleState {
	const player: HeroInstance[] = [];
	for (const heroId of lineupHeroIds) {
		const def = getHeroDef(heroId);
		if (!def) {
			throw new Error(`Unknown hero id: ${heroId}`);
		}
		const maxHp = def.baseMaxHp;
		player.push({
			heroId: def.heroId,
			currentHp: maxHp,
			maxHp,
			attackTimer: 0,
			spellTimer: 0,
			abilityIds: [...def.abilityIds],
			buffs: []
		});
	}

	const encounter = getEncounterDef(encounterId);
	if (!encounter) {
		throw new Error(`Unknown encounter id: ${encounterId}`);
	}

	const enemy: EnemyInstance[] = [];
	for (const entry of encounter.enemies) {
		const def = getEnemyDef(entry.enemyDefId);
		if (!def) {
			throw new Error(`Unknown enemy def id: ${entry.enemyDefId}`);
		}
		const count = entry.count ?? 1;
		for (let i = 0; i < count; i++) {
			enemy.push({
				enemyDefId: def.id,
				currentHp: def.hp,
				maxHp: def.hp,
				attackTimer: 0,
				buffs: []
			});
		}
	}

	const elapsedTime = options?.elapsedTime ?? 0;
	// So that the first focus change is allowed: elapsedTime - lastFocusChangeAt >= 2 at start
	const lastFocusChangeAt = options?.lastFocusChangeAt ?? -FOCUS_CHANGE_COOLDOWN;

	return {
		player,
		enemy,
		focusedHeroIndex: 0,
		targetIndex: 0,
		enemyFocusedIndex: 0,
		lastFocusChangeAt,
		elapsedTime,
		result: null
	};
}
