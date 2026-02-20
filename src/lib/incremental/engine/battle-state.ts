import type { BattleState, HeroInstance, HeroDef, EnemyInstance } from '../types';
import { getHeroDef as getHeroDefConst, getEncounterDef, getEnemyDef } from '../constants';
import { scaleEnemyStat } from '../run/level-scaling';

/** Used so the first focus change is allowed (elapsedTime - lastFocusChangeAt >= 2 at start). */
const FOCUS_CHANGE_COOLDOWN = 2;

export interface CreateBattleStateOptions {
	/** Optional initial elapsed time (default 0). */
	elapsedTime?: number;
	/** Optional initial lastFocusChangeAt (default 0). */
	lastFocusChangeAt?: number;
	/** Optional HP per lineup index (from run.heroHp); length must match lineup; omitted/full = use maxHp. */
	initialHeroHp?: number[];
	/** When set, use this instead of constants (e.g. hero defs from DB). */
	getHeroDef?: (heroId: number) => HeroDef | undefined;
	/** Dark Rift level (default 1). Enemy hp and damage scale by 2^(level-1). */
	level?: number;
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
	const initialHp = options?.initialHeroHp;
	const getHeroDef = options?.getHeroDef ?? getHeroDefConst;
	const player: HeroInstance[] = [];
	for (let i = 0; i < lineupHeroIds.length; i++) {
		const heroId = lineupHeroIds[i];
		const def = getHeroDef(heroId);
		if (!def) {
			throw new Error(`Unknown hero id: ${heroId}`);
		}
		const maxHp = def.baseMaxHp;
		const currentHp =
			Array.isArray(initialHp) &&
			initialHp.length === lineupHeroIds.length &&
			typeof initialHp[i] === 'number' &&
			initialHp[i] >= 0
				? Math.min(initialHp[i], maxHp)
				: maxHp;
		player.push({
			heroId: def.heroId,
			currentHp,
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

	const level = options?.level ?? 1;
	const enemy: EnemyInstance[] = [];
	for (const entry of encounter.enemies) {
		const def = getEnemyDef(entry.enemyDefId);
		if (!def) {
			throw new Error(`Unknown enemy def id: ${entry.enemyDefId}`);
		}
		const count = entry.count ?? 1;
		const scaledHp = scaleEnemyStat(def.hp, level);
		const scaledDamage = scaleEnemyStat(def.damage, level);
		for (let i = 0; i < count; i++) {
			const instance: EnemyInstance = {
				enemyDefId: def.id,
				currentHp: scaledHp,
				maxHp: scaledHp,
				attackTimer: 0,
				attackDamage: scaledDamage,
				buffs: []
			};
			if (def.summonAbility) {
				instance.spellTimer = 0;
			}
			enemy.push(instance);
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
		result: null,
		combatLog: [],
		level
	};
}
