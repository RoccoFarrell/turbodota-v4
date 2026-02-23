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
import { scaleEnemyStat } from '../run/level-scaling';
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

/** Index of the enemy front liner: first alive enemy in lineup order. -1 if none. */
function getEnemyFrontLinerIndex(state: BattleState): number {
	return state.enemy.findIndex((e) => e.currentHp > 0);
}

/** Filter out dead enemies (currentHp <= 0), clamp target index; front liner becomes index 0. */
function removeDeadEnemies(state: BattleState): BattleState {
	const enemy = state.enemy.filter((e) => e.currentHp > 0);
	const { targetIndex } = clampIndices(state, enemy.map((_, i) => i));
	return updateResult({ ...state, enemy, targetIndex, enemyFocusedIndex: 0 });
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

	const interval = attackInterval(def.baseAttackInterval, def.attackSpeed ?? 0);
	if (hero.attackTimer < interval) return state;

	if (state.enemy.length === 0) return state;
	const targetIdx = Math.min(state.targetIndex, state.enemy.length - 1);
	const target = state.enemy[targetIdx];
	const enemyDef = getEnemyDef(target.enemyDefId);
	if (!enemyDef) return state;

	const rawDamage = attackDamage(def.baseAttackDamage);
	const enemyFrontLinerIndex = getEnemyFrontLinerIndex(state);
	const isTargetEnemyFrontLiner =
		enemyFrontLinerIndex >= 0 && targetIdx === enemyFrontLinerIndex;
	const damage = nonFocusTargetPenalty(rawDamage, isTargetEnemyFrontLiner);
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

/** AGI-to-armor: each point of AGI adds this much to Main Armor (Dota-style). */
const AGI_ARMOR_FACTOR = 0.167;

/** Read a numeric modifier from buff: Buff.value overrides def default when present. */
function buffModValue(b: Buff, defValue: number | undefined): number {
	if (b.value != null) return b.value;
	return defValue ?? 0;
}

/**
 * Effective armor (ΣArmor) and magic resist from base + buffs.
 * Main Armor = baseArmor + (agi ?? 0) × 0.167; ΣArmor = Main + Σ(armorMod from buffs).
 * Buff.value overrides the StatusEffectDef default for armor/MR mods.
 */
function getEffectiveArmorMr(
	buffs: Buff[] | undefined,
	baseArmor: number,
	baseMagicResist: number,
	agi?: number
): { armor: number; magicResist: number } {
	const mainArmor = baseArmor + (agi ?? 0) * AGI_ARMOR_FACTOR;
	let armor = mainArmor;
	let magicResist = baseMagicResist;
	for (const b of buffs ?? []) {
		const def = getStatusEffectDef(b.id);
		if (!def) continue;
		if (def.armorMod != null) armor += buffModValue(b, def.armorMod);
		if (def.magicResistMod != null) magicResist += buffModValue(b, def.magicResistMod);
	}
	return { armor, magicResist: Math.max(0, Math.min(1, magicResist)) };
}

/** Sum of all attackDamageMult modifiers from buffs on a unit. */
function getAttackDamageMult(buffs: Buff[] | undefined): number {
	let mult = 0;
	for (const b of buffs ?? []) {
		const def = getStatusEffectDef(b.id);
		if (def?.attackDamageMult != null) mult += buffModValue(b, def.attackDamageMult);
	}
	return mult;
}

/** Sum of all attackSpeedMult modifiers from buffs on a unit. */
function getAttackSpeedMult(buffs: Buff[] | undefined): number {
	let mult = 0;
	for (const b of buffs ?? []) {
		const def = getStatusEffectDef(b.id);
		if (def?.attackSpeedMult != null) mult += buffModValue(b, def.attackSpeedMult);
	}
	return mult;
}

/** Sum of all evasion chances from buffs on a unit. Capped at 0.75. */
function getEvasionChance(buffs: Buff[] | undefined): number {
	let chance = 0;
	for (const b of buffs ?? []) {
		const def = getStatusEffectDef(b.id);
		if (def?.evasionChance != null) chance += buffModValue(b, def.evasionChance);
	}
	return Math.min(0.75, Math.max(0, chance));
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

	const interval = spellInterval(def.baseSpellInterval, def.spellHaste ?? 0);
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

	const appliesToSelf =
		ability.target === 'self' && ability.statusEffectOnHit != null;

	let enemy = state.enemy;
	let combatLog = state.combatLog ?? [];
	let updatedPlayer = state.player;

	if (appliesToSelf) {
		// Self-targeting spell: apply buff to the caster (focused hero)
		const { statusEffectId, duration, value: seValue } = ability.statusEffectOnHit!;
		const seDef = getStatusEffectDef(statusEffectId);
		if (seDef) {
			// For shield: value = baseDamage + spellPower; for evasion: value from statusEffectOnHit
			const buffValue = seDef.shieldHp
				? (ability.baseDamage ?? 0) + (def.spellPower ?? 0)
				: (seValue ?? ability.baseDamage);
			const newBuff: Buff = { id: statusEffectId, duration, value: buffValue };
			const updatedHero = {
				...hero,
				buffs: [...hero.buffs, newBuff],
				...(seDef.shieldHp && buffValue != null ? { shieldHp: (hero.shieldHp ?? 0) + buffValue } : {})
			};
			updatedPlayer = state.player.map((p, i) =>
				i === heroIndex ? updatedHero : p
			) as HeroInstance[];

			combatLog = appendLog(state, {
				time: state.elapsedTime,
				type: 'status_effect',
				attackerHeroIndex: heroIndex,
				attackerHeroId: hero.heroId,
				targetHeroIndex: heroIndex,
				targetHeroId: hero.heroId,
				statusEffectId,
				statusEffectDuration: duration,
				abilityId
			});
		}
		// Also log the spell cast
		combatLog = appendLog({ ...state, combatLog }, {
			time: state.elapsedTime,
			type: 'spell',
			attackerHeroIndex: heroIndex,
			attackerHeroId: hero.heroId,
			abilityId
		});
	} else if (appliesToTarget && state.enemy.length > 0) {
		const targetIdx = Math.min(state.targetIndex, state.enemy.length - 1);
		const target = state.enemy[targetIdx];
		const enemyDef = getEnemyDef(target.enemyDefId);
		if (enemyDef) {
			const enemyFrontLinerIndex = getEnemyFrontLinerIndex(state);
			const isTargetEnemyFrontLiner =
				enemyFrontLinerIndex >= 0 && targetIdx === enemyFrontLinerIndex;
			const targetArmorMr = getEffectiveArmorMr(
				target.buffs,
				enemyDef.baseArmor,
				enemyDef.baseMagicResist
			);
			let finalDamage = 0;
			let rawSpellDamage: number | undefined;
			const damageType: DamageType = ability.damageType ?? DamageTypeConst.PURE;
			if (ability.baseDamage != null && ability.baseDamage > 0) {
				rawSpellDamage = spellDamage(ability.baseDamage, def.spellPower ?? 0);
				const damageAfterPenalty = nonFocusTargetPenalty(
					rawSpellDamage,
					isTargetEnemyFrontLiner
				);
				finalDamage = applyDamageByType(
					damageAfterPenalty,
					damageType,
					targetArmorMr
				);
			}

			let targetBuffs = target.buffs ?? [];
			if (ability.statusEffectOnHit) {
				const { statusEffectId, duration, value: seValue } = ability.statusEffectOnHit;
				const seDef = getStatusEffectDef(statusEffectId);
				if (seDef) {
					// For tick damage (DoT): value = baseDamage + spellPower
					const buffValue = seDef.tickDamage
						? (seValue ?? ability.baseDamage ?? 0) + (def.spellPower ?? 0)
						: (seValue ?? ability.baseDamage);
					targetBuffs = [
						...targetBuffs,
						{ id: statusEffectId, duration, value: buffValue }
					];
					// Log status effect application
					combatLog = appendLog(state, {
						time: state.elapsedTime,
						type: 'status_effect',
						attackerHeroIndex: heroIndex,
						attackerHeroId: hero.heroId,
						targetEnemyIndex: targetIdx,
						targetEnemyDefId: target.enemyDefId,
						statusEffectId,
						statusEffectDuration: duration
					});
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
			// Append to current combatLog (which may include status_effect) so we don't overwrite it
			combatLog = appendLog({ ...state, combatLog }, {
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
					rawSpellDamage != null
						? Math.round(rawSpellDamage)
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

	const player = (appliesToSelf ? updatedPlayer : state.player).map((p, i) =>
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

		// Attack speed slow: effective interval increased by debuff (clamped to prevent div-by-zero)
		const enemySpeedMult = Math.max(-0.9, getAttackSpeedMult(enemy.buffs));
		const effectiveEnemyInterval = attackInterval(def.attackInterval, enemySpeedMult);
		if (enemy.attackTimer < effectiveEnemyInterval) continue;

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

		// Attack damage reduce: apply debuff multiplier to raw damage
		const rawDamage = enemy.attackDamage ?? def.damage;
		const damageMult = Math.max(0, 1 + getAttackDamageMult(enemy.buffs));
		const effectiveRawDamage = rawDamage * damageMult;
		const finalDamage = applyDamageByType(effectiveRawDamage, DamageTypeConst.PHYSICAL, heroArmorMr);

		// Evasion: check if focused hero dodges this attack
		const evasionChance = getEvasionChance(focusedHero.buffs);
		if (evasionChance > 0 && Math.random() < evasionChance) {
			const evadeLog: CombatLogEntry = {
				time: next.elapsedTime,
				type: 'enemy_attack',
				attackerEnemyDefId: enemy.enemyDefId,
				attackerEnemyIndex: i,
				targetHeroIndex: focusIdx,
				targetHeroId: focusedHero.heroId,
				damage: 0,
				damageType: 'physical',
				evaded: true
			};
			const enemyList = next.enemy.map((e, j) =>
				j === i ? { ...e, attackTimer: 0 } : e
			) as EnemyInstance[];
			next = { ...next, enemy: enemyList, combatLog: appendLog(next, evadeLog) };
			continue;
		}

		// Shield: absorb damage before HP
		let remainingDamage = finalDamage;
		let shieldAbsorbed = 0;
		let heroShieldHp = focusedHero.shieldHp ?? 0;
		if (heroShieldHp > 0) {
			const absorbed = Math.min(heroShieldHp, remainingDamage);
			heroShieldHp -= absorbed;
			remainingDamage -= absorbed;
			shieldAbsorbed = absorbed;
		}

		const attackLog: CombatLogEntry = {
			time: next.elapsedTime,
			type: 'enemy_attack',
			attackerEnemyDefId: enemy.enemyDefId,
			attackerEnemyIndex: i,
			targetHeroIndex: focusIdx,
			targetHeroId: focusedHero.heroId,
			damage: Math.round(remainingDamage),
			damageType: 'physical',
			rawDamage: rawDamage,
			targetArmor: heroDef?.baseArmor ?? 0,
			targetMagicResist: heroDef?.baseMagicResist ?? 0,
			...(shieldAbsorbed > 0 ? { shieldAbsorbed: Math.round(shieldAbsorbed) } : {})
		};
		let combatLog = appendLog(next, attackLog);

		const newHeroHp = Math.max(0, focusedHero.currentHp - remainingDamage);
		const player = next.player.map((p, j) =>
			j === focusIdx ? { ...p, currentHp: newHeroHp, shieldHp: heroShieldHp } : p
		) as HeroInstance[];

		// Return damage to attacker (based on full finalDamage, not shield-reduced)
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
 * Resolve enemy summons: for each living enemy with summonAbility whose spellTimer >= interval,
 * add a new EnemyInstance for the summoned def, reset that enemy's spellTimer to 0, and append a combat log entry.
 * Does not remove dead enemies (handled elsewhere). Returns updated state.
 */
export function resolveEnemySummons(
	state: BattleState,
	_defs?: BattleDefsProvider
): BattleState {
	if (state.result !== null) return state;

	let next = state;
	for (let i = 0; i < next.enemy.length; i++) {
		const enemy = next.enemy[i];
		if (enemy.currentHp <= 0) continue;
		const def = getEnemyDef(enemy.enemyDefId);
		if (!def?.summonAbility) continue;
		const interval = def.summonAbility.interval;
		const timer = enemy.spellTimer ?? 0;
		if (timer < interval) continue;

		const summonedDef = getEnemyDef(def.summonAbility.enemyDefId);
		if (!summonedDef) continue;

		const level = next.level ?? 1;
		const scaledHp = scaleEnemyStat(summonedDef.hp, level);
		const scaledDmg = scaleEnemyStat(summonedDef.damage, level);
		const newEnemy: EnemyInstance = {
			enemyDefId: summonedDef.id,
			currentHp: scaledHp,
			maxHp: scaledHp,
			attackTimer: 0,
			attackDamage: scaledDmg,
			buffs: []
		};

		const enemyList = [...next.enemy, newEnemy];
		const updatedSummoner = { ...enemy, spellTimer: 0 };
		const enemyUpdated = enemyList.map((e, j) =>
			j === i ? updatedSummoner : e
		) as EnemyInstance[];

		const logEntry: CombatLogEntry = {
			time: next.elapsedTime,
			type: 'summon',
			attackerEnemyDefId: def.id,
			attackerEnemyIndex: i,
			summonedEnemyDefId: summonedDef.id
		};
		next = {
			...next,
			enemy: enemyUpdated,
			combatLog: appendLog(next, logEntry)
		};
	}
	return next;
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

	// Shield expiry: if no shield buff remains on a hero, zero out shieldHp
	player = player.map((hero) => {
		if ((hero.shieldHp ?? 0) <= 0) return hero;
		const hasShieldBuff = (hero.buffs ?? []).some((b) => getStatusEffectDef(b.id)?.shieldHp);
		if (!hasShieldBuff) return { ...hero, shieldHp: 0 };
		return hero;
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
	resolveEnemySummons,
	processBuffs
};
