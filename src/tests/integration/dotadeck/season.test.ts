import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { initializeDotaDeckSeason } from '$lib/server/dotadeck';
import prisma from '$lib/server/__mocks__/prisma';
import type { Season, SeasonUser, User } from '@prisma/client';

vi.mock('$lib/server/prisma');

describe('DotaDeck Season Integration', () => {
  let season: Season;
  let users: SeasonUser[];

  beforeAll(async () => {
    // Mock season creation
    prisma.season.create.mockResolvedValue({
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    });

    // Mock users
    prisma.user.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'User 1',
        username: 'user1',
        account_id: 1,
        steam_id: BigInt(1),
        profile_url: 'http://example.com',
        avatar_url: 'http://example.com/avatar',
        roles: 'user',
        createdDate: new Date(),
        lastUpdated: new Date()
      },
      {
        id: '2',
        name: 'User 2',
        username: 'user2',
        account_id: 2,
        steam_id: BigInt(2),
        profile_url: 'http://example.com',
        avatar_url: 'http://example.com/avatar',
        roles: 'user',
        createdDate: new Date(),
        lastUpdated: new Date()
      }
    ]);

    // Mock season user creation
    prisma.seasonUser.createMany.mockResolvedValue({ count: 2 });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize a new season successfully', async () => {
    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    const result = await initializeDotaDeckSeason(seasonData);
    expect(result).toBeDefined();
    expect(prisma.season.create).toHaveBeenCalled();
  });

  it('should create season users for all participants', async () => {
    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    await initializeDotaDeckSeason(seasonData);
    expect(prisma.seasonUser.createMany).toHaveBeenCalled();
  });

  it('should create default decks for all users', async () => {
    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    await initializeDotaDeckSeason(seasonData);
    expect(prisma.deck.createMany).toHaveBeenCalled();
  });

  it('should create default items for the season', async () => {
    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    await initializeDotaDeckSeason(seasonData);
    expect(prisma.dotadeckItem.createMany).toHaveBeenCalled();
  });

  it('should handle multiple users joining mid-season', async () => {
    // Mock new user joining
    prisma.user.findMany.mockResolvedValueOnce([{
      id: '3',
      name: 'New User',
      username: 'user3',
      account_id: 3,
      steam_id: BigInt(3),
      profile_url: 'http://example.com',
      avatar_url: 'http://example.com/avatar',
      roles: 'user',
      createdDate: new Date(),
      lastUpdated: new Date()
    }]);
    prisma.seasonUser.create.mockResolvedValueOnce({ 
      id: '1', 
      accountId: 3,
      seasonId: 1,
      handSize: 3,
      discardTokens: 5,
      hasSeenRules: false,
      gold: 0,
      joinedAt: new Date()
    });

    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    const result = await initializeDotaDeckSeason(seasonData);
    expect(result).toBeDefined();
    expect(prisma.seasonUser.create).toHaveBeenCalled();
  });

  it('should maintain deck sharing rules between users', async () => {
    // Mock deck sharing
    prisma.deck.findFirst.mockResolvedValue({
      id: '1',
      name: 'Test Deck',
      seasonId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const seasonData = {
      id: 1,
      name: 'Test Season',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      type: 'regular',
      creatorID: 1,
      leagueID: 1,
      lastUpdated: new Date()
    };
    const result = await initializeDotaDeckSeason(seasonData);
    expect(result).toBeDefined();
    expect(prisma.deck.findFirst).toHaveBeenCalled();
  });
}); 