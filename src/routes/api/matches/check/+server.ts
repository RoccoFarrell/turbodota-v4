import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';
import winOrLoss from '$lib/helpers/winOrLoss';

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
                },
                card: true  // Include card for creating history
            }
        });

        if (!heroDraws.length) {
            return json({ success: false, error: 'No active draws found' });
        }

        // Get all recent matches for the user
        const recentMatches = await prisma.match.findMany({
            where: {
                account_id: heroDraws[0].seasonUser.accountId,
            },
            orderBy: {
                start_time: 'desc'
            },
            take: 5
        });

        const heroes = await prisma.hero.findMany();

        const latestMatch = recentMatches[0];
        const latestMatchInfo = latestMatch ? {
            heroId: latestMatch.hero_id,
            timestamp: new Date(Number(latestMatch.start_time) * 1000)
        } : null;

        // Process each hero draw
        const results = await Promise.all(heroDraws.map(async heroDraw => {
            const heroMatches = recentMatches.filter(m => 
                m.hero_id === heroDraw.heroId && 
                m.start_time > BigInt(Math.floor(heroDraw.drawnAt.getTime() / 1000))
            );
            const latestMatch = heroMatches[0];
            const cardId = heroDraw.seasonUser.heldCards[0]?.id;
            
            if (latestMatch && cardId) {
                const matchWon = winOrLoss(latestMatch.player_slot, latestMatch.radiant_win);
                // Update the hero draw with match result
                await prisma.heroDraw.update({
                    where: { id: heroDraw.id },
                    data: { 
                        matchResult: matchWon,
                        matchId: latestMatch.match_id.toString()
                    }
                });
                
                // Update card stats
                await prisma.card.update({
                    where: { id: cardId },
                    data: {
                        baseXP: matchWon ? 100 : { increment: 50 },
                        baseGold: matchWon ? 100 : { increment: 50 }
                    }
                });

                // Add card history
                await prisma.cardHistory.create({
                    data: {
                        cardId: cardId,
                        seasonUserId: heroDraw.seasonUserId,
                        action: matchWon ? 'QUEST_WIN' : 'QUEST_LOSS',
                        xpMod: matchWon ? 100 : 50,
                        goldMod: matchWon ? 100 : 50
                    }
                });

                // Reset discard tokens
                await prisma.seasonUser.update({
                    where: { id: heroDraw.seasonUserId },
                    data: { discardTokens: 5 }
                });

                return {
                    heroId: heroDraw.heroId,
                    matchFound: true,
                    win: matchWon,
                    latestMatch: {
                        heroId: latestMatch.hero_id,
                        timestamp: new Date(Number(latestMatch.start_time) * 1000)
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
                result: winOrLoss(m.player_slot, m.radiant_win) ? 'Won Match' : 'Lost Match',
                hero: {
                    id: m.hero_id,
                    name: heroes.find(h => h.id === m.hero_id)?.name || 'Unknown',
                    localized_name: heroes.find(h => h.id === m.hero_id)?.localized_name || 'Unknown'
                },
                win: winOrLoss(m.player_slot, m.radiant_win),
                kills: m.kills,
                deaths: m.deaths,
                assists: m.assists,
                kda: ((m.kills + m.assists) / (m.deaths || 1)).toFixed(2),
                start_time: new Date(Number(m.start_time) * 1000).toLocaleString()
            }))
        });

    } catch (error) {
        console.error('Error checking matches:', error);
        return json({ success: false, error: 'Failed to check matches' });
    }
}; 