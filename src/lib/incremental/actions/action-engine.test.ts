import { describe, it, expect } from 'vitest';
import { advanceAction } from './action-engine';
import { ACTION_TYPE_MINING } from './constants';

describe('advanceAction', () => {
	it('advances progress within one strike', () => {
		const now = 10000;
		const lastTickAt = 9000; // 1 second ago
		const result = advanceAction({
			actionType: ACTION_TYPE_MINING,
			progress: 0.2, // 0.6s worth already
			lastTickAt,
			now,
			rateModifier: 1
		});
		// 0.2*3 + 1 = 1.6s elapsed in a 3s strike -> no completion, progress = 1.6/3
		expect(result.completions).toBe(0);
		expect(result.essenceEarned).toBe(0);
		expect(result.progress).toBeCloseTo(1.6 / 3);
	});

	it('completes one strike and leaves remainder', () => {
		const now = 10000;
		const lastTickAt = 1000; // 9 seconds ago
		const result = advanceAction({
			actionType: ACTION_TYPE_MINING,
			progress: 0,
			lastTickAt,
			now,
			rateModifier: 1
		});
		// 9s in 3s strikes = 3 completions
		expect(result.completions).toBe(3);
		expect(result.essenceEarned).toBe(3);
		expect(result.progress).toBe(0);
	});

	it('respects rate modifier', () => {
		const now = 10000;
		const lastTickAt = 7000; // 3 seconds ago; rate 2.0 => 1.5s effective per strike
		const result = advanceAction({
			actionType: ACTION_TYPE_MINING,
			progress: 0,
			lastTickAt,
			now,
			rateModifier: 2
		});
		// effective duration = 3/2 = 1.5s; 3s elapsed = 2 completions
		expect(result.completions).toBe(2);
		expect(result.essenceEarned).toBe(2);
	});
});
