import type { StatusEffectDef } from '../types';

/**
 * Status effect definitions. Used to interpret Buff instances on units
 * (stun, poison, stat modifiers, heal over time, etc.).
 */
const statusEffects: StatusEffectDef[] = [
	{
		id: 'stun',
		stun: true
	},
	{
		id: 'poison',
		tickDamage: true,
		tickDamageType: 'magical'
	},
	{
		id: 'armor_reduce',
		armorMod: -3
	},
	{
		id: 'magic_resist_reduce',
		magicResistMod: -0.15
	},
	{
		id: 'heal_over_time',
		healPerSecond: true
	},
	{
		id: 'attack_damage_reduce',
		attackDamageMult: -0.2
	},
	{
		id: 'spell_damage_boost',
		spellDamageMult: 0.1
	}
];

const byId = new Map(statusEffects.map((s) => [s.id, s]));

export function getStatusEffectDef(id: string): StatusEffectDef | undefined {
	return byId.get(id);
}

export { statusEffects };
