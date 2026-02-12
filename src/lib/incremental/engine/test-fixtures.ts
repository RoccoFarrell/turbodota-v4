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
