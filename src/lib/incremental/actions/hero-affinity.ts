/**
 * Hero affinity: certain primary attributes train certain stats faster.
 * STR → hp, armor | AGI → attack_speed, attack_damage | INT → spell_power, spell_haste
 * UNIVERSAL → no affinity bonus (trains all stats at base speed)
 */

import type { TrainingStatKey } from './constants';

/** Rate bonus from affinity (25% faster training). */
export const AFFINITY_RATE_BONUS = 0.25;

/** Stat keys that benefit from each primary attribute. */
export const AFFINITY_MAP: Partial<Record<string, TrainingStatKey[]>> = {
	str: ['hp', 'armor'],
	agi: ['attack_speed', 'attack_damage'],
	int: ['spell_power', 'spell_haste']
	// universal: no affinity bonus
};

/**
 * Returns a rate modifier for a hero training a stat.
 * Affinity heroes train 25% faster: modifier = 1.25 (has affinity) or 1.0 (no affinity).
 *
 * @param primaryAttr - Hero's primary attribute (from Hero.primary_attr: 'str'|'agi'|'int'|'all'|'universal')
 * @param statKey - The stat being trained
 */
export function getAffinityRateModifier(primaryAttr: string, statKey: TrainingStatKey): number {
	const affineStats = AFFINITY_MAP[primaryAttr];
	if (!affineStats) return 1;
	return affineStats.includes(statKey) ? 1 + AFFINITY_RATE_BONUS : 1;
}

/**
 * Returns which primary attribute has affinity with a given stat, or null if none.
 * Used for UI display ("Affinity: AGI +25%").
 */
export function getStatAffinityAttr(statKey: TrainingStatKey): string | null {
	for (const [attr, stats] of Object.entries(AFFINITY_MAP)) {
		if (stats?.includes(statKey)) return attr;
	}
	return null;
}
