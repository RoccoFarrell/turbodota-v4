import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { active: true },
            include: {
                decks: {
                    include: {
                        cards: {
                            include: {
                                hero: true,
                                heroDraws: {
                                    where: {
                                        matchResult: null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!activeSeason) {
            return json({ success: false, error: 'No active season found' });
        }

        // Transform cards into hero pool format
        const heroes = activeSeason.decks[0].cards.map(card => ({
            id: card.heroId,
            localized_name: card.hero.localized_name,
            xp: card.baseXP,
            gold: card.baseGold,
            isHeld: card.heroDraws.length > 0
        }));

        return json({ 
            success: true, 
            heroes 
        });
    } catch (error) {
        console.error('Error getting active heroes:', error);
        return json({ success: false, error: 'Failed to get active heroes' });
    }
}; 