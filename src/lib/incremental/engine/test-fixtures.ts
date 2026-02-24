/**
 * Test-only hero and ability defs. Production uses DB (getHeroDefsFromDb).
 * Used by resolution.test, battle-state.test, etc.
 */
import type { HeroDef, AbilityDef } from '../types';
import { PrimaryAttribute } from '../types';

const heroDefs: HeroDef[] = [
	{
		heroId: 99,
		primaryAttribute: PrimaryAttribute.STR,
		baseAttackInterval: 1.2,
		baseAttackDamage: 24,
		baseMaxHp: 150,
		baseArmor: 4,
		baseMagicResist: 0.25,
		baseSpellInterval: null,
		abilityIds: ['bristleback_return']
	},
	{
		heroId: 25,
		primaryAttribute: PrimaryAttribute.INT,
		baseAttackInterval: 1.4,
		baseAttackDamage: 21,
		baseMaxHp: 100,
		baseArmor: 1,
		baseMagicResist: 0.25,
		baseSpellInterval: 10,
		abilityIds: ['laguna_blade']
	},
	{
		heroId: 50,
		primaryAttribute: PrimaryAttribute.UNIVERSAL,
		baseAttackInterval: 1.2,
		baseAttackDamage: 22,
		baseMaxHp: 120,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		abilityIds: ['poison_touch']
	},
	{
		heroId: 101,
		primaryAttribute: PrimaryAttribute.AGI,
		baseAttackInterval: 1.3,
		baseAttackDamage: 20,
		baseMaxHp: 110,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		abilityIds: ['test_attack_speed_slow']
	},
	{
		heroId: 102,
		primaryAttribute: PrimaryAttribute.AGI,
		baseAttackInterval: 1.3,
		baseAttackDamage: 20,
		baseMaxHp: 110,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		abilityIds: ['test_evasion']
	},
	{
		heroId: 103,
		primaryAttribute: PrimaryAttribute.STR,
		baseAttackInterval: 1.4,
		baseAttackDamage: 18,
		baseMaxHp: 160,
		baseArmor: 5,
		baseMagicResist: 0.25,
		baseSpellInterval: 12,
		spellPower: 20,
		abilityIds: ['test_shield']
	},
	{
		heroId: 104,
		primaryAttribute: PrimaryAttribute.INT,
		baseAttackInterval: 1.5,
		baseAttackDamage: 18,
		baseMaxHp: 100,
		baseArmor: 1,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		spellPower: 10,
		abilityIds: ['test_magic_dot']
	},
	{
		heroId: 105,
		primaryAttribute: PrimaryAttribute.AGI,
		baseAttackInterval: 1.3,
		baseAttackDamage: 20,
		baseMaxHp: 110,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: null,
		abilityIds: ['test_bonus_damage']
	},
	{
		heroId: 106,
		primaryAttribute: PrimaryAttribute.STR,
		baseAttackInterval: 1.3,
		baseAttackDamage: 20,
		baseMaxHp: 110,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: null,
		abilityIds: ['test_lifesteal']
	},
	{
		heroId: 107,
		primaryAttribute: PrimaryAttribute.STR,
		baseAttackInterval: 1.3,
		baseAttackDamage: 20,
		baseMaxHp: 110,
		baseArmor: 2,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		abilityIds: ['test_attack_speed_bonus']
	},
	{
		heroId: 108,
		primaryAttribute: PrimaryAttribute.INT,
		baseAttackInterval: 1.4,
		baseAttackDamage: 18,
		baseMaxHp: 100,
		baseArmor: 1,
		baseMagicResist: 0.25,
		baseSpellInterval: 8,
		spellPower: 10,
		abilityIds: ['test_all_enemies_nuke']
	}
];

const abilityDefs: AbilityDef[] = [
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
		baseDamage: 100,
		statusEffectOnHit: { statusEffectId: 'stun', duration: 1.5 }
	},
	{
		id: 'poison_touch',
		type: 'active',
		trigger: 'timer',
		effect: 'magic_damage',
		target: 'single_enemy',
		damageType: 'magical',
		baseDamage: 30,
		statusEffectOnHit: { statusEffectId: 'stun', duration: 1.5 }
	},
	{
		id: 'test_attack_speed_slow',
		type: 'active',
		trigger: 'timer',
		effect: 'attack_speed_slow',
		target: 'single_enemy',
		statusEffectOnHit: { statusEffectId: 'attack_speed_slow', duration: 4, value: -0.25 }
	},
	{
		id: 'test_evasion',
		type: 'active',
		trigger: 'timer',
		effect: 'evasion',
		target: 'self',
		statusEffectOnHit: { statusEffectId: 'evasion', duration: 6, value: 0.25 }
	},
	{
		id: 'test_shield',
		type: 'active',
		trigger: 'timer',
		effect: 'shield',
		target: 'self',
		baseDamage: 50,
		statusEffectOnHit: { statusEffectId: 'shield', duration: 8 }
	},
	{
		id: 'test_magic_dot',
		type: 'active',
		trigger: 'timer',
		effect: 'magic_dot',
		target: 'single_enemy',
		baseDamage: 15,
		statusEffectOnHit: { statusEffectId: 'magic_dot', duration: 5 }
	},
	{
		id: 'test_bonus_damage',
		type: 'passive',
		trigger: 'on_attack',
		effect: 'bonus_damage',
		target: 'attacked_enemy',
		damageType: 'physical',
		baseDamage: 15
	},
	{
		id: 'test_lifesteal',
		type: 'passive',
		trigger: 'on_attack',
		effect: 'lifesteal',
		target: 'attacked_enemy',
		returnDamageRatio: 0.3
	},
	{
		id: 'test_attack_speed_bonus',
		type: 'active',
		trigger: 'timer',
		effect: 'attack_speed_bonus',
		target: 'self',
		statusEffectOnHit: { statusEffectId: 'attack_speed_bonus', duration: 8, value: 0.3 }
	},
	{
		id: 'test_all_enemies_nuke',
		type: 'active',
		trigger: 'timer',
		effect: 'magic_damage',
		target: 'all_enemies',
		damageType: 'magical',
		baseDamage: 50
	}
];

const heroById = new Map(heroDefs.map((h) => [h.heroId, h]));
const abilityById = new Map(abilityDefs.map((a) => [a.id, a]));

export function getHeroDef(heroId: number): HeroDef | undefined {
	return heroById.get(heroId);
}

export function getAbilityDef(id: string): AbilityDef | undefined {
	return abilityById.get(id);
}
