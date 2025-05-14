import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeDotaDeckSeason } from './dotadeck';
import prisma from './prisma';
import type { Season } from '@prisma/client';

// Mock the prisma client
vi.mock('./prisma', () => ({
    default: {
        deck: {
            create: vi.fn()
        },
        hero: {
            findMany: vi.fn()
        },
        card: {
            create: vi.fn()
        },
        dotadeckItem: {
            upsert: vi.fn()
        },
        season: {
            findUnique: vi.fn()
        },
        seasonUser: {
            create: vi.fn()
        }
    }
}));

describe('DotaDeck Season Initialization', () => {
    const mockSeason: Season = {
        id: 1,
        name: 'Test Season',
        active: true,
        lastUpdated: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // tomorrow
        type: 'dotadeck',
        creatorID: 1,
        leagueID: 1
    };

    const mockHeroes = [
        { id: 1, name: 'Anti-Mage' },
        { id: 2, name: 'Axe' }
    ];

    const mockMembers = [
        { account_id: 123 },
        { account_id: 456 }
    ];

    beforeEach(() => {
        // Setup mock returns
        (prisma.deck.create as any).mockResolvedValue({ id: 'deck1', name: 'Default Deck' });
        (prisma.hero.findMany as any).mockResolvedValue(mockHeroes);
        (prisma.card.create as any).mockResolvedValue({ id: 'card1' });
        (prisma.dotadeckItem.upsert as any).mockResolvedValue({ id: 'item1' });
        (prisma.season.findUnique as any).mockResolvedValue({ 
            id: 1, 
            members: mockMembers 
        });
        (prisma.seasonUser.create as any).mockResolvedValue({ id: 'user1' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a default deck', async () => {
        await initializeDotaDeckSeason(mockSeason);
        expect(prisma.deck.create).toHaveBeenCalledWith({
            data: {
                name: 'Default Deck',
                seasonId: mockSeason.id,
                isActive: true
            }
        });
    });

    it('should create cards for all heroes', async () => {
        await initializeDotaDeckSeason(mockSeason);
        expect(prisma.card.create).toHaveBeenCalledTimes(mockHeroes.length);
        mockHeroes.forEach(hero => {
            expect(prisma.card.create).toHaveBeenCalledWith({
                data: {
                    heroId: hero.id,
                    baseGold: 100,
                    baseXP: 100,
                    deckId: 'deck1'
                }
            });
        });
    });

    it('should create all default items', async () => {
        await initializeDotaDeckSeason(mockSeason);
        expect(prisma.dotadeckItem.upsert).toHaveBeenCalledTimes(7); // Total number of default items
        
        // Verify specific items were created
        expect(prisma.dotadeckItem.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'item_discard_token_1' },
                create: expect.objectContaining({
                    name: 'Discard Token',
                    cost: 100,
                    sellValue: 50,
                    effectType: 'DISCARD_TOKEN',
                    effectValue: 1
                })
            })
        );
    });

    it('should create season users for all members', async () => {
        await initializeDotaDeckSeason(mockSeason);
        expect(prisma.seasonUser.create).toHaveBeenCalledTimes(mockMembers.length);
        mockMembers.forEach(member => {
            expect(prisma.seasonUser.create).toHaveBeenCalledWith({
                data: {
                    seasonId: mockSeason.id,
                    accountId: member.account_id,
                    handSize: 3
                }
            });
        });
    });

    it('should handle errors gracefully', async () => {
        // Simulate a database error
        (prisma.deck.create as any).mockRejectedValue(new Error('Database error'));
        
        await expect(initializeDotaDeckSeason(mockSeason)).rejects.toThrow('Database error');
    });
}); 