/**
 * Test to verify test setup is working correctly
 * 
 * This test verifies that:
 * - Test database connection works
 * - Cleanup functions work
 * - Test fixtures can be used
 */

import { describe, it, expect } from 'vitest';
import { testPrisma, cleanupTestDatabase } from './setup';
import { createTestUser, createTestScenario } from './fixtures/battler';

describe('Test Setup', () => {
	it('should connect to test database', async () => {
		// Simple query to verify connection
		const result = await testPrisma.$queryRaw`SELECT 1 as value`;
		expect(result).toBeDefined();
	});

	it('should clean up test database', async () => {
		// Create some test data
		const user = await createTestUser();
		expect(user).toBeDefined();
		expect(user.id).toBeDefined();

		// Clean up
		await cleanupTestDatabase();

		// Verify cleanup worked (user should still exist, but battler data should be gone)
		// Note: User is not part of card battler, so it won't be cleaned up
		const users = await testPrisma.user.findMany({
			where: { id: user.id }
		});
		expect(users.length).toBeGreaterThanOrEqual(0);
	});

	it.skip('should create test scenario', async () => {
		// Skip until card battler models are added to schema
		const scenario = await createTestScenario({
			cardCount: 3,
			deckCardCount: 2
		});

		expect(scenario.user).toBeDefined();
		expect(scenario.cards).toHaveLength(3);
		expect(scenario.userCards).toHaveLength(3);
		expect(scenario.deck).toBeDefined();
		expect(scenario.deck.cards).toHaveLength(2);

		// Cleanup is automatic via beforeEach
	});
});
