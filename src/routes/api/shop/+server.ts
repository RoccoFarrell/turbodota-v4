import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return json({ success: false, error: 'Not authenticated' });

    try {
        // Get all available items
        const items = await prisma.dotadeckItem.findMany({
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Get user's current gold from their active season
        const activeSeason = await prisma.season.findFirst({
            where: {
                active: true
            }
        });

        if (!activeSeason) {
            return json({ success: false, error: 'No active season found' });
        }

        const seasonUser = await prisma.seasonUser.findUnique({
            where: {
                seasonId_accountId: {
                    seasonId: activeSeason.id,
                    accountId: session.user.account_id
                }
            }
        });

        if (!seasonUser) {
            return json({ success: false, error: 'User not found in active season' });
        }

        return json({
            success: true,
            items,
            userGold: seasonUser.gold || 0
        });
    } catch (error) {
        console.error('Error fetching shop items:', error);
        return json({ success: false, error: 'Failed to fetch shop items' });
    }
}; 