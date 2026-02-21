import { describe, it, expect } from 'vitest';
import { getRecruitCost } from './constants';

describe('getRecruitCost', () => {
	it('first hero (roster size 0) is free', () => {
		expect(getRecruitCost(0)).toBe(0);
	});

	it('second hero costs 65 essence', () => {
		expect(getRecruitCost(1)).toBe(65);
	});

	it('scales with power curve for early heroes', () => {
		// cost = round(65 * rosterSize^1.5)
		expect(getRecruitCost(2)).toBe(Math.round(65 * Math.pow(2, 1.5))); // 184
		expect(getRecruitCost(5)).toBe(Math.round(65 * Math.pow(5, 1.5))); // 727
		expect(getRecruitCost(10)).toBe(Math.round(65 * Math.pow(10, 1.5))); // 2056
	});

	it('costs increase monotonically', () => {
		for (let i = 1; i <= 30; i++) {
			expect(getRecruitCost(i)).toBeGreaterThanOrEqual(getRecruitCost(i - 1));
		}
	});

	it('caps at 5000 for roster size 19+', () => {
		expect(getRecruitCost(19)).toBe(5_000);
		expect(getRecruitCost(20)).toBe(5_000);
		expect(getRecruitCost(50)).toBe(5_000);
		expect(getRecruitCost(127)).toBe(5_000);
	});

	it('total cost for first 20 heroes is roughly 43k', () => {
		let total = 0;
		for (let i = 0; i < 20; i++) {
			total += getRecruitCost(i);
		}
		expect(total).toBeGreaterThan(40_000);
		expect(total).toBeLessThan(46_000);
	});

	it('handles negative roster size gracefully', () => {
		expect(getRecruitCost(-1)).toBe(0);
	});
});
