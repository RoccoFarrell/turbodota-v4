import prisma from '$lib/server/prisma';
import type { Season } from '@prisma/client';

export async function initializeDotaDeckSeason(season: Season) {
    // Create default deck
    const deck = await prisma.deck.create({
        data: {
            name: 'Default Deck',
            seasonId: season.id,
            isActive: true
        }
    });

    // Get all heroes
    const heroes = await prisma.hero.findMany();

    // Create cards for each hero with default values
    const cardPromises = heroes.map(hero => 
        prisma.card.create({
            data: {
                heroId: hero.id,
                baseGold: 100,
                baseXP: 100,
                deckId: deck.id
            }
        })
    );

    await Promise.all(cardPromises);

    // Create SeasonUser entries for all season members
    const seasonMembers = await prisma.season.findUnique({
        where: { id: season.id },
        include: { members: true }
    });

    if (seasonMembers?.members) {
        const seasonUserPromises = seasonMembers.members.map(member =>
            prisma.seasonUser.create({
                data: {
                    seasonId: season.id,
                    accountId: member.account_id,
                    handSize: 3
                }
            })
        );

        await Promise.all(seasonUserPromises);
    }
} 