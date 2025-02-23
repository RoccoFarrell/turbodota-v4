import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function DELETE({ params }) {
    try {
        console.log('Deleting season:', params.seasonId);
        const seasonId = parseInt(params.seasonId);

        // Delete in sequence to respect foreign key constraints
        await prisma.$transaction([
            // Delete season results first
            prisma.seasonResult.deleteMany({
                where: { seasonID: seasonId }
            }),
            // Delete turbotowns
            prisma.turbotown.deleteMany({
                where: { seasonID: seasonId }
            }),
            // Delete all cards in decks for this season
            prisma.card.deleteMany({
                where: {
                    deck: { seasonId }
                }
            }),
            // Delete decks
            prisma.deck.deleteMany({
                where: { seasonId }
            }),
            // Delete season users and their related records
            prisma.seasonUser.deleteMany({
                where: { seasonId }
            }),
            // Finally delete the season
            prisma.season.delete({
                where: { id: seasonId }
            })
        ]);

        return json({ success: true });
    } catch (error) {
        console.error('Error deleting season:', error);
        return json({ success: false, error: 'Failed to delete season' });
    }
} 