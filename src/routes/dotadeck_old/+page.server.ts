import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const authUser = locals.user;
    if (!authUser) return { cards: [], score: 0, gold: 0 };

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
            userCards: {
                include: {
                    card: true
                }
            },
            dotaDeckGames: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    rounds: {
                        where: { status: 'IN_PROGRESS' },
                        include: { activeCards: true }
                    }
                }
            }
        }
    });

    // Create new active game if none exists
    if (!user?.dotaDeckGames.length) {
        await prisma.dotaDeckGame.create({
            data: {
                userId: authUser.id
            }
        });
    }

    const activeGame = user?.dotaDeckGames[0];
    
    // Get 5 random cards
    const shopCards = await prisma.heroCard.findMany({
        take: 5,
        // Simple random order
        orderBy: {
            id: 'asc'
        },
        skip: Math.floor(Math.random() * await prisma.heroCard.count())
    });

    return {
        userCards: user?.userCards ?? [],
        score: activeGame?.score || 0,
        gold: activeGame?.gold || 0,
        currentRound: activeGame?.rounds[0] || null,
        userStats: {
            soloGamesPlayed: activeGame?.soloGamesPlayed || 0,
            winStreak: activeGame?.winStreak || 0,
            playStreak: activeGame?.playStreak || 0
        },
        shopCards
    };
}; 