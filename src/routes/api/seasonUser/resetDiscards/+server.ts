import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { accountId }: { accountId: number } = await request.json();

    try {
        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { active: true }
        });

        if (!activeSeason) {
            return json({ success: false, error: 'No active season found' });
        }

        await prisma.seasonUser.update({
            where: { 
                seasonId_accountId: {
                    seasonId: activeSeason.id,
                    accountId
                }
            },
            data: { discardTokens: 10 }
        });

        return json({ success: true });
    } catch (error) {
        console.error('Error resetting discards:', error);
        return json({ success: false, error: 'Failed to reset discards' });
    }
}; 