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

/** Essence cost to convert one win from last 10 games into a roster hero. */
export const CONVERT_WIN_ESSENCE_COST = 10;

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
export const TRAINING_BUILDINGS: Record<TrainingStatKey, { name: string; description: string; icon: string }> = {
	hp: { name: 'Barracks', description: 'Increases max HP', icon: '🏰' },
	attack_damage: { name: 'Weapon Smithy', description: 'Increases attack damage', icon: '⚔️' },
	spell_power: { name: 'Arcane Sanctum', description: 'Increases spell damage', icon: '🔮' },
	attack_speed: { name: 'Swift Forge', description: 'Increases attack speed', icon: '⚡' },
	spell_haste: { name: 'Cooldown Grotto', description: 'Increases spell cast speed', icon: '🌀' },
	armor: { name: 'Blacksmith', description: 'Increases armor', icon: '🛡️' },
	magic_resist: { name: 'Cloak Pavilion', description: 'Increases magic resistance', icon: '🧿' }
};
