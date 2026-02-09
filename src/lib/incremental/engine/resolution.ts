/**
 * Action resolution: auto-attack, spell, enemy actions; damage and death; win/lose.
 */

import type { BattleState, HeroInstance, EnemyInstance } from '../types';
import type { DamageType } from '../types';
import { DamageType as DamageTypeConst } from '../types';
import { getHeroDef, getEnemyDef, getAbilityDef } from '../constants';
import {
	attackInterval,
	attackDamage,
	spellInterval,
	spellDamage,
	nonFocusTargetPenalty,
	applyDamageByType
} from '../stats/formulas';

/** Clamp indices after filtering dead enemies. */
function clampIndices(
	state: BattleState,
	enemyIndices: number[]
): { targetIndex: number; enemyFocusedIndex: number } {
	const n = enemyIndices.length;
	let targetIndex = state.targetIndex;
	let enemyFocusedIndex = state.enemyFocusedIndex;
	if (n === 0) return { targetIndex: 0, enemyFocusedIndex: 0 };
	if (targetIndex >= n) targetIndex = n - 1;
	if (enemyFocusedIndex >= n) enemyFocusedIndex = n - 1;
	return { targetIndex, enemyFocusedIndex };
}

/** Set state.result to 'win' if all enemies dead, 'lose' if all player heroes dead. */
function updateResult(state: BattleState): BattleState {
	if (state.result !== null) return state;
	const allEnemiesDead = state.enemy.length === 0 || state.enemy.every((e) => e.currentHp <= 0);
	const allPlayerDead = state.player.every((p) => p.currentHp <= 0);
	if (allEnemiesDead) return { ...state, result: 'win' };
	if (allPlayerDead) return { ...state, result: 'lose' };
	return state;
}

/** Filter out dead enemies (currentHp <= 0), clamp target and enemyFocused indices. */
function removeDeadEnemies(state: BattleState): BattleState {
	const enemy = state.enemy.filter((e) => e.currentHp > 0);
	const { targetIndex, enemyFocusedIndex } = clampIndices(state, enemy.map((_, i) => i));
	return updateResult({ ...state, enemy, targetIndex, enemyFocusedIndex });
}

/**
 * Resolve one auto-attack from the given hero. Call when hero's attackTimer >= interval.
 * Applies non-focus penalty, physical damage to state.targetIndex, resets hero attackTimer.
 */
export function resolveAutoAttack(state: BattleState, heroIndex: number): BattleState {
	if (state.result !== null) return state;
	const hero = state.player[heroIndex];
	if (!hero || hero.currentHp <= 0) return state;
	const def = getHeroDef(hero.heroId);
	if (!def) return state;

	const interval = attackInterval(def.baseAttackInterval, 0);
	if (hero.attackTimer < interval) return state;

	if (state.enemy.length === 0) return state;
	const targetIdx = Math.min(state.targetIndex, state.enemy.length - 1);
	const target = state.enemy[targetIdx];
	const enemyDef = getEnemyDef(target.enemyDefId);
	if (!enemyDef) return state;

	const rawDamage = attackDamage(def.baseAttackDamage);
	const isTargetEnemyFocus = targetIdx === state.enemyFocusedIndex;
	const damage = nonFocusTargetPenalty(rawDamage, isTargetEnemyFocus);
	const finalDamage = applyDamageByType(damage, DamageTypeConst.PHYSICAL, {
		armor: enemyDef.baseArmor,
		magicResist: enemyDef.baseMagicResist
	});

	const enemy = state.enemy.map((e, i) =>
		i === targetIdx ? { ...e, currentHp: Math.max(0, e.currentHp - finalDamage) } : e
	);
	const player = state.player.map((p, i) =>
		i === heroIndex ? { ...p, attackTimer: 0 } : p
	) as HeroInstance[];
	let next: BattleState = { ...state, enemy, player };
	next = removeDeadEnemies(next);
	return next;
}

/**
 * Resolve the focused hero's active spell. Call when hero's spellTimer >= interval.
 * Applies spell damage (by ability damageType) to current target; resets spellTimer.
 */
