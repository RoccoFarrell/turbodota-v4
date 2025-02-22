import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
    const { seasonUserId, heroIds } = await request.json();

    try {
        // First get all active hero draws to find the account ID
        const firstDraw = await prisma.heroDraw.findFirst({
            where: { seasonUserId },
            include: {
                seasonUser: {
                    select: { accountId: true }
                }
            }
        });

        if (!firstDraw) {
            return json({ success: false, error: 'No season user found' });
        }

        // Update matches first
        await fetch(`/api/updateMatchesForUser/${firstDraw.seasonUser.accountId}`);

        // Get all active hero draws
        const heroDraws = await prisma.heroDraw.findMany({
            where: {
                seasonUserId,
                heroId: { in: heroIds },
                matchResult: null
            },
            include: {
                seasonUser: {
                    select: {
                        accountId: true,
                        heldCards: {
                            where: { heroId: { in: heroIds } }
                        }
                    }
                }
            }
        });

        if (!heroDraws.length) {
            return json({ success: false, error: 'No active draws found' });
        }

        // Get all recent matches for the user
        const recentMatches = await prisma.playersMatchDetail.findMany({
            where: {
                account_id: heroDraws[0].seasonUser.accountId,
            },
            orderBy: {
                match_detail: { start_time: 'desc' }
            },
            include: {
                match_detail: true
            }
        });

        const latestMatch = recentMatches[0];
        const latestMatchInfo = latestMatch ? {
            heroId: latestMatch.hero_id,
            timestamp: new Date(Number(latestMatch.match_detail.start_time) * 1000)
        } : null;

        // Process each hero draw
        const results = heroDraws.map(heroDraw => {
            const heroMatches = recentMatches.filter(m => 
                m.hero_id === heroDraw.heroId && 
                m.match_detail.start_time > BigInt(Math.floor(heroDraw.drawnAt.getTime() / 1000))
            );
            const latestMatch = heroMatches[0];
            const cardId = heroDraw.seasonUser.heldCards[0]?.id;
            
            if (latestMatch && cardId) {
                // Process win
                return {
                    heroId: heroDraw.heroId,
                    matchFound: true,
                    latestMatch: {
                        heroId: latestMatch.hero_id,
                        timestamp: new Date(Number(latestMatch.match_detail.start_time) * 1000)
                    }
                };
            }
            
            return {
                heroId: heroDraw.heroId,
                matchFound: false,
                latestMatch: null
            };
        });

        return json({ success: true, results, latestMatchInfo });

    } catch (error) {
        console.error('Error checking matches:', error);
        return json({ success: false, error: 'Failed to check matches' });
    }
}; 