import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return json({ success: false, error: 'Not authenticated' });

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
            heroDraws: {
                include: {
                    card: true
                }
            }
        }
    });

    const heroes = await prisma.hero.findMany();

    const players = seasonUsers.map(su => {
        const wins = su.heroDraws.filter(d => d.matchResult === true);
        const losses = su.heroDraws.filter(d => d.matchResult === false && d.matchId);
        const discards = su.heroDraws.filter(d => d.matchResult === false && !d.matchId);

        // Calculate total gold/xp earned from wins
        const totalGoldEarned = wins.reduce((acc, draw) => acc + (draw.card?.baseGold ?? DOTADECK.BASE_STATS.GOLD), 0);
        const totalXPEarned = wins.reduce((acc, draw) => acc + (draw.card?.baseXP ?? DOTADECK.BASE_STATS.XP), 0);
        const winCount = wins.length;

        return {
            user: su.user.user,
            stats: {
                gold: totalGoldEarned,
                xp: totalXPEarned,
                wins: winCount,
                losses: losses.length,
                discards: discards.length,
                avgBounty: winCount > 0 ? {
                    gold: Math.round(totalGoldEarned / winCount),
                    xp: Math.round(totalXPEarned / winCount)
                } : null
            },
            currentHand: su.heroDraws
                .filter(d => d.matchResult === null)
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