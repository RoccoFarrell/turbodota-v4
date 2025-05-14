import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import prisma from '$lib/server/prisma';
import { createMockRequestEvent, createMockPostRequest } from '../../../../tests/fixtures/request';
import { createMockSeasonUser, createMockHeroDraw, createMockCard, createMockCharmEffect } from '../../../../tests/fixtures/dotadeck';
import { createMockMatch, createMockFetchResponse } from '../../../../tests/fixtures/match';

// Mock DOTADECK constants
vi.mock('$lib/constants/dotadeck', () => ({
    DOTADECK: {
        BASE_STATS: { XP: 100, GOLD: 100 },
        LOSS_REWARD: { XP: 50, GOLD: 50 },
        CHARM_EFFECTS: {
            XP_MULTIPLIER: 'XP_MULTIPLIER',
            BOUNTY_MULTIPLIER: 'BOUNTY_MULTIPLIER'
        }
    }
}));

// Mock prisma
vi.mock('$lib/server/prisma', () => ({
    default: {
        heroDraw: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn()
        },
        match: { 
            findMany: vi.fn() 
        },
        hero: { 
            findMany: vi.fn() 
        },
        card: { 
            findUnique: vi.fn(), 
            update: vi.fn() 
        },
        seasonUser: { 
            findUnique: vi.fn(), 
            update: vi.fn() 
        },
        cardHistory: { 
            create: vi.fn() 
        },
        dotadeckCharmEffect: { 
            findMany: vi.fn(), 
            updateMany: vi.fn() 
        },
        cardHistoryCharmEffect: { 
            create: vi.fn() 
        },
        $transaction: vi.fn()
    }
}));

// Mock auth
vi.mock('$lib/server/auth', () => ({
    auth: {
        validate: vi.fn()
    }
}));

// Mock winOrLoss helper
vi.mock('$lib/helpers/winOrLoss', () => ({
    default: vi.fn().mockReturnValue(true) // Default to returning a win
}));

