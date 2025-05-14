import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import prisma from '$lib/server/__mocks__/prisma';
import type { SeasonUser, HeroDraw, Card, DotadeckCharmEffect } from '@prisma/client';

vi.mock('$lib/server/prisma');
vi.mock('node-fetch');

describe('DotaDeck Match Resolution Integration', () => {
  let seasonUser: SeasonUser;
  let heroDraw: HeroDraw;
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

    // Mock hero draw
    heroDraw = {
      id: '1',
      seasonUserId: seasonUser.id,
      heroId: 1,
      drawnAt: new Date(),
      matchResult: null,
      matchId: null,
      cardId: '1'
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
    prisma.seasonUser.findUnique.mockResolvedValue(seasonUser);
    prisma.heroDraw.findMany.mockResolvedValue([heroDraw]);
    prisma.card.findUnique.mockResolvedValue(card);
    prisma.dotadeckCharmEffect.findMany.mockResolvedValue([charmEffect]);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OpenDota API Integration', () => {
    it('should fetch and process recent matches', async () => {
      // Mock OpenDota API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          match_id: 123456789,
          hero_id: 1,
          player_slot: 0,
          radiant_win: true,
          start_time: Date.now() / 1000
        }])
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.opendota.com/api/players/1/matches')
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock OpenDota API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Failed to fetch matches from OpenDota API');
    });
  });

  describe('Match Finding Logic', () => {
    it('should find matching games for active hero draws', async () => {
      // Mock OpenDota API response with matching game
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          match_id: 123456789,
          hero_id: 1, // Matches the hero draw
          player_slot: 0,
          radiant_win: true,
          start_time: Date.now() / 1000
        }])
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(prisma.heroDraw.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: heroDraw.id },
          data: expect.objectContaining({
            matchResult: true,
            matchId: '123456789'
          })
        })
      );
    });

    it('should ignore non-matching games', async () => {
      // Mock OpenDota API response with non-matching game
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          match_id: 123456789,
          hero_id: 2, // Different hero
          player_slot: 0,
          radiant_win: true,
          start_time: Date.now() / 1000
        }])
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(prisma.heroDraw.update).not.toHaveBeenCalled();
    });
  });

  describe('Reward Calculations', () => {
    it('should calculate rewards with charm effects', async () => {
      // Mock OpenDota API response with winning game
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          match_id: 123456789,
          hero_id: 1,
          player_slot: 0,
          radiant_win: true,
          start_time: Date.now() / 1000
        }])
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(prisma.seasonUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: seasonUser.id },
          data: expect.objectContaining({
            gold: expect.any(Number)
          })
        })
      );
    });

    it('should handle multiple charm effects correctly', async () => {
      // Mock multiple active charm effects
      prisma.dotadeckCharmEffect.findMany.mockResolvedValue([
        {
          id: '1',
          seasonUserId: seasonUser.id,
          itemId: '1',
          effectType: 'BOUNTY_MULTIPLIER',
          effectValue: 2.0,
          createdAt: new Date(),
          expiresAt: null,
          isActive: true
        },
        {
          id: '2',
          seasonUserId: seasonUser.id,
          itemId: '2',
          effectType: 'XP_MULTIPLIER',
          effectValue: 1.5,
          createdAt: new Date(),
          expiresAt: null,
          isActive: true
        }
      ]);

      // Mock OpenDota API response with winning game
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          match_id: 123456789,
          hero_id: 1,
          player_slot: 0,
          radiant_win: true,
          start_time: Date.now() / 1000
        }])
      });

      const response = await fetch('/api/matches/check', {
        method: 'POST',
        body: JSON.stringify({ seasonUserId: seasonUser.id })
      });

      expect(response.status).toBe(200);
      expect(prisma.seasonUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: seasonUser.id },
          data: expect.objectContaining({
            gold: expect.any(Number)
          })
        })
      );
    });
  });
}); 