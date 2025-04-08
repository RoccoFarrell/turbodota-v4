import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return json({ success: false, error: 'Not authenticated' });

    const history = await prisma.cardHistory.findMany({
        where: {
            seasonUser: {
                season: {
                    active: true
                }
            }
        },
        include: {
            seasonUser: {
                include: {
                    user: {
                        include: {
                            user: true
                        }
                    }
                }
            },
            card: {
                include: {
                    hero: true
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
            ...h,
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
}; 