describe('Match Check API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully process a win', async () => {
        // Create spy functions for specific method calls
        const mockHeroDrawUpdate = vi.fn().mockResolvedValue(createMockHeroDraw({ matchResult: true }));
        const mockCardUpdate = vi.fn().mockResolvedValue(createMockCard({ holderId: null }));
        const mockCardHistoryCreate = vi.fn().mockResolvedValue({ id: 'history1' });
        
        // 1. Set up a hero draw that matches the hero in the match
        const heroId = 1;
        const drawTime = new Date(Date.now() - 3600000); // 1 hour ago
        const mockHeroDraw = createMockHeroDraw({
            id: 'draw1',
            heroId: heroId,
            drawnAt: drawTime,
            cardId: 'card1'
        });
        
        // 2. Set up a match with the same hero_id
        const matchTime = Math.floor(Date.now() / 1000 - 1800); // 30 minutes ago
        const mockMatch = createMockMatch({
            match_id: 12345,
            start_time: BigInt(matchTime),
            hero_id: heroId, // SAME hero ID as the draw
            radiant_win: true,
            player_slot: 0 // Radiant player
        });
        
        // 3. Set up the find operations to return our test data
        (prisma.heroDraw.findFirst as any).mockResolvedValue({
            ...mockHeroDraw,
            seasonUser: { accountId: '123456789' }
        });
        
        (prisma.heroDraw.findMany as any).mockResolvedValue([{
            ...mockHeroDraw,
            seasonUser: { accountId: '123456789' },
            card: createMockCard({ id: 'card1', heroId: heroId })
        }]);
        
        (prisma.match.findMany as any).mockResolvedValue([mockMatch]);
        
        (prisma.hero.findMany as any).mockResolvedValue([
            { id: heroId, name: 'test_hero', localized_name: 'Test Hero' }
        ]);
        
        (prisma.card.findUnique as any).mockResolvedValue(createMockCard({ 
            id: 'card1',
            heroId: heroId 
        }));
        
        (prisma.dotadeckCharmEffect.findMany as any).mockResolvedValue([]);
        (prisma.dotadeckCharmEffect.updateMany as any).mockResolvedValue({ count: 0 });
        (prisma.seasonUser.update as any).mockResolvedValue(createMockSeasonUser());
        
        // 4. Replace the important methods with our spies
        prisma.heroDraw.update = mockHeroDrawUpdate;
        prisma.card.update = mockCardUpdate;
        prisma.cardHistory.create = mockCardHistoryCreate;
        
        // 5. Set up fetch mock
        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve([mockMatch])
        });
        
        // 6. Run the test
        const request = createMockPostRequest({ 
            seasonUserId: 'user1',
            heroIds: [heroId]
        });
        
        const response = await POST(createMockRequestEvent(request, '/api/matches/check'));
        const result = await response.json();

        // 7. Assert
        expect(result.success).toBe(true);
        expect(mockHeroDrawUpdate).toHaveBeenCalled();
        expect(mockCardUpdate).toHaveBeenCalled();
        expect(mockCardHistoryCreate).toHaveBeenCalled();
        
        expect(mockHeroDrawUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'draw1' },
                data: expect.objectContaining({
                    matchResult: true,
                    matchId: "12345"
                })
            })
        );
        
        expect(mockCardHistoryCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'QUEST_WIN',
                    modType: 'RESET'
                })
            })
        );
    });

    it('should handle no matching hero draws', async () => {
        // Mock no hero draws found
        (prisma.heroDraw.findMany as any).mockResolvedValueOnce([]);
        
        const request = createMockPostRequest({ 
            seasonUserId: 'user1',
            heroIds: [1]
        });
        
        const response = await POST(createMockRequestEvent(request, '/api/matches/check'));
        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toContain('No active draws found');
    });

    it('should handle no matching games', async () => {
        // Set up hero draw with card
        (prisma.heroDraw.findMany as any).mockResolvedValue([
            {
                ...createMockHeroDraw(),
                seasonUser: { accountId: '123456789' },
                card: createMockCard()
            }
        ]);
        
        // Mock no matching games found - different hero ID
        (prisma.match.findMany as any).mockResolvedValue([
            createMockMatch({
                hero_id: 999, // different hero ID
                start_time: BigInt(Math.floor(Date.now() / 1000))
            })
        ]);
        
        const request = createMockPostRequest({ 
            seasonUserId: 'user1',
            heroIds: [1]
        });
        
        const response = await POST(createMockRequestEvent(request, '/api/matches/check'));
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(result.results[0].matchFound).toBe(false);
    });

    it('should handle a loss correctly', async () => {
        // Create spy functions for specific method calls
        const mockHeroDrawUpdate = vi.fn().mockResolvedValue(createMockHeroDraw({ matchResult: false }));
        const mockCardUpdate = vi.fn().mockResolvedValue(createMockCard({ holderId: null }));
        const mockCardHistoryCreate = vi.fn().mockResolvedValue({ id: 'history1' });
        
        // Update specific method mocks
        prisma.heroDraw.update = mockHeroDrawUpdate;
        prisma.card.update = mockCardUpdate;
        prisma.cardHistory.create = mockCardHistoryCreate;
        
        // Set up hero draw with card
        (prisma.heroDraw.findMany as any).mockResolvedValue([
            {
                ...createMockHeroDraw(),
                seasonUser: { accountId: '123456789' },
                card: createMockCard()
            }
        ]);
        
        // Mock a loss
        (prisma.match.findMany as any).mockResolvedValue([
            createMockMatch({
                radiant_win: false, // player lost
                player_slot: 128, // Dire player (> 127)
                start_time: BigInt(Math.floor(Date.now() / 1000)),
                hero_id: 1
            })
        ]);
        
        // Set up card data
        (prisma.card.findUnique as any).mockResolvedValue(createMockCard());
        
        // Set up charm effects
        (prisma.dotadeckCharmEffect.findMany as any).mockResolvedValue([]);
        
        const request = createMockPostRequest({ 
            seasonUserId: 'user1',
            heroIds: [1]
        });
        
        const response = await POST(createMockRequestEvent(request, '/api/matches/check'));
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(mockCardHistoryCreate).toHaveBeenCalled();
        expect(mockCardHistoryCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'QUEST_LOSS',
                    modType: 'ADD'
                })
            })
        );
    });
}); 