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
                },
                charmEffects: {
                    include: {
                        charmEffect: {
                            include: {
                                item: true
                            }
                        }
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
                username: h.seasonUser.user.username,
                goldMod: h.goldMod,
                xpMod: h.xpMod,
                modType: h.modType,
                charmEffects: h.charmEffects.map(ce => ({
                    effectType: ce.charmEffect.effectType,
                    effectValue: ce.charmEffect.effectValue,
                    itemName: ce.charmEffect.item.name,
                    goldMod: ce.goldMod,
                    xpMod: ce.xpMod
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching card history:', error);
        return json({ success: false, error: 'Failed to fetch history' });
    }
}; 