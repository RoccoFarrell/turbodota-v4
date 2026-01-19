/**
 * Test setup utilities for Card Battler feature
 * 
 * This file provides test database setup and teardown utilities
 * for card battler tests.
 */

import { PrismaClient } from '@prisma/client';
import { beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Test database connection
// Uses TEST_DATABASE_URL if set, otherwise uses DEV_URL
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DEV_URL;

if (!testDatabaseUrl) {
	throw new Error(
		'TEST_DATABASE_URL or DEV_URL must be set for tests. ' +
		'For local testing, use: TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres_test"'
	);
}

// Create Prisma client for tests
export const testPrisma = new PrismaClient({
	datasources: {
		db: {
			url: testDatabaseUrl
		}
	}
});

/**
 * Clean up test database before each test
 * Removes all data from card battler tables
 * 
 * Note: This function will only work once card battler models are added to Prisma schema
 */
export async function cleanupTestDatabase() {
	try {
		// Clean up in reverse order of dependencies
		// These will only work once models are added to schema
		if ('battlerTurn' in testPrisma) {
			await (testPrisma as any).battlerTurn.deleteMany({});
		}
		if ('battlerEncounter' in testPrisma) {
			await (testPrisma as any).battlerEncounter.deleteMany({});
		}
		if ('battlerRun' in testPrisma) {
			await (testPrisma as any).battlerRun.deleteMany({});
		}
		if ('battlerDeckCard' in testPrisma) {
			await (testPrisma as any).battlerDeckCard.deleteMany({});
		}
		if ('battlerDeck' in testPrisma) {
			await (testPrisma as any).battlerDeck.deleteMany({});
		}
		if ('userBattlerCard' in testPrisma) {
			await (testPrisma as any).userBattlerCard.deleteMany({});
		}
		if ('claimedMatch' in testPrisma) {
			await (testPrisma as any).claimedMatch.deleteMany({});
		}
		if ('forgeOperation' in testPrisma) {
			await (testPrisma as any).forgeOperation.deleteMany({});
		}
		// Note: BattlerCard should not be deleted (seed data)
	} catch (error) {
		// Models don't exist yet - this is expected during Phase 0
		// Will work once models are added to schema
		console.warn('Card battler models not yet in schema - cleanup skipped');
	}
}

/**
 * Setup test database before all tests
 * Ensures schema is up to date
 */
export async function setupTestDatabase() {
	// Generate Prisma client
	await testPrisma.$connect();
	
	// Verify connection
	await testPrisma.$queryRaw`SELECT 1`;
}

/**
 * Teardown test database after all tests
 */
export async function teardownTestDatabase() {
	await testPrisma.$disconnect();
}

// Global test setup
beforeAll(async () => {
	await setupTestDatabase();
});

afterAll(async () => {
	await teardownTestDatabase();
});

// Clean up before each test
beforeEach(async () => {
	await cleanupTestDatabase();
});
