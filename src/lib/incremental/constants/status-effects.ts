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
		// Flat armor modifier; magnitude from Buff.value (e.g. -5)
		id: 'armor_reduce',
		armorMod: 0
	},
	{
		// Flat magic resist modifier; magnitude from Buff.value (e.g. -0.15)
		id: 'magic_resist_reduce',
		magicResistMod: 0
	},
	{
		id: 'heal_over_time',
		healPerSecond: true
	},
	{
		// Attack damage multiplier; magnitude from Buff.value (e.g. -0.2)
		id: 'attack_damage_reduce',
		attackDamageMult: 0
	},
	{
		id: 'spell_damage_boost',
		spellDamageMult: 0.1
	},
	{
		// Attack speed multiplier; magnitude from Buff.value (e.g. -0.25)
		id: 'attack_speed_slow',
		attackSpeedMult: 0
	},
	{
		// Evasion chance (0–1); magnitude from Buff.value (e.g. 0.25)
		id: 'evasion',
		evasionChance: 0
	},
	{
		// Flat HP shield; Buff.value = initial shield amount
		id: 'shield',
		shieldHp: true
	},
	{
		// Magical damage over time; Buff.value = DPS (baseDamage + spellPower)
		id: 'magic_dot',
		tickDamage: true,
		tickDamageType: 'magical'
	},
	{
		// Physical damage over time; Buff.value = DPS (baseDamage + spellPower)
		id: 'physical_dot',
		tickDamage: true,
		tickDamageType: 'physical'
	},
	{
		// Attack speed multiplier (positive = bonus); magnitude from Buff.value (e.g. 0.3)
		id: 'attack_speed_bonus',
		attackSpeedMult: 0
	}
];

const byId = new Map(statusEffects.map((s) => [s.id, s]));

export function getStatusEffectDef(id: string): StatusEffectDef | undefined {
	return byId.get(id);
}

export { statusEffects };
