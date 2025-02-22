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
            take: 5,
            include: {
                match_detail: true
            }
        });

        const heroes = await prisma.hero.findMany();

        const latestMatch = recentMatches[0];
        const latestMatchInfo = latestMatch ? {
            heroId: latestMatch.hero_id,
            timestamp: new Date(Number(latestMatch.match_detail?.start_time || 0) * 1000)
        } : null;

        // Process each hero draw
        const results = await Promise.all(heroDraws.map(async heroDraw => {
            const heroMatches = recentMatches.filter(m => 
                m.hero_id === heroDraw.heroId && 
                (m.match_detail?.start_time || 0n) > BigInt(Math.floor(heroDraw.drawnAt.getTime() / 1000))
            );
            const latestMatch = heroMatches[0];
            const cardId = heroDraw.seasonUser.heldCards[0]?.id;
            
            if (latestMatch && cardId) {
                // Update the hero draw with match result
                await prisma.heroDraw.update({
                    where: { id: heroDraw.id },
                    data: { 
                        matchResult: latestMatch.win === true,
                        matchId: latestMatch.match_id.toString()
                    }
                });
                
                // Update card stats
                await prisma.card.update({
                    where: { id: cardId },
                    data: {
                        baseXP: latestMatch.win ? 100 : { increment: 50 },
                        baseGold: latestMatch.win ? 100 : { increment: 50 }
                    }
                });

                // Add card history
                await prisma.cardHistory.create({
                    data: {
                        cardId: cardId,
                        seasonUserId: heroDraw.seasonUserId,
                        action: latestMatch.win ? 'QUEST_WIN' : 'QUEST_LOSS',
                        xpMod: latestMatch.win ? 100 : 50,
                        goldMod: latestMatch.win ? 100 : 50
                    }
                });

                return {
                    heroId: heroDraw.heroId,
                    matchFound: true,
                    win: latestMatch.win === true,
                    latestMatch: {
                        heroId: latestMatch.hero_id,
                        timestamp: new Date(Number(latestMatch.match_detail?.start_time || 0) * 1000)
                    }
                };
            }
            
            return {
                heroId: heroDraw.heroId,
                matchFound: false,
                latestMatch: null
            };
        }));

        return json({ 
            success: true, 
            results, 
            latestMatchInfo,
            recentMatches: recentMatches.map(m => ({
                match_id: m.match_id,
                result: m.win ? 'Won Match' : 'Lost Match',
                hero: {
                    id: m.hero_id,
                    name: heroes.find(h => h.id === m.hero_id)?.name || 'Unknown',
                    localized_name: heroes.find(h => h.id === m.hero_id)?.localized_name || 'Unknown'
                },
                win: m.win,
                kills: m.kills,
                deaths: m.deaths,
                assists: m.assists,
                kda: ((m.kills + m.assists) / (m.deaths || 1)).toFixed(2),
                start_time: new Date(Number(m.match_detail?.start_time) * 1000).toLocaleString()
            }))
        });

    } catch (error) {
        console.error('Error checking matches:', error);
        return json({ success: false, error: 'Failed to check matches' });
    }
}; 