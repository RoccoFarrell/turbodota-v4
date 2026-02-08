/**
 * Verifies that the shared test setup module loads.
 * Incremental tests (and other unit tests) do not require DB or battler setup.
 */

import { describe, it, expect } from 'vitest';
import './setup'; // ensure module resolves

describe('Test setup', () => {
	it('loads without error', () => {
		expect(true).toBe(true);
	});
});
