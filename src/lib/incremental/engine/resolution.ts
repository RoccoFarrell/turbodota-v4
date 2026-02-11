/**
 * Action resolution: auto-attack, spell, enemy actions; damage and death; win/lose.
 */

import type {
	BattleState,
	HeroInstance,
	EnemyInstance,
	BattleDefsProvider,
	CombatLogEntry,
	Buff
} from '../types';
import type { DamageType } from '../types';
import { DamageType as DamageTypeConst } from '../types';
import { getHeroDef, getEnemyDef, getAbilityDef, getStatusEffectDef } from '../constants';
import type { AbilityDef } from '../types';

const COMBAT_LOG_MAX = 200;

function appendLog(state: BattleState, entry: CombatLogEntry): CombatLogEntry[] {
	const log = [...(state.combatLog ?? []), entry];
	return log.slice(-COMBAT_LOG_MAX);
}
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
export function resolveAutoAttack(
	state: BattleState,
	heroIndex: number,
	defs?: BattleDefsProvider
): BattleState {
	if (state.result !== null) return state;
	const hero = state.player[heroIndex];
	if (!hero || hero.currentHp <= 0) return state;
	const def = defs?.getHeroDef?.(hero.heroId) ?? getHeroDef(hero.heroId);
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
	const targetArmorMr = getEffectiveArmorMr(target.buffs, enemyDef.baseArmor, enemyDef.baseMagicResist);
	const finalDamage = applyDamageByType(damage, DamageTypeConst.PHYSICAL, targetArmorMr);

	const enemy = state.enemy.map((e, i) =>
		i === targetIdx ? { ...e, currentHp: Math.max(0, e.currentHp - finalDamage) } : e
	);
	const player = state.player.map((p, i) =>
		i === heroIndex ? { ...p, attackTimer: 0 } : p
	) as HeroInstance[];
	const logEntry: CombatLogEntry = {
		time: state.elapsedTime,
		type: 'auto_attack',
		attackerHeroIndex: heroIndex,
		attackerHeroId: hero.heroId,
		targetEnemyIndex: targetIdx,
		targetEnemyDefId: target.enemyDefId,
		damage: Math.round(finalDamage),
		damageType: 'physical',
		rawDamage: Math.round(damage),
		targetArmor: enemyDef.baseArmor,
		targetMagicResist: enemyDef.baseMagicResist
	};
	let next: BattleState = { ...state, enemy, player, combatLog: appendLog(state, logEntry) };
	next = removeDeadEnemies(next);
	return next;
}

/** Effective armor and magic resist from base stats + buff modifiers. */
function getEffectiveArmorMr(
	buffs: Buff[] | undefined,
	baseArmor: number,
	baseMagicResist: number
): { armor: number; magicResist: number } {
	let armor = baseArmor;
	let magicResist = baseMagicResist;
	for (const b of buffs ?? []) {
		const def = getStatusEffectDef(b.id);
		if (def?.armorMod != null) armor += def.armorMod;
		if (def?.magicResistMod != null) magicResist += def.magicResistMod;
	}
	return { armor, magicResist: Math.max(0, Math.min(1, magicResist)) };
}

/** Active (timer) ability that can be cast on single_enemy: has damage and/or status effect. */
function isCastableActiveSingleEnemy(a: AbilityDef | undefined): boolean {
	if (!a || a.type !== 'active' || a.trigger !== 'timer') return false;
	if (a.target !== 'single_enemy') return false;
	return (a.baseDamage != null && a.baseDamage > 0) || a.statusEffectOnHit != null;
}

/** Any active timer ability (used for rotation; only single_enemy ones apply damage/status). */
function isActiveTimerAbility(a: AbilityDef | undefined): boolean {
	return !!(a && a.type === 'active' && a.trigger === 'timer');
}

/**
 * Resolve the focused hero's active spell. Call when hero's spellTimer >= interval.
 * Rotates through all active (timer) abilities. Applies damage/status only when the chosen
 * ability is single_enemy with damage or statusEffectOnHit; otherwise just consumes the cast (resets timer).
 */
