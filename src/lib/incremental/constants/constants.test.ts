import { describe, it, expect } from 'vitest';
import { getHeroDef, getAbilityDef, getEncounterDef } from './index';

/** Lookup helpers and reference data for heroes, abilities, encounters. */
describe('incremental constants', () => {
	describe('getHeroDef', () => {
		/** Bristleback (99): str, passive-only (null spell interval), armor/resist, bristleback_return. */
		it('returns hero def for Bristleback (99) with passive ability', () => {
			const def = getHeroDef(99);
			expect(def).toBeDefined();
			expect(def!.heroId).toBe(99);
			expect(def!.primaryAttribute).toBe('str');
			expect(def!.baseMaxHp).toBe(150);
			expect(def!.baseArmor).toBe(4);
			expect(def!.baseMagicResist).toBe(0.25);
			expect(def!.baseSpellInterval).toBeNull();
			expect(def!.abilityIds).toEqual(['bristleback_return']);
		});

		/** Lina (25): int, 10s spell interval, laguna_blade ability. */
		it('returns hero def for Lina (25) with Laguna Blade', () => {
			const def = getHeroDef(25);
			expect(def).toBeDefined();
			expect(def!.heroId).toBe(25);
			expect(def!.primaryAttribute).toBe('int');
			expect(def!.baseSpellInterval).toBe(10);
			expect(def!.abilityIds).toContain('laguna_blade');
		});

		/** Dazzle (50): has poison_touch (castable stun) ability. */
		it('returns hero def for Dazzle (50)', () => {
			const def = getHeroDef(50);
			expect(def).toBeDefined();
			expect(def!.abilityIds).toContain('poison_touch');
		});

		/** Unknown hero id returns undefined. */
		it('returns undefined for unknown hero id', () => {
			expect(getHeroDef(999)).toBeUndefined();
		});
	});

	describe('getAbilityDef', () => {
		/** Laguna Blade: active, timer trigger. */
		it('returns ability def by id', () => {
			const laguna = getAbilityDef('laguna_blade');
			expect(laguna).toBeDefined();
			expect(laguna!.type).toBe('active');
			expect(laguna!.trigger).toBe('timer');
		});
		/** Unknown ability id returns undefined. */
		it('returns undefined for unknown id', () => {
			expect(getAbilityDef('unknown')).toBeUndefined();
		});
	});

	describe('getEncounterDef', () => {
		/** wolf_pack: two roster entries (large_wolf count 1, small_wolf count 2). */
		it('returns wolf_pack with 1 large + 2 small wolves', () => {
			const enc = getEncounterDef('wolf_pack');
			expect(enc).toBeDefined();
			expect(enc!.id).toBe('wolf_pack');
			expect(enc!.enemies).toHaveLength(2);
			const large = enc!.enemies.find((e) => e.enemyDefId === 'large_wolf');
			const small = enc!.enemies.find((e) => e.enemyDefId === 'small_wolf');
			expect(large?.count ?? 1).toBe(1);
			expect(small?.count ?? 1).toBe(2);
		});

		/** Unknown encounter id returns undefined. */
		it('returns undefined for unknown encounter', () => {
			expect(getEncounterDef('unknown')).toBeUndefined();
		});
	});
});
