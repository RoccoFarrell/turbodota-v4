import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import prisma from '$lib/server/__mocks__/prisma';
import type { Card, CardHistory, SeasonUser, DotadeckCharmEffect } from '@prisma/client';
import { CardAction, ModType } from '@prisma/client';

vi.mock('$lib/server/prisma');

describe('DotaDeck Card Lifecycle Integration', () => {
  let seasonUser: SeasonUser;
  let card: Card;
  let charmEffect: DotadeckCharmEffect;

  beforeAll(async () => {
    // Mock season user
    seasonUser = {
      id: '1',
      accountId: 1,
      seasonId: 1,
      handSize: 3,
      discardTokens: 5,
      hasSeenRules: false,
      gold: 0,
      joinedAt: new Date()
    };

    // Mock card
    card = {
      id: '1',
      heroId: 1,
      baseGold: 100,
      baseXP: 100,
      goldMod: 0,
      xpMod: 0,
      drawLockCount: 0,
      lastDrawn: null,
      holderId: seasonUser.id,
      drawnAt: null,
      deckId: null,
      position: null
    };

    // Mock charm effect
    charmEffect = {
      id: '1',
      seasonUserId: seasonUser.id,
      itemId: '1',
      effectType: 'BOUNTY_MULTIPLIER',
      effectValue: 2.0,
      createdAt: new Date(),
      expiresAt: null,
      isActive: true
    };

    // Setup mock responses
    prisma.card.findUnique.mockResolvedValue(card);
    prisma.seasonUser.findUnique.mockResolvedValue(seasonUser);
    prisma.dotadeckCharmEffect.findMany.mockResolvedValue([charmEffect]);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Draw Flow', () => {
    it('should successfully draw a card', async () => {
      const cardHistory: CardHistory = {
        id: '1',
        cardId: card.id,
        action: CardAction.DRAWN,
        modType: ModType.ADD,
        seasonUserId: seasonUser.id,
        timestamp: new Date(),
        currentGold: 100,
        currentXP: 100,
        goldMod: 0,
        xpMod: 0
      };

      prisma.cardHistory.create.mockResolvedValue(cardHistory);
      prisma.card.update.mockResolvedValue({ ...card, holderId: seasonUser.id });

      // Test draw card endpoint
      const response = await fetch('/api/cards/draw', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(prisma.cardHistory.create).toHaveBeenCalled();
      expect(prisma.card.update).toHaveBeenCalled();
    });

    it('should respect hand size limits', async () => {
      // Mock full hand
      prisma.card.count.mockResolvedValue(seasonUser.handSize);

      // Test draw card endpoint
      const response = await fetch('/api/cards/draw', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(400);
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });

  describe('Card Play Flow', () => {
    it('should handle QUEST_WIN with charm effects', async () => {
      const cardHistory: CardHistory = {
        id: '2',
        cardId: card.id,
        action: CardAction.QUEST_WIN,
        modType: ModType.MODIFY,
        seasonUserId: seasonUser.id,
        timestamp: new Date(),
        currentGold: 200,
        currentXP: 200,
        goldMod: 100,
        xpMod: 100
      };

      prisma.cardHistory.create.mockResolvedValue(cardHistory);
      prisma.seasonUser.update.mockResolvedValue({
        ...seasonUser,
        gold: seasonUser.gold + 200
      });

      // Test match resolution endpoint
      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({
          seasonUserId: seasonUser.id,
          matchId: '123456789',
          win: true
        })
      });

      expect(response.status).toBe(200);
      expect(prisma.cardHistory.create).toHaveBeenCalled();
      expect(prisma.seasonUser.update).toHaveBeenCalled();
    });

    it('should handle QUEST_LOSS with charm effects', async () => {
      const cardHistory: CardHistory = {
        id: '3',
        cardId: card.id,
        action: CardAction.QUEST_LOSS,
        modType: ModType.MODIFY,
        seasonUserId: seasonUser.id,
        timestamp: new Date(),
        currentGold: 50,
        currentXP: 50,
        goldMod: -50,
        xpMod: -50
      };

      prisma.cardHistory.create.mockResolvedValue(cardHistory);
      prisma.seasonUser.update.mockResolvedValue({
        ...seasonUser,
        gold: seasonUser.gold - 50
      });

      // Test match resolution endpoint
      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({
          seasonUserId: seasonUser.id,
          matchId: '123456789',
          win: false
        })
      });

      expect(response.status).toBe(200);
      expect(prisma.cardHistory.create).toHaveBeenCalled();
      expect(prisma.seasonUser.update).toHaveBeenCalled();
    });
  });

  describe('Card Discard Flow', () => {
    it('should successfully discard a card', async () => {
      const cardHistory: CardHistory = {
        id: '4',
        cardId: card.id,
        action: CardAction.DISCARDED,
        modType: ModType.SUBTRACT,
        seasonUserId: seasonUser.id,
        timestamp: new Date(),
        currentGold: seasonUser.gold,
        currentXP: 100,
        goldMod: 0,
        xpMod: 0
      };

      prisma.cardHistory.create.mockResolvedValue(cardHistory);
      prisma.card.update.mockResolvedValue({ ...card, holderId: null });
      prisma.seasonUser.update.mockResolvedValue({
        ...seasonUser,
        discardTokens: seasonUser.discardTokens - 1
      });

      // Test discard card endpoint
      const response = await fetch('/api/cards/discard', {
        method: 'POST',
        body: JSON.stringify({
          seasonUserId: seasonUser.id,
          cardId: card.id
        })
      });

      expect(response.status).toBe(200);
      expect(prisma.cardHistory.create).toHaveBeenCalled();
      expect(prisma.card.update).toHaveBeenCalled();
      expect(prisma.seasonUser.update).toHaveBeenCalled();
    });

    it('should prevent discard without tokens', async () => {
      // Mock no discard tokens
      prisma.seasonUser.findUnique.mockResolvedValue({
        ...seasonUser,
        discardTokens: 0
      });

      // Test discard card endpoint
      const response = await fetch('/api/cards/discard', {
        method: 'POST',
        body: JSON.stringify({
          seasonUserId: seasonUser.id,
          cardId: card.id
        })
      });

      expect(response.status).toBe(400);
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });
}); 