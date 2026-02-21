import { describe, it, expect } from 'vitest';
import { computeOnboardingLockStates } from './onboarding-lock';

describe('computeOnboardingLockStates', () => {
	const orders = [0, 1, 2, 3];

	it('first step is never locked', () => {
		const locks = computeOnboardingLockStates(orders, new Set(), new Set());
		expect(locks[0]).toBe(false);
	});

	it('second step is locked when first not claimed and not completed', () => {
		const locks = computeOnboardingLockStates(orders, new Set(), new Set());
		expect(locks[1]).toBe(true);
	});

	it('step unlocks when previous is claimed', () => {
		const locks = computeOnboardingLockStates(orders, new Set([0]), new Set());
		expect(locks[1]).toBe(false);
	});

	it('catch-up: step is unlocked when its milestone is complete even if previous unclaimed', () => {
		const locks = computeOnboardingLockStates(orders, new Set(), new Set([1]));
		expect(locks[1]).toBe(false);
	});

	it('all steps unlocked when all previous claimed', () => {
		const locks = computeOnboardingLockStates(orders, new Set([0, 1, 2]), new Set());
		expect(locks.every((l) => !l)).toBe(true);
	});

	it('veteran: all steps unlocked when all milestones are complete', () => {
		const locks = computeOnboardingLockStates(orders, new Set(), new Set([0, 1, 2, 3]));
		expect(locks.every((l) => !l)).toBe(true);
	});

	it('mixed: only steps with unclaimed previous AND incomplete milestone are locked', () => {
		// Steps 0 and 2 are complete, step 0 is claimed, step 1 is not complete
		const locks = computeOnboardingLockStates(orders, new Set([0]), new Set([0, 2]));
		expect(locks[0]).toBe(false); // first step never locked
		expect(locks[1]).toBe(false); // previous (0) is claimed
		expect(locks[2]).toBe(false); // milestone is complete (catch-up)
		expect(locks[3]).toBe(true); // previous (2) not claimed, milestone not complete
	});
});
