/**
 * Dark Rift level scaling: enemy stats double each level.
 * Level 1 = 1×, Level 2 = 2×, Level 3 = 4×, Level N = 2^(N-1)×
 */

/** Returns the stat multiplier for a given Dark Rift level. */
export function levelMultiplier(level: number): number {
	if (level < 1) return 1;
	return Math.pow(2, level - 1);
}

/** Scale an enemy's combat stats (hp, damage) by the level multiplier. */
export function scaleEnemyStat(baseStat: number, level: number): number {
	return Math.round(baseStat * levelMultiplier(level));
}

/** Format level multiplier for display (e.g. "1×", "2×", "4×"). */
export function formatLevelMultiplier(level: number): string {
	return `${levelMultiplier(level)}×`;
}
