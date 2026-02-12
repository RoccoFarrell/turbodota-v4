import { describe, it, expect } from 'vitest';
import { getHeroDef, getAbilityDef, getEncounterDef, getEnemyDef } from './index';

/** Lookup helpers and reference data. Hero/ability defs come from DB only (see getHeroDefsFromDb). */
describe('incremental constants', () => {
	describe('getHeroDef / getAbilityDef (stub)', () => {
		it('return undefined (defs come from database)', () => {
			expect(getHeroDef(99)).toBeUndefined();
			expect(getHeroDef(25)).toBeUndefined();
			expect(getAbilityDef('laguna_blade')).toBeUndefined();
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

		/** New encounters are available. */
		it('returns armor_camp and skull_lord_boss', () => {
			const armor = getEncounterDef('armor_camp');
			expect(armor).toBeDefined();
			expect(armor!.id).toBe('armor_camp');
			expect(armor!.enemies).toHaveLength(2);
			const boss = getEncounterDef('skull_lord_boss');
			expect(boss).toBeDefined();
			expect(boss!.id).toBe('skull_lord_boss');
			expect(boss!.enemies).toHaveLength(1);
			expect(boss!.enemies[0].enemyDefId).toBe('skull_lord');
		});

		/** Unknown encounter id returns undefined. */
		it('returns undefined for unknown encounter', () => {
			expect(getEncounterDef('unknown')).toBeUndefined();
		});
	});

	describe('getEnemyDef', () => {
		it('returns enemy def for skull_lord and armored_brute', () => {
			const skull = getEnemyDef('skull_lord');
			expect(skull).toBeDefined();
			expect(skull!.id).toBe('skull_lord');
			expect(skull!.name).toBe('Skull Lord');
			expect(skull!.hp).toBe(2500);
			const brute = getEnemyDef('armored_brute');
			expect(brute).toBeDefined();
			expect(brute!.id).toBe('armored_brute');
			expect(brute!.baseArmor).toBe(35);
		});
		it('returns undefined for unknown enemy id', () => {
			expect(getEnemyDef('unknown')).toBeUndefined();
		});
	});
});
