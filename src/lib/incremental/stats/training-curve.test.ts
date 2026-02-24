import { describe, it, expect } from 'vitest';
import {
	pointsToEffectiveStat,
	effectiveStatToPoints,
	formatEffectiveStat,
	formatEffectiveValue,
	TRAINING_CURVE_CONFIGS
} from './training-curve';
import { TRAINING_STAT_KEYS } from '../actions/constants';

describe('TRAINING_CURVE_CONFIGS', () => {
	it('has entries for all 7 stat keys', () => {
		for (const key of TRAINING_STAT_KEYS) {
			expect(TRAINING_CURVE_CONFIGS[key]).toBeDefined();
			expect(TRAINING_CURVE_CONFIGS[key].coefficient).toBeGreaterThan(0);
		}
	});
});

describe('pointsToEffectiveStat', () => {
	it('returns 0 for 0 points', () => {
		expect(pointsToEffectiveStat(0, 'hp')).toBe(0);
	});

	it('returns 0 for negative points', () => {
		expect(pointsToEffectiveStat(-10, 'hp')).toBe(0);
	});

	it('returns 0 for NaN points', () => {
		expect(pointsToEffectiveStat(NaN, 'hp')).toBe(0);
	});

	it('returns 0 for Infinity points', () => {
		expect(pointsToEffectiveStat(Infinity, 'hp')).toBe(0);
	});

	it('returns a finite number for very large points', () => {
		const result = pointsToEffectiveStat(1e12, 'hp');
		expect(Number.isFinite(result)).toBe(true);
		expect(result).toBeGreaterThan(0);
	});

	it('HP: ~7200 pts (10 hours) yields ~80 HP bonus', () => {
		const bonus = pointsToEffectiveStat(7200, 'hp');
		expect(bonus).toBeGreaterThan(75);
		expect(bonus).toBeLessThan(85);
	});

	it('attack_damage: ~7200 pts yields ~5.5 AD bonus', () => {
		const bonus = pointsToEffectiveStat(7200, 'attack_damage');
		expect(bonus).toBeGreaterThan(5);
		expect(bonus).toBeLessThan(6);
	});

	it('attack_speed: 7200 pts yields ~0.1 AS bonus', () => {
		const bonus = pointsToEffectiveStat(7200, 'attack_speed');
		expect(bonus).toBeGreaterThan(0.09);
		expect(bonus).toBeLessThan(0.12);
	});

	it('armor: 7200 pts yields ~1.67 armor bonus', () => {
		const bonus = pointsToEffectiveStat(7200, 'armor');
		expect(bonus).toBeGreaterThan(1.5);
		expect(bonus).toBeLessThan(1.8);
	});

	it('magic_resist: 7200 pts yields ~0.069 MR bonus', () => {
		const bonus = pointsToEffectiveStat(7200, 'magic_resist');
		expect(bonus).toBeGreaterThan(0.06);
		expect(bonus).toBeLessThan(0.08);
	});

	it('is monotonically increasing', () => {
		const pts = [0, 100, 720, 3600, 7200, 14400, 72000];
		for (let i = 1; i < pts.length; i++) {
			expect(pointsToEffectiveStat(pts[i], 'hp')).toBeGreaterThan(
				pointsToEffectiveStat(pts[i - 1], 'hp')
			);
		}
	});

	it('scales as sqrt (quadrupling points doubles result)', () => {
		const at1000 = pointsToEffectiveStat(1000, 'hp');
		const at4000 = pointsToEffectiveStat(4000, 'hp');
		expect(at4000 / at1000).toBeCloseTo(2, 1);
	});
});

describe('effectiveStatToPoints', () => {
	it('returns 0 for 0 target', () => {
		expect(effectiveStatToPoints(0, 'hp')).toBe(0);
	});

	it('is inverse of pointsToEffectiveStat', () => {
		const points = 7200;
		const effective = pointsToEffectiveStat(points, 'hp');
		expect(effectiveStatToPoints(effective, 'hp')).toBeCloseTo(points, 0);
	});

	it('round-trips for all stat keys', () => {
		for (const key of TRAINING_STAT_KEYS) {
			const pts = 5000;
			const eff = pointsToEffectiveStat(pts, key);
			expect(effectiveStatToPoints(eff, key)).toBeCloseTo(pts, 0);
		}
	});
});

describe('formatEffectiveStat', () => {
	it('formats HP with 0 decimal places and unit', () => {
		const result = formatEffectiveStat(7200, 'hp');
		expect(result).toMatch(/^\+\d+ HP$/);
	});

	it('formats attack_speed with 4 decimal places', () => {
		const result = formatEffectiveStat(7200, 'attack_speed');
		expect(result).toMatch(/^\+0\.\d{4} AS$/);
	});

	it('formats armor with 2 decimal places', () => {
		const result = formatEffectiveStat(7200, 'armor');
		expect(result).toMatch(/^\+\d+\.\d{2} AR$/);
	});
});

describe('formatEffectiveValue', () => {
	it('formats without unit or plus sign', () => {
		const result = formatEffectiveValue(7200, 'hp');
		expect(result).toMatch(/^\d+$/);
		expect(Number(result)).toBeGreaterThan(75);
	});
});
