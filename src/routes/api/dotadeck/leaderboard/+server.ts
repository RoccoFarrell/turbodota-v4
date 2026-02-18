import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';

export const GET: RequestHandler = async ({ locals }) => {
    const user = locals.user;
    if (!user) return json({ success: false, error: 'Not authenticated' });

    // Get all users in the active season
    const seasonUsers = await prisma.seasonUser.findMany({
        where: {
            season: {
                active: true
            }
        },
        include: {
            user: {
                include: {
                    user: {
                        select: {
                            username: true,
                            avatar_url: true
                        }
                    }
                }
            },
            cardHistory: true,
            heroDraws: {
                where: { matchResult: null },
                include: { card: true }
            }
        }
    });

    const heroes = await prisma.hero.findMany();

    const players = seasonUsers.map(su => {
        // Calculate all stats from card history
        const stats = su.cardHistory.reduce((acc, h) => ({
            gold: acc.gold + (h.action === 'QUEST_WIN' ? h.goldMod : 0),
            xp: acc.xp + (h.action === 'QUEST_WIN' ? h.xpMod : 0),
            wins: acc.wins + (h.action === 'QUEST_WIN' ? 1 : 0),
            losses: acc.losses + (h.action === 'QUEST_LOSS' ? 1 : 0),
            discards: acc.discards + (h.action === 'DISCARDED' ? 1 : 0)
        }), { gold: 0, xp: 0, wins: 0, losses: 0, discards: 0 });

        return {
            user: su.user.user,
            stats: {
                ...stats,
                avgBounty: stats.wins > 0 ? {
                    gold: Math.round(stats.gold / stats.wins),
                    xp: Math.round(stats.xp / stats.wins)
                } : null
            },
            currentHand: su.heroDraws
                .map(d => ({
                    id: d.heroId,
                    localized_name: heroes.find(h => h.id === d.heroId)?.localized_name || 'Unknown',
                    xp: d.card?.baseXP ?? 100,
                    gold: d.card?.baseGold ?? 100
                }))
        };
    });

    return json({ success: true, players });
}; 