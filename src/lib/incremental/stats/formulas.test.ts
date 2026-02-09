import { describe, it, expect } from 'vitest';
import {
	attackInterval,
	spellInterval,
	attackDamage,
	spellDamage,
	nonFocusTargetPenalty,
	applyPhysicalDamage,
	applyMagicalDamage,
	applyPureDamage,
	applyDamageByType
} from './formulas';
import { DamageType as DamageTypeConst } from '../types';

/** Stat formulas: intervals, damage, non-focus penalty, damage type reduction. */
describe('incremental formulas', () => {
	describe('attackInterval', () => {
		/** No attack speed → interval unchanged (base). */
		it('returns base when attackSpeed is 0', () => {
			expect(attackInterval(1, 0)).toBe(1);
		});
		/** Positive attack speed shortens interval (base / (1 + AS)). */
		it('returns lower interval when attackSpeed > 0', () => {
			expect(attackInterval(1, 0.5)).toBeLessThan(1);
			expect(attackInterval(1, 0.5)).toBeCloseTo(1 / 1.5);
		});
		/** Optional minInterval caps how low the interval can go. */
		it('respects minInterval when provided', () => {
			expect(attackInterval(1, 10, { minInterval: 0.3 })).toBe(0.3);
		});
	});

	describe('spellInterval', () => {
		/** No spell haste → interval unchanged (base). */
		it('returns base when spellHaste is 0', () => {
			expect(spellInterval(10, 0)).toBe(10);
		});
		/** Positive spell haste shortens interval (base / (1 + haste)). */
		it('returns lower interval when spellHaste > 0', () => {
			expect(spellInterval(10, 0.25)).toBeLessThan(10);
			expect(spellInterval(10, 0.25)).toBeCloseTo(8);
		});
	});

	describe('attackDamage', () => {
		/** No modifiers → raw base damage. */
		it('returns base when no modifiers', () => {
			expect(attackDamage(50)).toBe(50);
		});
		/** Flat modifier is added to base. */
		it('adds flat modifier', () => {
			expect(attackDamage(50, { flat: 10 })).toBe(60);
		});
	});

	describe('spellDamage', () => {
		/** Spell damage = base + spellPower (flat). */
		it('returns base + spellPower', () => {
			expect(spellDamage(100, 20)).toBe(120);
		});
	});

	describe('nonFocusTargetPenalty', () => {
		/** Attacking enemy focus → no penalty (full damage). */
		it('returns full damage when target is enemy focus', () => {
			expect(nonFocusTargetPenalty(100, true)).toBe(100);
		});
		/** Attacking non-focus enemy → 0.5× damage. */
		it('returns reduced damage when target is not enemy focus', () => {
			const reduced = nonFocusTargetPenalty(100, false);
			expect(reduced).toBeLessThan(100);
			expect(reduced).toBe(50); // 0.5 multiplier
		});
	});

	describe('damage types and resistance', () => {
		/** Physical: damage × 100 / (100 + armor); 0 armor = full, high armor = halved. */
		it('applyPhysicalDamage: reduced by armor', () => {
			expect(applyPhysicalDamage(100, 0)).toBe(100);
			expect(applyPhysicalDamage(100, 100)).toBe(50); // 100/(100+100)
			expect(applyPhysicalDamage(100, 50)).toBeCloseTo(66.67, 1);
		});
		/** Magical: damage × (1 - magicResist); 0 = full, 1 = zero. */
		it('applyMagicalDamage: reduced by magic resist 0–1', () => {
			expect(applyMagicalDamage(100, 0)).toBe(100);
			expect(applyMagicalDamage(100, 0.25)).toBe(75);
			expect(applyMagicalDamage(100, 1)).toBe(0);
		});
		/** Pure: no reduction (bypasses armor and resist). */
		it('applyPureDamage: no reduction', () => {
			expect(applyPureDamage(100)).toBe(100);
		});
		/** applyDamageByType routes to physical/magical/pure and applies correct reduction. */
		it('applyDamageByType dispatches by type', () => {
			const target = { armor: 100, magicResist: 0.5 };
			expect(applyDamageByType(100, DamageTypeConst.PHYSICAL, target)).toBe(50);
			expect(applyDamageByType(100, DamageTypeConst.MAGICAL, target)).toBe(50);
			expect(applyDamageByType(100, DamageTypeConst.PURE, target)).toBe(100);
		});
	});
});
