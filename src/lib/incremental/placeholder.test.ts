import { describe, it, expect } from 'vitest';
import './types'; // ensure module resolves

/** Sanity check that incremental test suite is picked up by Vitest. */
describe('incremental placeholder', () => {
	/** Confirms this file runs when executing npm run test (incremental folder is included). */
	it('runs under npm run test', () => {
		expect(true).toBe(true);
	});
});
