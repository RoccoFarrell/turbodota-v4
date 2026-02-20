import { describe, it, expect } from 'vitest';
import { levelMultiplier, scaleEnemyStat, formatLevelMultiplier } from './level-scaling';

describe('levelMultiplier', () => {
	it('returns 1 for level 1', () => {
		expect(levelMultiplier(1)).toBe(1);
	});

	it('returns 2 for level 2', () => {
		expect(levelMultiplier(2)).toBe(2);
	});

	it('returns 4 for level 3', () => {
		expect(levelMultiplier(3)).toBe(4);
	});

	it('returns 8 for level 4', () => {
		expect(levelMultiplier(4)).toBe(8);
	});

	it('returns 1024 for level 11', () => {
		expect(levelMultiplier(11)).toBe(1024);
	});

	it('returns 1 for level 0 (edge case)', () => {
		expect(levelMultiplier(0)).toBe(1);
	});

	it('returns 1 for negative levels (edge case)', () => {
		expect(levelMultiplier(-1)).toBe(1);
	});
});

describe('scaleEnemyStat', () => {
	it('returns base stat unchanged at level 1', () => {
		expect(scaleEnemyStat(100, 1)).toBe(100);
	});

	it('doubles stat at level 2', () => {
		expect(scaleEnemyStat(100, 2)).toBe(200);
	});

	it('quadruples stat at level 3', () => {
		expect(scaleEnemyStat(100, 3)).toBe(400);
	});

	it('rounds to nearest integer', () => {
		expect(scaleEnemyStat(5, 2)).toBe(10);
		expect(scaleEnemyStat(7, 2)).toBe(14);
	});

	it('handles zero base stat', () => {
		expect(scaleEnemyStat(0, 5)).toBe(0);
	});

	it('handles large levels', () => {
		expect(scaleEnemyStat(100, 10)).toBe(100 * 512);
	});
});

describe('formatLevelMultiplier', () => {
	it('formats level 1 as "1\u00d7"', () => {
		expect(formatLevelMultiplier(1)).toBe('1\u00d7');
	});

	it('formats level 2 as "2\u00d7"', () => {
		expect(formatLevelMultiplier(2)).toBe('2\u00d7');
	});

	it('formats level 5 as "16\u00d7"', () => {
		expect(formatLevelMultiplier(5)).toBe('16\u00d7');
	});
});
