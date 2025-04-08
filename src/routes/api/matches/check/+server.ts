import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';
import winOrLoss from '$lib/helpers/winOrLoss';
import type { DotadeckCharmEffect } from '@prisma/client';

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
                        accountId: true
                    }
                },
                card: true  // We'll use this directly
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
            console.log('Hero Draw:', heroDraw.heroId, BigInt(Math.floor(heroDraw.drawnAt.getTime() / 1000)));
            console.log('Recent Matches:', recentMatches.forEach(m => console.log(m.hero_id, m.start_time)));
            const heroMatches = recentMatches.filter(m => 
                m.hero_id === heroDraw.heroId && 
                m.start_time > BigInt(Math.floor(heroDraw.drawnAt.getTime() / 1000))
            );
            const latestMatch = heroMatches[0];
            const cardId = heroDraw.card?.id;  // Add null check
            
            console.log('Latest match:', latestMatch, 'Card ID:', cardId);
            if (latestMatch && cardId) {
                const matchWon = winOrLoss(latestMatch.player_slot, latestMatch.radiant_win);
                
                // Get current card values before resetting
                const currentCard = await prisma.card.findUnique({
                    where: { id: cardId }
                });

                // Get active charm effects
                const activeCharms = await prisma.dotadeckCharmEffect.findMany({
                    where: {
                        seasonUserId: heroDraw.seasonUserId,
                        isActive: true,
                        expiresAt: {
                            gt: new Date()
                        }
                    }
                });

                // Calculate XP and gold modifiers from charms
                let xpMultiplier = 1;
                let goldMultiplier = 1;

                activeCharms.forEach((charm: DotadeckCharmEffect) => {
                    if (charm.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER) {
                        xpMultiplier = charm.effectValue;
                    } else if (charm.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER) {
                        goldMultiplier = charm.effectValue;
                    }
                });

                // Calculate final XP and gold values
                const baseXP = matchWon ? DOTADECK.BASE_STATS.XP : DOTADECK.LOSS_REWARD.XP;
                const baseGold = matchWon ? DOTADECK.BASE_STATS.GOLD : DOTADECK.LOSS_REWARD.GOLD;
                
                const finalXP = Math.floor(baseXP * xpMultiplier);
                const finalGold = Math.floor(baseGold * goldMultiplier);
                
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
                        baseXP: matchWon ? DOTADECK.BASE_STATS.XP : { increment: finalXP },
                        baseGold: matchWon ? DOTADECK.BASE_STATS.GOLD : { increment: finalGold },
                        holderId: null
                    }
                });

                // Add card history
                const cardHistory = await prisma.cardHistory.create({
                    data: {
                        cardId: cardId,
                        seasonUserId: heroDraw.seasonUserId,
                        action: matchWon ? 'QUEST_WIN' : 'QUEST_LOSS',
                        modType: matchWon ? 'RESET' : 'ADD',
                        currentGold: currentCard?.baseGold ?? DOTADECK.BASE_STATS.GOLD,
                        currentXP: currentCard?.baseXP ?? DOTADECK.BASE_STATS.XP,
                        xpMod: matchWon ? currentCard?.baseXP ?? DOTADECK.BASE_STATS.XP : finalXP,
                        goldMod: matchWon ? currentCard?.baseGold ?? DOTADECK.BASE_STATS.GOLD : finalGold
                    }
                });

                // Add charm effects to the card history
                for (const charm of activeCharms) {
                    await prisma.cardHistoryCharmEffect.create({
                        data: {
                            cardHistoryId: cardHistory.id,
                            charmEffectId: charm.id,
                            goldMod: charm.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER ? 
                                (matchWon ? DOTADECK.BASE_STATS.GOLD : DOTADECK.LOSS_REWARD.GOLD) * (charm.effectValue - 1) : 0,
                            xpMod: charm.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER ? 
                                (matchWon ? DOTADECK.BASE_STATS.XP : DOTADECK.LOSS_REWARD.XP) * (charm.effectValue - 1) : 0
                        }
                    });
                }

                // Deactivate used charms
                await prisma.dotadeckCharmEffect.updateMany({
                    where: {
                        id: {
                            in: activeCharms.map((charm: DotadeckCharmEffect) => charm.id)
                        }
                    },
                    data: {
                        isActive: false
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