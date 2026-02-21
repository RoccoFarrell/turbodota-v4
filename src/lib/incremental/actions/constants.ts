/**
 * Action type labels and training/buildings constants.
 * Duration and reward amounts live in action-definitions (single idle-timer model).
 */

/** Format any hero stat to 3 decimal places for display and storage consistency. */
export function formatStat(value: number): string {
	return Number(value).toFixed(3);
}

export const ACTION_TYPE_MINING = 'mining' as const;
export const ACTION_TYPE_TRAINING = 'training' as const;
export const ACTION_TYPE_WOODCUTTING = 'woodcutting' as const;

/** Essence granted per completed mining strike. */
export const MINING_ESSENCE_PER_STRIKE = 1;

/** Wood granted per completed woodcutting strike. */
export const WOODCUTTING_WOOD_PER_STRIKE = 1;

/** Yield bonus per scavenging party companion (25% per hero, up to 2 companions = +50%). */
export const SCAVENGING_PARTY_YIELD_BONUS = 0.25;

/** Maximum number of companion heroes in a scavenging party. */
export const SCAVENGING_PARTY_MAX_SIZE = 2;

/**
 * Recruit cost curve: free first hero, power-curve ramp to 5 000 by hero 20, then flat.
 * Formula: cost(rosterSize) = round(65 × rosterSize^1.5), capped at 5 000.
 *
 * @param rosterSize  Number of heroes already on the roster (0 = first recruit is free).
 */
export function getRecruitCost(rosterSize: number): number {
	if (rosterSize <= 0) return 0;
	if (rosterSize >= 19) return 5_000;
	return Math.round(65 * Math.pow(rosterSize, 1.5));
}

/** All trainable stat keys (seven buildings). */
export const TRAINING_STAT_KEYS = [
	'hp',
	'attack_damage',
	'spell_power',
	'attack_speed',
	'spell_haste',
	'armor',
	'magic_resist'
] as const;

export type TrainingStatKey = (typeof TRAINING_STAT_KEYS)[number];

/** Building name, short description, and icon per stat (Dota 2 themed). */
import { TRAINING_ICONS } from '$lib/incremental/components/game-icons';

export const TRAINING_BUILDINGS: Record<TrainingStatKey, { name: string; description: string; icon: string; color: string }> = {
	hp:           { name: 'Barracks',       description: 'Increases max HP',             icon: TRAINING_ICONS.hp,           color: 'text-red-400' },
	attack_damage:{ name: 'Weapon Smithy',  description: 'Increases attack damage',       icon: TRAINING_ICONS.attack_damage, color: 'text-orange-400' },
	spell_power:  { name: 'Arcane Sanctum', description: 'Increases spell damage',        icon: TRAINING_ICONS.spell_power,   color: 'text-violet-400' },
	attack_speed: { name: 'Swift Forge',    description: 'Increases attack speed',        icon: TRAINING_ICONS.attack_speed,  color: 'text-green-400' },
	spell_haste:  { name: 'Cooldown Grotto',description: 'Increases spell cast speed',    icon: TRAINING_ICONS.spell_haste,   color: 'text-cyan-400' },
	armor:        { name: 'Blacksmith',     description: 'Increases armor',               icon: TRAINING_ICONS.armor,         color: 'text-yellow-400' },
	magic_resist: { name: 'Cloak Pavilion', description: 'Increases magic resistance',    icon: TRAINING_ICONS.magic_resist,  color: 'text-blue-400' },
};
