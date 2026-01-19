/**
 * Test fixtures for Card Battler feature
 * 
 * Provides factory functions to create test data for card battler tests
 */

import { testPrisma } from '../setup';

// Types will be available once Prisma models are added
// For now, use string literals
type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
type CardType = 'ATTACK' | 'DEFENSE' | 'SKILL' | 'POWER';
type RunStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'DEFEATED';
type EncounterType = 'NORMAL_ENEMY' | 'ELITE_ENEMY' | 'BOSS' | 'EVENT' | 'SHOP';
type EncounterStatus = 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT' | 'FLEE';
type ForgeOperationType = 'FORGE' | 'DISMANTLE';

/**
 * Generate a unique ID for testing
 */
export function generateTestId(): string {
	return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<{
	id: string;
	username: string;
	account_id: number;
}> = {}) {
	const user = await testPrisma.user.create({
		data: {
			id: overrides.id || generateTestId(),
			username: overrides.username || `testuser-${Date.now()}`,
			account_id: overrides.account_id || Math.floor(Math.random() * 1000000),
			// Add other required fields as needed
		}
	});
	return user;
}

/**
 * Create a test hero (if Hero model exists)
 */
export async function createTestHero(overrides: Partial<{
	id: number;
	name: string;
}> = {}) {
	// Note: Adjust based on your Hero model structure
	// This is a placeholder - you may need to seed heroes or use existing ones
	return {
		id: overrides.id || 1,
		name: overrides.name || 'Test Hero'
	};
}

/**
 * Create a test BattlerCard
 * 
 * Note: This will only work once BattlerCard model is added to Prisma schema
 */
export async function createTestBattlerCard(overrides: Partial<{
	heroId: number;
	rarity: Rarity;
	name: string;
	cost: number;
	attack: number;
	defense: number;
	cardType: CardType;
	effects: any;
	description: string;
}> = {}) {
	if (!('battlerCard' in testPrisma)) {
		throw new Error('BattlerCard model not yet in Prisma schema. Add models first.');
	}
	const card = await (testPrisma as any).battlerCard.create({
		data: {
			heroId: overrides.heroId || 1,
			rarity: overrides.rarity || 'COMMON',
			name: overrides.name || 'Test Card',
			cost: overrides.cost ?? 2,
			attack: overrides.attack ?? 10,
			defense: overrides.defense ?? 0,
			cardType: overrides.cardType || 'ATTACK',
			effects: overrides.effects || null,
			description: overrides.description || 'Test card description',
		}
	});
	return card;
}

/**
 * Create a test UserBattlerCard (user's collection entry)
 */
export async function createTestUserBattlerCard(overrides: Partial<{
	userId: string;
	cardId: string;
	rarity: Rarity;
	quantity: number;
}> = {}) {
	if (!overrides.userId || !overrides.cardId) {
		throw new Error('userId and cardId are required');
	}

	if (!('userBattlerCard' in testPrisma)) {
		throw new Error('UserBattlerCard model not yet in Prisma schema. Add models first.');
	}
	const userCard = await (testPrisma as any).userBattlerCard.upsert({
		where: {
			userId_cardId: {
				userId: overrides.userId,
				cardId: overrides.cardId
			}
		},
		update: {
			quantity: overrides.quantity ?? 1
		},
		create: {
			userId: overrides.userId,
			cardId: overrides.cardId,
			rarity: overrides.rarity || 'COMMON',
			quantity: overrides.quantity ?? 1
		}
	});
	return userCard;
}

/**
 * Create a test BattlerDeck
 */
export async function createTestBattlerDeck(overrides: Partial<{
	userId: string;
	name: string;
	isActive: boolean;
	cardIds: string[];
}> = {}) {
	if (!overrides.userId) {
		throw new Error('userId is required');
	}

	if (!('battlerDeck' in testPrisma)) {
		throw new Error('BattlerDeck model not yet in Prisma schema. Add models first.');
	}
	const deck = await (testPrisma as any).battlerDeck.create({
		data: {
			userId: overrides.userId,
			name: overrides.name || 'Test Deck',
			isActive: overrides.isActive ?? false,
			cards: {
				create: (overrides.cardIds || []).map((userCardId, index) => ({
					userCardId,
					position: index
				}))
			}
		},
		include: {
			cards: true
		}
	});
	return deck;
}

/**
 * Create a test BattlerRun
 */
