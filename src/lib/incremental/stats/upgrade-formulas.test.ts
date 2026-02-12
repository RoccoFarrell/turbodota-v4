import { describe, it, expect } from 'vitest';
import {
	upgradeCostFormula,
	getUpgradeConfig,
	getUpgradeCost,
	getUpgradeCostForNextLevel,
	getRewardMultiplier,
	getSpeedBonus,
	getAllUpgradeTypes,
	isUpgradeTypeRegistered
} from './upgrade-formulas';

describe('upgrade-formulas', () => {
	describe('upgradeCostFormula', () => {
		it('returns baseCost when level is 0', () => {
			expect(upgradeCostFormula(50, 0)).toBe(50);
		});

		it('returns baseCost * multiplier^level', () => {
			expect(upgradeCostFormula(50, 1, 2)).toBe(100); // 50 * 2^1
			expect(upgradeCostFormula(50, 2, 2)).toBe(200); // 50 * 2^2
			expect(upgradeCostFormula(50, 3, 2)).toBe(400); // 50 * 2^3
		});

		it('handles negative levels gracefully', () => {
			expect(upgradeCostFormula(50, -1, 2)).toBe(50);
		});
	});

	describe('getUpgradeConfig', () => {
		it('returns config for registered upgrade types', () => {
			const config = getUpgradeConfig('mining');
			expect(config.baseCost).toBe(50);
			expect(config.costMultiplier).toBe(2);
			expect(config.rewardMultiplier).toBeDefined();
		});

		it('returns default config for unknown upgrade types', () => {
			const config = getUpgradeConfig('unknown_skill');
			expect(config.baseCost).toBe(100);
			expect(config.costMultiplier).toBe(2);
			expect(config.rewardMultiplier).toBeUndefined();
			expect(config.speedBonus).toBeUndefined();
		});
	});

	describe('getUpgradeCost', () => {
		it('returns cost for mining upgrade', () => {
			expect(getUpgradeCost('mining', 0)).toBe(50); // baseCost
			expect(getUpgradeCost('mining', 1)).toBe(100); // 50 * 2^1
			expect(getUpgradeCost('mining', 2)).toBe(200); // 50 * 2^2
		});

		it('returns cost for building upgrades', () => {
			expect(getUpgradeCost('building_hp', 0)).toBe(100);
			expect(getUpgradeCost('building_hp', 1)).toBe(200);
		});
	});

	describe('getUpgradeCostForNextLevel', () => {
		it('returns cost to upgrade from current level', () => {
			expect(getUpgradeCostForNextLevel('mining', 0)).toBe(50);
			expect(getUpgradeCostForNextLevel('mining', 1)).toBe(100);
		});
	});

	describe('getRewardMultiplier', () => {
		it('returns 1 for level 0 (no bonus)', () => {
			expect(getRewardMultiplier('mining', 0)).toBe(1);
		});

		it('returns progressive multiplier for mining', () => {
			const level1 = getRewardMultiplier('mining', 1);
			const level5 = getRewardMultiplier('mining', 5);
			expect(level1).toBeGreaterThan(1);
			expect(level5).toBeGreaterThan(level1);
			expect(level5).toBeCloseTo(1.15 ** 5);
		});

		it('returns 1 for upgrade types without reward multiplier', () => {
			expect(getRewardMultiplier('building_hp', 5)).toBe(1);
		});

		it('returns 1 for unknown upgrade types', () => {
			expect(getRewardMultiplier('unknown_skill', 10)).toBe(1);
		});
	});

	describe('getSpeedBonus', () => {
		it('returns 0 for level 0', () => {
			expect(getSpeedBonus('building_hp', 0)).toBe(0);
		});

		it('returns progressive speed bonus for buildings', () => {
			expect(getSpeedBonus('building_hp', 1)).toBe(0.1); // 10% per level
			expect(getSpeedBonus('building_hp', 5)).toBe(0.5); // 50% at level 5
		});

		it('returns 0 for upgrade types without speed bonus', () => {
			expect(getSpeedBonus('mining', 5)).toBe(0);
		});

		it('returns 0 for unknown upgrade types', () => {
			expect(getSpeedBonus('unknown_skill', 10)).toBe(0);
		});
	});

	describe('getAllUpgradeTypes', () => {
		it('returns array of registered upgrade types', () => {
			const types = getAllUpgradeTypes();
			expect(types).toContain('mining');
			expect(types).toContain('building_hp');
			expect(types.length).toBeGreaterThan(0);
		});
	});

	describe('isUpgradeTypeRegistered', () => {
		it('returns true for registered upgrade types', () => {
			expect(isUpgradeTypeRegistered('mining')).toBe(true);
			expect(isUpgradeTypeRegistered('building_hp')).toBe(true);
		});

		it('returns false for unknown upgrade types', () => {
			expect(isUpgradeTypeRegistered('unknown_skill')).toBe(false);
		});
	});
});
