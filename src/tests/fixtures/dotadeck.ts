import type { SeasonUser, HeroDraw, Card, DotadeckCharmEffect, Season } from '@prisma/client';

/**
 * Creates a mock SeasonUser with optional overrides
 */
export const createMockSeasonUser = (overrides: Partial<SeasonUser> = {}): SeasonUser => ({
  id: 'user1',
  accountId: 123,
  seasonId: 1,
  handSize: 3,
  discardTokens: 5,
  hasSeenRules: false,
  gold: 0,
  joinedAt: new Date(),
  ...overrides
});

/**
 * Creates a mock HeroDraw with optional overrides
 */
export const createMockHeroDraw = (overrides: Partial<HeroDraw> = {}): HeroDraw => ({
  id: 'draw1',
  seasonUserId: 'user1',
  heroId: 1,
  drawnAt: new Date(),
  matchResult: null,
  matchId: null,
  cardId: 'card1',
  ...overrides
});

/**
 * Creates a mock Card with optional overrides
 */
export const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card1',
  heroId: 1,
  baseGold: 100,
  baseXP: 100,
  goldMod: 0,
  xpMod: 0,
  drawLockCount: 0,
  lastDrawn: null,
  holderId: null,
  drawnAt: null,
  deckId: null,
  position: null,
  ...overrides
});

/**
 * Creates a mock DotadeckCharmEffect with optional overrides
 */
export const createMockCharmEffect = (overrides: Partial<DotadeckCharmEffect> = {}): DotadeckCharmEffect => ({
  id: 'charm1',
  seasonUserId: 'user1',
  itemId: 'item1',
  effectType: 'BOUNTY_MULTIPLIER',
  effectValue: 2.0,
  createdAt: new Date(),
  expiresAt: null,
  isActive: true,
  ...overrides
});

/**
 * Creates a mock Season with optional overrides
 */
export const createMockSeason = (overrides: Partial<Season> = {}): Season => ({
  id: 1,
  name: 'Test Season',
  active: true,
  lastUpdated: new Date(),
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000), // tomorrow
  type: 'dotadeck',
  creatorID: 1,
  leagueID: 1,
  ...overrides
}); 