export async function createTestBattlerRun(overrides: Partial<{
	userId: string;
	deckId: string;
	status: RunStatus;
	currentFloor: number;
	health: number;
	energy: number;
	battleState: any;
}> = {}) {
	if (!overrides.userId || !overrides.deckId) {
		throw new Error('userId and deckId are required');
	}

	if (!('battlerRun' in testPrisma)) {
		throw new Error('BattlerRun model not yet in Prisma schema. Add models first.');
	}
	const run = await (testPrisma as any).battlerRun.create({
		data: {
			userId: overrides.userId,
			deckId: overrides.deckId,
			status: overrides.status || 'ACTIVE',
			currentFloor: overrides.currentFloor ?? 1,
			health: overrides.health ?? 80,
			maxHealth: overrides.health ?? 80,
			energy: overrides.energy ?? 3,
			maxEnergy: overrides.energy ?? 3,
			battleState: overrides.battleState || null
		}
	});
	return run;
}

/**
 * Create a test BattlerEncounter
 */
export async function createTestBattlerEncounter(overrides: Partial<{
	runId: string;
	floor: number;
	encounterType: EncounterType;
	enemyName: string;
	enemyHealth: number;
	status: EncounterStatus;
}> = {}) {
	if (!overrides.runId) {
		throw new Error('runId is required');
	}

	if (!('battlerEncounter' in testPrisma)) {
		throw new Error('BattlerEncounter model not yet in Prisma schema. Add models first.');
	}
	const encounter = await (testPrisma as any).battlerEncounter.create({
		data: {
			runId: overrides.runId,
			floor: overrides.floor ?? 1,
			encounterType: overrides.encounterType || 'NORMAL_ENEMY',
			playerHealth: 80,
			playerEnergy: 3,
			enemyName: overrides.enemyName || 'Test Enemy',
			enemyHealth: overrides.enemyHealth ?? 50,
			enemyMaxHealth: overrides.enemyHealth ?? 50,
			status: overrides.status || 'IN_PROGRESS'
		}
	});
	return encounter;
}

/**
 * Create a test ClaimedMatch
 */
export async function createTestClaimedMatch(overrides: Partial<{
	userId: string;
	matchId: bigint;
	heroId: number;
	copiesAwarded: number;
	performancePercentile: number;
}> = {}) {
	if (!overrides.userId || !overrides.matchId || !overrides.heroId) {
		throw new Error('userId, matchId, and heroId are required');
	}

	if (!('claimedMatch' in testPrisma)) {
		throw new Error('ClaimedMatch model not yet in Prisma schema. Add models first.');
	}
	const claimedMatch = await (testPrisma as any).claimedMatch.create({
		data: {
			userId: overrides.userId,
			matchId: overrides.matchId,
			heroId: overrides.heroId,
			copiesAwarded: overrides.copiesAwarded ?? 1,
			performancePercentile: overrides.performancePercentile ?? null
		}
	});
	return claimedMatch;
}

/**
 * Create a test ForgeOperation
 */
export async function createTestForgeOperation(overrides: Partial<{
	userId: string;
	cardId: string;
	fromRarity: Rarity;
	toRarity: Rarity;
	operationType: ForgeOperationType;
}> = {}) {
	if (!overrides.userId || !overrides.cardId) {
		throw new Error('userId and cardId are required');
	}

	if (!('forgeOperation' in testPrisma)) {
		throw new Error('ForgeOperation model not yet in Prisma schema. Add models first.');
	}
	const forgeOp = await (testPrisma as any).forgeOperation.create({
		data: {
			userId: overrides.userId,
			cardId: overrides.cardId,
			fromRarity: overrides.fromRarity || 'COMMON',
			toRarity: overrides.toRarity || 'UNCOMMON',
			operationType: overrides.operationType || 'FORGE',
			quantityUsed: 3,
			quantityCreated: 1
		}
	});
	return forgeOp;
}

/**
 * Helper to create a complete test scenario
 * Creates user, cards, collection, and deck
 */
export async function createTestScenario(overrides: {
	userId?: string;
	cardCount?: number;
	deckCardCount?: number;
} = {}) {
	const user = await createTestUser({ id: overrides.userId });
	const cards = [];
	const userCards = [];
	
	// Create cards and user collection
	for (let i = 0; i < (overrides.cardCount || 5); i++) {
		const card = await createTestBattlerCard({
			heroId: i + 1,
			rarity: 'COMMON'
		});
		cards.push(card);
		
		const userCard = await createTestUserBattlerCard({
			userId: user.id,
			cardId: card.id,
			rarity: 'COMMON',
			quantity: 3
		});
		userCards.push(userCard);
	}
	
	// Create deck
	const deck = await createTestBattlerDeck({
		userId: user.id,
		cardIds: userCards.slice(0, overrides.deckCardCount || 3).map(uc => uc.id)
	});
	
	return {
		user,
		cards,
		userCards,
		deck
	};
}
