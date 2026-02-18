import { describe, it, expect } from 'vitest';
import { computeHeroCombatStats, computeLineupStats } from './lineup-stats';
import type { HeroDef, AbilityDef } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeroDef(overrides: Partial<HeroDef> = {}): HeroDef {
	return {
		heroId: 1,
		primaryAttribute: 'str',
		baseAttackInterval: 1.5,
		baseAttackDamage: 60,
		baseMaxHp: 800,
		baseArmor: 4,
		baseMagicResist: 0.25,
		baseSpellInterval: 3,
		abilityIds: ['ab1'],
		...overrides
	};
}

function makeAbilityDef(overrides: Partial<AbilityDef> = {}): AbilityDef {
	return {
		id: 'ab1',
		type: 'active',
		trigger: 'timer',
		baseDamage: 100,
		damageType: 'magical',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// computeHeroCombatStats
// ---------------------------------------------------------------------------

describe('computeHeroCombatStats', () => {
	it('hero with no spells → spellDps = 0, totalDps = autoDps', () => {
		const hero = makeHeroDef({ baseSpellInterval: null, abilityIds: [] });
		const stats = computeHeroCombatStats(hero, {});

		expect(stats.spellDps).toBe(0);
		// autoDps = 60 / 1.5 = 40
		expect(stats.autoDps).toBeCloseTo(40, 5);
		expect(stats.totalDps).toBeCloseTo(40, 5);
	});

	it('hero with active ability → correct spell DPS', () => {
		const hero = makeHeroDef();
		const abilities: Record<string, AbilityDef> = {
			ab1: makeAbilityDef({ baseDamage: 100 })
		};
		const stats = computeHeroCombatStats(hero, abilities);

		// autoDps = 60 / 1.5 = 40
		expect(stats.autoDps).toBeCloseTo(40, 5);
		// spellDps = 100 / (1 * 3) = 33.33...
		expect(stats.spellDps).toBeCloseTo(100 / 3, 5);
		expect(stats.totalDps).toBeCloseTo(40 + 100 / 3, 5);
	});

	it('hero with passive-only ability → spellDps = 0', () => {
		const hero = makeHeroDef();
		const abilities: Record<string, AbilityDef> = {
			ab1: makeAbilityDef({
				type: 'passive',
				trigger: 'on_damage_taken',
				returnDamageRatio: 0.2,
				baseDamage: undefined
			})
		};
		const stats = computeHeroCombatStats(hero, abilities);

		expect(stats.spellDps).toBe(0);
		expect(stats.totalDps).toBeCloseTo(40, 5);
	});

	it('training attack_speed reduces interval, increases auto DPS', () => {
		const hero = makeHeroDef({ baseSpellInterval: null, abilityIds: [] });
		const stats = computeHeroCombatStats(hero, {}, { attack_speed: 1 });

		// interval = 1.5 / (1 + 1) = 0.75
		// autoDps = 60 / 0.75 = 80
		expect(stats.autoDps).toBeCloseTo(80, 5);
	});

	it('training attack_damage adds flat damage to auto DPS', () => {
		const hero = makeHeroDef({ baseSpellInterval: null, abilityIds: [] });
		const stats = computeHeroCombatStats(hero, {}, { attack_damage: 40 });

		// autoDps = (60 + 40) / 1.5 = 66.67
		expect(stats.autoDps).toBeCloseTo(100 / 1.5, 5);
	});

	it('training spell_power + spell_haste affect spell DPS', () => {
		const hero = makeHeroDef();
		const abilities: Record<string, AbilityDef> = {
			ab1: makeAbilityDef({ baseDamage: 100 })
		};
		const training = { spell_power: 50, spell_haste: 0.5 };
		const stats = computeHeroCombatStats(hero, abilities, training);

		// spellDamage = 100 + 50 = 150
		// spellInterval = 3 / (1 + 0.5) = 2
		// spellDps = 150 / (1 * 2) = 75
		expect(stats.spellDps).toBeCloseTo(75, 5);
	});

	it('multiple active abilities → round-robin DPS (divided by N)', () => {
		const hero = makeHeroDef({
			abilityIds: ['ab1', 'ab2'],
			baseSpellInterval: 2
		});
		const abilities: Record<string, AbilityDef> = {
			ab1: makeAbilityDef({ id: 'ab1', baseDamage: 80 }),
			ab2: makeAbilityDef({ id: 'ab2', baseDamage: 120 })
		};
		const stats = computeHeroCombatStats(hero, abilities);

		// totalSpellDamage = 80 + 120 = 200
		// N = 2, spellInterval = 2
		// spellDps = 200 / (2 * 2) = 50
		expect(stats.spellDps).toBeCloseTo(50, 5);
	});

	it('defensive stats include training bonuses', () => {
		const hero = makeHeroDef({
			baseMaxHp: 800,
			baseArmor: 4,
			baseMagicResist: 0.25
		});
		const training = { hp: 200, armor: 3, magic_resist: 0.1 };
		const stats = computeHeroCombatStats(hero, {}, training);

		expect(stats.maxHp).toBe(1000);
		expect(stats.armor).toBeCloseTo(7, 5);
		expect(stats.magicResist).toBeCloseTo(0.35, 5);
	});

	it('active ability without baseDamage is excluded from spell DPS', () => {
		const hero = makeHeroDef();
		const abilities: Record<string, AbilityDef> = {
			ab1: makeAbilityDef({ baseDamage: undefined, type: 'active' })
		};
		const stats = computeHeroCombatStats(hero, abilities);

		expect(stats.spellDps).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// computeLineupStats
// ---------------------------------------------------------------------------

describe('computeLineupStats', () => {
	const heroA = makeHeroDef({ heroId: 1, baseSpellInterval: null, abilityIds: [] });
	const heroB = makeHeroDef({
		heroId: 2,
		baseAttackDamage: 40,
		baseAttackInterval: 2,
		baseMaxHp: 600,
		baseArmor: 2,
		baseMagicResist: 0.3,
		baseSpellInterval: 4,
		abilityIds: ['ab1']
	});

	const abilities: Record<string, AbilityDef> = {
		ab1: makeAbilityDef({ baseDamage: 120 })
	};

	function getDef(id: number): HeroDef | undefined {
		if (id === 1) return heroA;
		if (id === 2) return heroB;
		return undefined;
	}

	it('aggregate: sum of DPS, sum of HP, average of armor/MR', () => {
		const stats = computeLineupStats([1, 2], getDef, abilities);

		// heroA: autoDps = 60/1.5 = 40, spellDps = 0
		// heroB: autoDps = 40/2 = 20, spellDps = 120/(1*4) = 30
		expect(stats.totalAutoDps).toBeCloseTo(60, 5);
		expect(stats.totalSpellDps).toBeCloseTo(30, 5);
		expect(stats.totalDps).toBeCloseTo(90, 5);

		// HP: 800 + 600
		expect(stats.totalHp).toBe(1400);

		// avg armor: (4+2)/2 = 3, avg MR: (0.25+0.3)/2 = 0.275
		expect(stats.avgArmor).toBeCloseTo(3, 5);
		expect(stats.avgMagicResist).toBeCloseTo(0.275, 5);

		expect(stats.heroStats).toHaveLength(2);
	});

	it('empty lineup → all zeros', () => {
		const stats = computeLineupStats([], getDef, abilities);

		expect(stats.totalAutoDps).toBe(0);
		expect(stats.totalSpellDps).toBe(0);
		expect(stats.totalDps).toBe(0);
		expect(stats.totalHp).toBe(0);
		expect(stats.avgArmor).toBe(0);
		expect(stats.avgMagicResist).toBe(0);
		expect(stats.heroStats).toHaveLength(0);
	});

	it('missing hero def → gracefully skipped', () => {
		const stats = computeLineupStats([1, 999], getDef, abilities);

		// Only heroA stats
		expect(stats.heroStats).toHaveLength(1);
		expect(stats.totalAutoDps).toBeCloseTo(40, 5);
		expect(stats.totalHp).toBe(800);
	});

	it('training data is passed through to per-hero stats', () => {
		const trainingByHero = {
			1: { attack_speed: 1 },
			2: { spell_power: 30 }
		};
		const stats = computeLineupStats([1, 2], getDef, abilities, trainingByHero);

		// heroA with attack_speed=1: autoDps = 60 / (1.5/2) = 80
		expect(stats.heroStats[0].autoDps).toBeCloseTo(80, 5);
		// heroB with spell_power=30: spellDps = (120+30) / (1*4) = 37.5
		expect(stats.heroStats[1].spellDps).toBeCloseTo(37.5, 5);
	});
});