export function resolveSpell(
	state: BattleState,
	heroIndex: number,
	defs?: BattleDefsProvider
): BattleState {
	if (state.result !== null) return state;
	const hero = state.player[heroIndex];
	if (!hero || hero.currentHp <= 0) return state;
	const def = defs?.getHeroDef?.(hero.heroId) ?? getHeroDef(hero.heroId);
	if (!def || def.baseSpellInterval == null) return state;

	const interval = spellInterval(def.baseSpellInterval, 0);
	if (hero.spellTimer < interval) return state;

	const getAb = defs?.getAbilityDef ?? getAbilityDef;
	// Rotate through all active timer abilities (not just single_enemy), so every spell gets a turn
	const rotatableAbilityIds = hero.abilityIds.filter((id) => isActiveTimerAbility(getAb(id)));
	if (rotatableAbilityIds.length === 0) return state;

	// Use top-level state so rotation persists across ticks (hero.lastCastAbilityIndex can be lost in cache)
	const prevIndex =
		state.lastSpellAbilityIndexByPlayer?.[heroIndex] ??
		hero.lastCastAbilityIndex ??
		-1;
	const nextAbilityIndex = (prevIndex + 1) % rotatableAbilityIds.length;
	const abilityId = rotatableAbilityIds[nextAbilityIndex];
	const ability = getAb(abilityId);
	if (!ability) return state;

	// DEBUG spell rotation (remove after fixing)
	console.log('[resolveSpell]', {
		heroIndex,
		heroId: hero.heroId,
		abilityIds: hero.abilityIds,
		rotatableAbilityIds,
		lastSpellAbilityIndexByPlayer: state.lastSpellAbilityIndexByPlayer,
		heroLastCast: hero.lastCastAbilityIndex,
		prevIndex,
		nextAbilityIndex,
		abilityIdCast: abilityId
	});

	const appliesToTarget =
		ability.target === 'single_enemy' &&
		((ability.baseDamage != null && ability.baseDamage > 0) || ability.statusEffectOnHit != null);

	let enemy = state.enemy;
	let combatLog = state.combatLog ?? [];

	if (appliesToTarget && state.enemy.length > 0) {
		const targetIdx = Math.min(state.targetIndex, state.enemy.length - 1);
		let target = state.enemy[targetIdx];
		const enemyDef = getEnemyDef(target.enemyDefId);
		if (enemyDef) {
			const targetArmorMr = getEffectiveArmorMr(
				target.buffs,
				enemyDef.baseArmor,
				enemyDef.baseMagicResist
			);
			let finalDamage = 0;
			const damageType: DamageType = ability.damageType ?? DamageTypeConst.PURE;
			if (ability.baseDamage != null && ability.baseDamage > 0) {
				const rawDamage = spellDamage(ability.baseDamage, 0);
				finalDamage = applyDamageByType(rawDamage, damageType, targetArmorMr);
			}

			let targetBuffs = target.buffs ?? [];
			if (ability.statusEffectOnHit) {
				const { statusEffectId, duration } = ability.statusEffectOnHit;
				if (getStatusEffectDef(statusEffectId)) {
					targetBuffs = [
						...targetBuffs,
						{ id: statusEffectId, duration, value: ability.baseDamage }
					];
				}
			}

			enemy = state.enemy.map((e, i) => {
				if (i !== targetIdx) return e;
				return {
					...e,
					currentHp: Math.max(0, e.currentHp - finalDamage),
					buffs: targetBuffs
				};
			});
			combatLog = appendLog(state, {
				time: state.elapsedTime,
				type: 'spell',
				attackerHeroIndex: heroIndex,
				attackerHeroId: hero.heroId,
				targetEnemyIndex: targetIdx,
				targetEnemyDefId: target.enemyDefId,
				damage: Math.round(finalDamage),
				damageType: damageType,
				abilityId,
				rawDamage:
					ability.baseDamage != null && ability.baseDamage > 0
						? Math.round(spellDamage(ability.baseDamage, 0))
						: undefined,
				targetArmor: enemyDef.baseArmor,
				targetMagicResist: enemyDef.baseMagicResist
			});
		}
	} else {
		// Cast consumed but no target effect (e.g. heal/ally ability); still log the cast
		combatLog = appendLog(state, {
			time: state.elapsedTime,
			type: 'spell',
			attackerHeroIndex: heroIndex,
			attackerHeroId: hero.heroId,
			abilityId
		});
	}

	const player = state.player.map((p, i) =>
		i === heroIndex
			? { ...p, spellTimer: 0, lastCastAbilityIndex: nextAbilityIndex }
			: p
	) as HeroInstance[];

	// Persist rotation at top level so it never gets lost
	const lastSpellAbilityIndexByPlayer = [...(state.lastSpellAbilityIndexByPlayer ?? state.player.map(() => -1))];
	lastSpellAbilityIndexByPlayer[heroIndex] = nextAbilityIndex;

	let next: BattleState = { ...state, enemy, player, combatLog, lastSpellAbilityIndexByPlayer };
	if (appliesToTarget && enemy !== state.enemy) next = removeDeadEnemies(next);
	return next;
}

/**
 * For each enemy whose attackTimer >= interval: resolve one attack on the player's focused hero,
 * apply player passives (e.g. return damage), reset that enemy's timer. Removes dead enemies once at end.
 */