export function resolveSpell(state: BattleState, heroIndex: number): BattleState {
	if (state.result !== null) return state;
	const hero = state.player[heroIndex];
	if (!hero || hero.currentHp <= 0) return state;
	const def = getHeroDef(hero.heroId);
	if (!def || def.baseSpellInterval == null) return state;

	const interval = spellInterval(def.baseSpellInterval, 0);
	if (hero.spellTimer < interval) return state;

	// First active ability (timer-triggered) with baseDamage
	const abilityId = hero.abilityIds.find((id) => {
		const a = getAbilityDef(id);
		return a?.type === 'active' && a.trigger === 'timer' && a.baseDamage != null;
	});
	if (!abilityId) return state;
	const ability = getAbilityDef(abilityId);
	if (!ability || ability.target !== 'single_enemy' || ability.baseDamage == null) return state;

	if (state.enemy.length === 0) return state;
	const targetIdx = Math.min(state.targetIndex, state.enemy.length - 1);
	const target = state.enemy[targetIdx];
	const enemyDef = getEnemyDef(target.enemyDefId);
	if (!enemyDef) return state;

	const damageType: DamageType = ability.damageType ?? DamageTypeConst.PURE;
	const rawDamage = spellDamage(ability.baseDamage, 0);
	const finalDamage = applyDamageByType(rawDamage, damageType, {
		armor: enemyDef.baseArmor,
		magicResist: enemyDef.baseMagicResist
	});

	const enemy = state.enemy.map((e, i) =>
		i === targetIdx ? { ...e, currentHp: Math.max(0, e.currentHp - finalDamage) } : e
	);
	const player = state.player.map((p, i) =>
		i === heroIndex ? { ...p, spellTimer: 0 } : p
	) as HeroInstance[];
	let next: BattleState = { ...state, enemy, player };
	next = removeDeadEnemies(next);
	return next;
}

/**
 * For each enemy whose attackTimer >= interval: resolve one attack on the player's focused hero,
 * apply player passives (e.g. return damage), reset that enemy's timer. Removes dead enemies once at end.
 */
export function resolveEnemyActions(state: BattleState): BattleState {
	if (state.result !== null) return state;
	if (state.player.length === 0) return state;

	let next = state;
	const focusIdx = next.focusedHeroIndex;

	for (let i = 0; i < next.enemy.length; i++) {
		const enemy = next.enemy[i];
		if (enemy.currentHp <= 0) continue;
		const def = getEnemyDef(enemy.enemyDefId);
		if (!def) continue;
		if (enemy.attackTimer < def.attackInterval) continue;

		const focusedHero = next.player[focusIdx];
		if (!focusedHero || focusedHero.currentHp <= 0) break;
		const heroDef = getHeroDef(focusedHero.heroId);
		const returnAbility = focusedHero.abilityIds
			.map((id) => getAbilityDef(id))
			.find((a) => a?.trigger === 'on_damage_taken' && a.returnDamageRatio != null);
		const returnRatio = returnAbility?.returnDamageRatio ?? 0;
		const returnDamageType = returnAbility?.damageType ?? DamageTypeConst.PHYSICAL;

		// Enemy attacks focused hero (physical)
		const rawDamage = def.damage;
		const finalDamage = applyDamageByType(rawDamage, DamageTypeConst.PHYSICAL, {
			armor: heroDef?.baseArmor ?? 0,
			magicResist: heroDef?.baseMagicResist ?? 0
		});

		const newHeroHp = Math.max(0, next.player[focusIdx].currentHp - finalDamage);
		const player = next.player.map((p, j) =>
			j === focusIdx ? { ...p, currentHp: newHeroHp } : p
		) as HeroInstance[];

		// Return damage to attacker (this enemy)
		let enemyHp = enemy.currentHp;
		if (returnRatio > 0 && finalDamage > 0) {
			const returnAmount = applyDamageByType(
				finalDamage * returnRatio,
				returnDamageType,
				{ armor: def.baseArmor, magicResist: def.baseMagicResist }
			);
			enemyHp = Math.max(0, enemy.currentHp - returnAmount);
		}

		const enemyList = next.enemy.map((e, j) =>
			j === i ? { ...e, currentHp: enemyHp, attackTimer: 0 } : e
		) as EnemyInstance[];
		next = { ...next, player, enemy: enemyList };
	}

	return removeDeadEnemies(next);
}

/** Named object export for tests (avoids SSR/bundler stripping function exports). */
export const resolution = {
	resolveAutoAttack,
	resolveSpell,
	resolveEnemyActions
};
