import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        // Get all card histories for active seasons
        const histories = await prisma.cardHistory.findMany({
            where: {
                card: {
                    deck: {
                        season: {
                            active: true
                        }
                    }
                }
            },
            include: {
                card: true,
                seasonUser: {
                    include: {
                        user: {
                            include: {
                                user: {
                                    select: {
                                        username: true
                                    }
                                }
                            }
                            
                        }
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        // Debug log to verify data structure
        console.log('First history entry:', histories[0]?.seasonUser?.user?.user?.username);

        // Group histories by heroId
        const groupedHistories = histories.reduce((acc, h) => {
            const heroId = h.card.heroId;
            if (!acc[heroId]) acc[heroId] = [];
            acc[heroId].push({
                action: h.action,
                timestamp: h.timestamp,
                username: h.seasonUser?.user?.user?.username || 'Unknown',
                goldMod: h.goldMod,
                xpMod: h.xpMod,
                heroId
            });
            return acc;
        }, {} as Record<number, any[]>);

        return json({
            success: true,
            histories: groupedHistories
        });
    } catch (error) {
        console.error('Error fetching card histories:', error);
        return json({ success: false, error: 'Failed to fetch histories' });
    }
}; 