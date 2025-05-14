import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './+server';
import prisma from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';
import type { RouteParams } from './$types';
import { createMockSeasonUser, createMockCard, createMockHeroDraw } from '../../../../tests/fixtures/dotadeck';
import { createMockRequestEvent, createMockPostRequest } from '../../../../tests/fixtures/request';

// Mock the prisma client
vi.mock('$lib/server/prisma', () => {
    const mockSeasonUser = createMockSeasonUser();
    const mockCards = [
        createMockCard({ 
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
            position: null
        }),
        createMockCard({ 
            id: 'card2', 
            heroId: 2,
            baseGold: 100,
            baseXP: 100,
            goldMod: 0,
            xpMod: 0,
            drawLockCount: 0,
            lastDrawn: null,
            holderId: null,
            drawnAt: null,
            deckId: null,
            position: null
        })
    ];
    const mockActiveDraws = [
        {
            heroId: 3,
            seasonUser: { accountId: 123 }
        }
    ];

    const mockTx = {
        heroDraw: {
            create: vi.fn().mockResolvedValue({ id: 'draw1' })
        },
        cardHistory: {
            create: vi.fn().mockResolvedValue({ id: 'history1' })
        },
        card: {
            update: vi.fn().mockResolvedValue({
                ...mockCards[0],
                holderId: 'user1',
                lastDrawn: new Date()
            })
        }
    };

    return {
        default: {
            $transaction: vi.fn().mockImplementation(async (arg) => {
                if (Array.isArray(arg)) {
                    return [mockSeasonUser, 1, mockActiveDraws, mockCards];
                }
                // For callback transaction
                return arg(mockTx);
            }),
            seasonUser: {
                findUnique: vi.fn().mockResolvedValue(mockSeasonUser)
            },
            heroDraw: {
                count: vi.fn().mockResolvedValue(1),
                findMany: vi.fn().mockResolvedValue(mockActiveDraws),
                create: vi.fn()
            },
            card: {
                findMany: vi.fn().mockResolvedValue(mockCards),
                update: vi.fn()
            },
            cardHistory: {
                create: vi.fn()
            }
        }
    };
});

// Mock auth validation
vi.mock('$lib/server/auth', () => ({
    auth: {
        validate: vi.fn().mockResolvedValue({
            user: {
                id: 'test-user-id',
                accountId: 123
            }
        })
    }
}));

describe('Card Draw Endpoint', () => {
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
    });

    it('should successfully draw a card when valid', async () => {
        const request = createMockPostRequest({ seasonUserId: 'user1' });
        const response = await POST(createMockRequestEvent(request, '/api/cards/draw'));
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(result.card).toBeDefined();
    });

    it('should fail when hand is full', async () => {
        // Override the transaction mock for this test to return a full hand
        (prisma.$transaction as any).mockImplementationOnce(async (arg: unknown) => {
            if (Array.isArray(arg)) {
                return [
                    createMockSeasonUser(), // mockSeasonUser
                    3,  // currentHand (full)
                    [{ heroId: 3, seasonUser: { accountId: 123 } }], // mockActiveDraws
                    [createMockCard({ 
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
                        position: null
                    })] // mockCards
                ];
            }
            // For callback transaction, return null since this test shouldn't reach that point
            return null;
        });
 
        const request = createMockPostRequest({ seasonUserId: 'user1' });
        const response = await POST(createMockRequestEvent(request, '/api/cards/draw'));
        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot draw more than');
    });

    it('should create correct history entry', async () => {
        const mockCardHistoryCreate = vi.fn().mockResolvedValue({ id: 'history1' });
        const mockHeroDrawCreate = vi.fn().mockResolvedValue({ id: 'draw1' });
        const mockCardUpdate = vi.fn().mockResolvedValue({
            ...createMockCard(),
            holderId: 'user1',
            lastDrawn: new Date(),
            hero: {
                id: 1,
                localized_name: 'Test Hero'
            }
        });

        // Override the transaction mock for this test
        (prisma.$transaction as any).mockImplementation(async (arg: unknown) => {
            if (Array.isArray(arg)) {
                return [
                    createMockSeasonUser(), // mockSeasonUser
                    1,  // currentHand
                    [{ heroId: 3, seasonUser: { accountId: 123 } }], // mockActiveDraws
                    [createMockCard({ 
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
                        position: null
                    })] // mockCards
                ];
            }
            // For callback transaction
            const tx = {
                heroDraw: {
                    create: mockHeroDrawCreate
                },
                cardHistory: {
                    create: mockCardHistoryCreate
                },
                card: {
                    update: mockCardUpdate
                }
            };
            return (arg as Function)(tx);
        });

        const request = createMockPostRequest({ seasonUserId: 'user1' });
        const response = await POST(createMockRequestEvent(request, '/api/cards/draw'));
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(mockCardHistoryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                action: 'DRAWN',
                modType: 'MODIFY',
                goldMod: 0,
                xpMod: 0
            })
        });
    });

    it('should update card holder correctly', async () => {
        const mockCardUpdate = vi.fn().mockResolvedValue({
            ...createMockCard(),
            holderId: 'user1',
            lastDrawn: new Date(),
            hero: {
                id: 1,
                localized_name: 'Test Hero'
            }
        });

        // Override the transaction mock for this test
        (prisma.$transaction as any).mockImplementation(async (arg: unknown) => {
            if (Array.isArray(arg)) {
                return [
                    createMockSeasonUser(), // mockSeasonUser
                    1,  // currentHand
                    [{ heroId: 3, seasonUser: { accountId: 123 } }], // mockActiveDraws
                    [createMockCard({ 
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
                        position: null
                    })] // mockCards
                ];
            }
            // For callback transaction
            const tx = {
                heroDraw: {
                    create: vi.fn().mockResolvedValue({ id: 'draw1' })
                },
                cardHistory: {
                    create: vi.fn().mockResolvedValue({ id: 'history1' })
                },
                card: {
                    update: mockCardUpdate
                }
            };
            return (arg as Function)(tx);
        });

        const request = createMockPostRequest({ seasonUserId: 'user1' });
        const response = await POST(createMockRequestEvent(request, '/api/cards/draw'));
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(mockCardUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    holderId: 'user1',
                    lastDrawn: expect.any(Date)
                })
            })
        );
    });
}); 