export function resolveEnemyActions(state: BattleState, defs?: BattleDefsProvider): BattleState {
	if (state.result !== null) return state;
	if (state.player.length === 0) return state;

	const getAb = defs?.getAbilityDef ?? getAbilityDef;
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
		const heroDef = defs?.getHeroDef?.(focusedHero.heroId) ?? getHeroDef(focusedHero.heroId);
		const returnAbility = focusedHero.abilityIds
			.map((id) => getAb(id))
			.find((a) => a?.trigger === 'on_damage_taken' && a.returnDamageRatio != null);
		const returnRatio = returnAbility?.returnDamageRatio ?? 0;
		const returnDamageType = returnAbility?.damageType ?? DamageTypeConst.PHYSICAL;

		const heroArmorMr = getEffectiveArmorMr(
			focusedHero.buffs,
			heroDef?.baseArmor ?? 0,
			heroDef?.baseMagicResist ?? 0
		);
		const rawDamage = def.damage;
		const finalDamage = applyDamageByType(rawDamage, DamageTypeConst.PHYSICAL, heroArmorMr);

		const attackLog: CombatLogEntry = {
			time: next.elapsedTime,
			type: 'enemy_attack',
			attackerEnemyDefId: enemy.enemyDefId,
			attackerEnemyIndex: i,
			targetHeroIndex: focusIdx,
			targetHeroId: focusedHero.heroId,
			damage: Math.round(finalDamage),
			damageType: 'physical',
			rawDamage: rawDamage,
			targetArmor: heroDef?.baseArmor ?? 0,
			targetMagicResist: heroDef?.baseMagicResist ?? 0
		};
		let combatLog = appendLog(next, attackLog);

		const newHeroHp = Math.max(0, next.player[focusIdx].currentHp - finalDamage);
		const player = next.player.map((p, j) =>
			j === focusIdx ? { ...p, currentHp: newHeroHp } : p
		) as HeroInstance[];

		// Return damage to attacker (this enemy)
		let enemyHp = enemy.currentHp;
		if (returnRatio > 0 && finalDamage > 0) {
			const enemyArmorMr = getEffectiveArmorMr(enemy.buffs, def.baseArmor, def.baseMagicResist);
			const returnAmount = applyDamageByType(
				finalDamage * returnRatio,
				returnDamageType,
				enemyArmorMr
			);
			enemyHp = Math.max(0, enemy.currentHp - returnAmount);
			const returnRaw = finalDamage * returnRatio;
			combatLog = appendLog(
				{ ...next, combatLog },
				{
					time: next.elapsedTime,
					type: 'return_damage',
					attackerHeroIndex: focusIdx,
					attackerHeroId: focusedHero.heroId,
					targetEnemyDefId: enemy.enemyDefId,
					targetEnemyIndex: i,
					damage: Math.round(returnAmount),
					damageType: returnDamageType,
					rawDamage: Math.round(returnRaw),
					targetArmor: def.baseArmor,
					targetMagicResist: def.baseMagicResist
				}
			);
		}

		const enemyList = next.enemy.map((e, j) =>
			j === i ? { ...e, currentHp: enemyHp, attackTimer: 0 } : e
		) as EnemyInstance[];
		next = { ...next, player, enemy: enemyList, combatLog };
	}

	return removeDeadEnemies(next);
}

/**
 * Process buffs: tick damage (poison), heal over time, duration decay. Removes expired buffs.
 */
export function processBuffs(
	state: BattleState,
	deltaTime: number,
	defs?: BattleDefsProvider
): BattleState {
	if (state.result !== null) return state;

	function processUnitBuffs<T extends { currentHp: number; maxHp: number; buffs?: Buff[] }>(
		unit: T,
		getBaseArmorMr: () => { armor: number; magicResist: number }
	): T {
		const buffs = unit.buffs ?? [];
		if (buffs.length === 0) return unit;
		let currentHp = unit.currentHp;
		const base = getBaseArmorMr();
		const { armor, magicResist } = getEffectiveArmorMr(buffs, base.armor, base.magicResist);

		const nextBuffs: Buff[] = [];
		for (const b of buffs) {
			const def = getStatusEffectDef(b.id);
			if (!def) {
				nextBuffs.push(b);
				continue;
			}
			const duration = b.duration - deltaTime;
			if (duration <= 0) continue;

			if (def.tickDamage && b.value != null && b.value > 0) {
				const raw = b.value * deltaTime;
				const dmg = applyDamageByType(raw, def.tickDamageType ?? DamageTypeConst.MAGICAL, {
					armor,
					magicResist
				});
				currentHp = Math.max(0, currentHp - dmg);
			}
			if (def.healPerSecond && b.value != null && b.value > 0) {
				const heal = b.value * deltaTime;
				currentHp = Math.min(unit.maxHp, currentHp + heal);
			}
			nextBuffs.push({ ...b, duration });
		}

		return { ...unit, currentHp, buffs: nextBuffs } as T;
	}

	let player = state.player.map((hero, i) => {
		const def = defs?.getHeroDef?.(hero.heroId) ?? getHeroDef(hero.heroId);
		return processUnitBuffs(hero, () => ({
			armor: def?.baseArmor ?? 0,
			magicResist: def?.baseMagicResist ?? 0
		}));
	}) as HeroInstance[];
	let enemy = state.enemy.map((e, i) => {
		const edef = getEnemyDef(e.enemyDefId);
		return processUnitBuffs(e, () => ({
			armor: edef?.baseArmor ?? 0,
			magicResist: edef?.baseMagicResist ?? 0
		}));
	}) as EnemyInstance[];

	return updateResult(removeDeadEnemies({ ...state, player, enemy }));
}

/** Named object export for tests (avoids SSR/bundler stripping function exports). */
export const resolution = {
	resolveAutoAttack,
	resolveSpell,
	resolveEnemyActions,
	processBuffs
};
