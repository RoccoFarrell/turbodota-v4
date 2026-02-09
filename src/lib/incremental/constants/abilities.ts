import type { AbilityDef } from '../types';

/**
 * Ability definitions for incremental battle.
 * These are spells/specials only. Auto-attack is intrinsic: every entity has attackInterval + damage
 * on HeroDef/EnemyDef and a separate attackTimer in battle; abilities are additional (spell timers or passives).
 */
const abilities: AbilityDef[] = [
	{
		id: 'bristleback_return',
		type: 'passive',
		trigger: 'on_damage_taken',
		effect: 'return_damage',
		target: 'attacker',
		damageType: 'physical',
		returnDamageRatio: 0.2
	},
	{
		id: 'laguna_blade',
		type: 'active',
		trigger: 'timer',
		effect: 'magic_damage',
		target: 'single_enemy',
		damageType: 'magical',
		baseDamage: 100
	},
	{
		id: 'shadow_wave',
		type: 'active',
		trigger: 'timer',
		effect: 'heal_lowest_ally_damage_nearby',
		target: 'lowest_hp_ally',
		damageType: 'magical' // damage portion to nearby enemies
	}
];

const byId = new Map(abilities.map((a) => [a.id, a]));

export function getAbilityDef(id: string): AbilityDef | undefined {
	return byId.get(id);
}

export { abilities };
