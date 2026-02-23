import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const heroId = parseInt(params.heroId);
    
    try {
        // Get all card history for this hero in active seasons
        const history = await prisma.cardHistory.findMany({
            where: {
                card: {
                    heroId,
                    deck: {
                        season: {
                            active: true
                        }
                    }
                }
            },
            include: {
                seasonUser: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        return json({
            success: true,
            history: history.map(h => ({
                action: h.action,
                timestamp: h.timestamp,
                username: h.seasonUser.user.display_name ?? 'Unknown',
                goldMod: h.goldMod,
                xpMod: h.xpMod
            }))
        });
    } catch (error) {
        console.error('Error fetching card history:', error);
        return json({ success: false, error: 'Failed to fetch history' });
    }
}; 