/**
 * Training diminishing-returns curve.
 *
 * Formula: effectiveStat = coefficient * sqrt(totalPoints)
 *
 * Parameters are tuned so ~7,200 total points (10 hours at base rate of
 * +1 point per 5-second completion = 720/hour) yields roughly +10% DPS/EHP
 * contribution from a single trained stat.
 *
 * Base training rate: 1 point per 5-second completion (unchanged).
 * Building upgrades will multiply points-per-completion in the future.
 */

import type { TrainingStatKey } from '../actions/constants';

export interface TrainingCurveConfig {
	/** Coefficient C in: effectiveValue = C * sqrt(totalPoints). */
	coefficient: number;
	/** Human-readable unit label for display (e.g. "HP", "AD"). */
	unit: string;
	/** Number of decimal places for display. */
	displayDecimals: number;
}

/**
 * Per-stat curve parameters.
 *
 * Tuning guide: coefficient = targetStatDelta / sqrt(7200)
 *   where targetStatDelta is the effective stat increase that yields ~10% gain.
 *
 * HP           -> +80 HP at 7200 pts (~10% of 800 base)
 * attack_damage-> +5.5 AD at 7200 pts (~10% of 55 base)
 * spell_power  -> +8 SP at 7200 pts (~10% spell DPS on ~80 base damage spells)
 * attack_speed -> +0.1 at 7200 pts (interval = base/(1+AS), ~10% DPS)
 * spell_haste  -> +0.1 at 7200 pts (same formula as attack_speed)
 * armor        -> +1.67 at 7200 pts (~10% physical EHP at 3 base armor)
 * magic_resist -> +0.069 at 7200 pts (~10% magic EHP at 0.25 base)
 */
export const TRAINING_CURVE_CONFIGS: Record<TrainingStatKey, TrainingCurveConfig> = {
	hp: { coefficient: 0.943, unit: 'HP', displayDecimals: 0 },
	attack_damage: { coefficient: 0.0648, unit: 'AD', displayDecimals: 1 },
	spell_power: { coefficient: 0.098, unit: 'SP', displayDecimals: 1 },
	attack_speed: { coefficient: 0.001179, unit: 'AS', displayDecimals: 4 },
	spell_haste: { coefficient: 0.001179, unit: 'SH', displayDecimals: 4 },
	armor: { coefficient: 0.01968, unit: 'AR', displayDecimals: 2 },
	magic_resist: { coefficient: 0.000807, unit: 'MR', displayDecimals: 4 }
};

/**
 * Convert raw training points to an effective stat bonus.
 * Pure function — safe to call on both server and client.
 */
export function pointsToEffectiveStat(totalPoints: number, statKey: TrainingStatKey): number {
	if (!Number.isFinite(totalPoints) || totalPoints <= 0) return 0;
	const config = TRAINING_CURVE_CONFIGS[statKey];
	return config.coefficient * Math.sqrt(totalPoints);
}

/**
 * Inverse: how many points are needed to reach a given effective stat value?
 * Useful for milestone display ("X more points to next threshold").
 */
export function effectiveStatToPoints(targetEffective: number, statKey: TrainingStatKey): number {
	if (targetEffective <= 0) return 0;
	const config = TRAINING_CURVE_CONFIGS[statKey];
	const ratio = targetEffective / config.coefficient;
	return ratio * ratio;
}

/**
 * Format the effective stat delta for display.
 * Examples: "+80 HP", "+5.5 AD", "+0.1000 AS"
 */
export function formatEffectiveStat(totalPoints: number, statKey: TrainingStatKey): string {
	const effective = pointsToEffectiveStat(totalPoints, statKey);
	const config = TRAINING_CURVE_CONFIGS[statKey];
	return `+${effective.toFixed(config.displayDecimals)} ${config.unit}`;
}

/**
 * Format just the effective value (no unit, no plus sign).
 * Uses the per-stat decimal precision from config.
 */
export function formatEffectiveValue(totalPoints: number, statKey: TrainingStatKey): string {
	const effective = pointsToEffectiveStat(totalPoints, statKey);
	const config = TRAINING_CURVE_CONFIGS[statKey];
	return effective.toFixed(config.displayDecimals);
}
