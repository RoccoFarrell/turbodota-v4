import type { HeroDef } from '../types';
import { PrimaryAttribute } from '../types';

/**
 * Hero definitions keyed by Hero.id (Prisma Hero table / Dota 2 hero ID).
 * Bristleback=99, Lina=25, Dazzle=50 per OpenDota/Valve.
 */
const heroes: HeroDef[] = [
	{
		heroId: 99, // Bristleback
		primaryAttribute: PrimaryAttribute.STR,
		baseAttackInterval: 1.2,
		baseAttackDamage: 24,
		baseMaxHp: 150,
		baseArmor: 4,
		baseMagicResist: 0.25,
		baseSpellInterval: null, // passive only
		abilityIds: ['bristleback_return']
	},
	{
		heroId: 25, // Lina
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
		heroId: 50, // Dazzle
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

const byHeroId = new Map(heroes.map((h) => [h.heroId, h]));

/** Returns the hero definition from constants (used when DB defs are not injected, e.g. tests). */
export function getHeroDef(heroId: number): HeroDef | undefined {
	return byHeroId.get(heroId);
}

export { heroes };
