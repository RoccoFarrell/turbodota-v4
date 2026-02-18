/**
 * DPS and aggregate stat utilities for lineup display.
 * Pure functions — no Svelte, no DB, no side effects.
 */

import type { HeroDef, AbilityDef } from '../types';
import { attackInterval, spellInterval, spellDamage, attackDamage } from './formulas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroCombatStats {
	heroId: number;
	autoDps: number;
	spellDps: number;
	totalDps: number;
	maxHp: number;
	armor: number;
	magicResist: number;
}

export interface LineupAggregateStats {
	totalAutoDps: number;
	totalSpellDps: number;
	totalDps: number;
	totalHp: number;
	avgArmor: number;
	avgMagicResist: number; // 0-1 fraction
	heroStats: HeroCombatStats[];
}

// ---------------------------------------------------------------------------
// Per-hero combat stats
// ---------------------------------------------------------------------------

/**
 * Compute combat stats for a single hero.
 *
 * @param heroDef      Hero definition (base stats + abilityIds)
 * @param abilityDefs  Map of all ability definitions (id → AbilityDef)
 * @param training     Optional training values (attack_speed, spell_power, spell_haste, hp, attack_damage, armor, magic_resist)
 */
export function computeHeroCombatStats(
	heroDef: HeroDef,
	abilityDefs: Record<string, AbilityDef>,
	training?: Record<string, number>
): HeroCombatStats {
	const t = training ?? {};

	// --- Auto DPS ---
	const effAttackDmg = attackDamage(heroDef.baseAttackDamage, {
		flat: t.attack_damage ?? 0
	});
	const effAttackInterval = attackInterval(heroDef.baseAttackInterval, t.attack_speed ?? 0);
	const autoDps = effAttackDmg / effAttackInterval;

	// --- Spell DPS ---
	let spellDps = 0;
	if (heroDef.baseSpellInterval != null) {
		// Collect active abilities with baseDamage
		const activeAbilities: AbilityDef[] = [];
		for (const abilityId of heroDef.abilityIds) {
			const ab = abilityDefs[abilityId];
			if (ab && ab.type === 'active' && ab.baseDamage != null) {
				activeAbilities.push(ab);
			}
		}

		if (activeAbilities.length > 0) {
			const effSpellInterval = spellInterval(
				heroDef.baseSpellInterval,
				t.spell_haste ?? 0
			);
			// Round-robin: N active abilities share one spell timer.
			// Each fires once per N intervals.
			// DPS = sum(spellDmg_i) / (N * effectiveSpellInterval)
			const totalSpellDamage = activeAbilities.reduce(
				(sum, ab) => sum + spellDamage(ab.baseDamage!, t.spell_power ?? 0),
				0
			);
			spellDps = totalSpellDamage / (activeAbilities.length * effSpellInterval);
		}
	}

	// --- Defensive stats ---
	const maxHp = Math.round(heroDef.baseMaxHp + (t.hp ?? 0));
	const armor = heroDef.baseArmor + (t.armor ?? 0);
	const magicResist = heroDef.baseMagicResist + (t.magic_resist ?? 0);

	return {
		heroId: heroDef.heroId,
		autoDps,
		spellDps,
		totalDps: autoDps + spellDps,
		maxHp,
		armor,
		magicResist
	};
}

// ---------------------------------------------------------------------------
// Lineup aggregate stats
// ---------------------------------------------------------------------------

const EMPTY_STATS: LineupAggregateStats = {
	totalAutoDps: 0,
	totalSpellDps: 0,
	totalDps: 0,
	totalHp: 0,
	avgArmor: 0,
	avgMagicResist: 0,
	heroStats: []
};

/**
 * Compute aggregate combat stats for a lineup.
 *
 * @param heroIds         Ordered hero IDs in the lineup
 * @param getHeroDef      Resolver: heroId → HeroDef | undefined
 * @param abilityDefs     Map of all ability definitions
 * @param trainingByHero  Per-hero training: { [heroId]: { attack_speed: 5, ... } }
 */
export function computeLineupStats(
	heroIds: number[],
	getHeroDef: (heroId: number) => HeroDef | undefined,
	abilityDefs: Record<string, AbilityDef>,
	trainingByHero?: Record<number, Record<string, number>>
): LineupAggregateStats {
	if (heroIds.length === 0) return EMPTY_STATS;

	const heroStats: HeroCombatStats[] = [];

	for (const heroId of heroIds) {
		const def = getHeroDef(heroId);
		if (!def) continue; // gracefully skip missing heroes
		const training = trainingByHero?.[heroId];
		heroStats.push(computeHeroCombatStats(def, abilityDefs, training));
	}

	if (heroStats.length === 0) return EMPTY_STATS;

	const totalAutoDps = heroStats.reduce((s, h) => s + h.autoDps, 0);
	const totalSpellDps = heroStats.reduce((s, h) => s + h.spellDps, 0);
	const totalHp = heroStats.reduce((s, h) => s + h.maxHp, 0);
	const avgArmor = heroStats.reduce((s, h) => s + h.armor, 0) / heroStats.length;
	const avgMagicResist = heroStats.reduce((s, h) => s + h.magicResist, 0) / heroStats.length;

	return {
		totalAutoDps,
		totalSpellDps,
		totalDps: totalAutoDps + totalSpellDps,
		totalHp,
		avgArmor,
		avgMagicResist,
		heroStats
	};
}
