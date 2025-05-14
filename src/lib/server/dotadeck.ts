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

    // Create default items
    const defaultItems = [
        {
            id: 'item_discard_token_1',
            name: 'Discard Token',
            description: 'Allows you to discard a card from your hand',
            cost: 100,
            sellValue: 50,
            effectType: 'DISCARD_TOKEN',
            effectValue: 1
        },
        {
            id: 'item_discard_token_3',
            name: 'Discard Token Pack',
            description: 'Allows you to discard up to 3 cards from your hand',
            cost: 250,
            sellValue: 50,
            effectType: 'DISCARD_TOKEN',
            effectValue: 3
        },
        {
            id: 'item_bounty_1.5x',
            name: 'Bounty Charm',
            description: 'Increases gold earned from matches by 50%',
            cost: 200,
            sellValue: 50,
            effectType: 'BOUNTY_MULTIPLIER',
            effectValue: 1.5
        },
        {
            id: 'item_bounty_2x',
            name: 'Bounty Charm (2x)',
            description: 'Doubles gold earned from matches for your next game',
            cost: 350,
            sellValue: 50,
            effectType: 'BOUNTY_MULTIPLIER',
            effectValue: 2
        },
        {
            id: 'item_bounty_3x',
            name: 'Bounty Charm (3x)',
            description: 'Triples gold earned from matches for your next game',
            cost: 500,
            sellValue: 50,
            effectType: 'BOUNTY_MULTIPLIER',
            effectValue: 3
        },
        {
            id: 'item_xp_1.5x',
            name: 'XP Charm',
            description: 'Increases XP earned from matches by 50%',
            cost: 200,
            sellValue: 50,
            effectType: 'XP_MULTIPLIER',
            effectValue: 1.5
        },
        {
            id: 'item_xp_2x',
            name: 'XP Charm (2x)',
            description: 'Doubles XP earned from matches for your next game',
            cost: 350,
            sellValue: 50,
            effectType: 'XP_MULTIPLIER',
            effectValue: 2
        }
    ];

    // Create or update items
    const itemPromises = defaultItems.map(item =>
        prisma.dotadeckItem.upsert({
            where: { id: item.id },
            update: item,
            create: item
        })
    );

    await Promise.all(itemPromises);

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