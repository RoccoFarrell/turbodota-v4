import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return json({ success: false, error: 'Not authenticated' });

    try {
        // Get user's active season
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

        // Get user's inventory with item details
        const inventory = await prisma.seasonUserItem.findMany({
            where: {
                seasonUserId: seasonUser.id
            },
            include: {
                item: true
            }
        });

        return json({
            success: true,
            inventory,
            userGold: seasonUser.gold
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return json({ success: false, error: 'Failed to fetch inventory' });
    }
}; 