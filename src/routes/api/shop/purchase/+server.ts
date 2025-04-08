import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
        return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
        return json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    try {
        // Get the active season
        const activeSeason = await prisma.season.findFirst({
            where: { active: true }
        });

        if (!activeSeason) {
            return json({ success: false, error: 'No active season found' }, { status: 400 });
        }

        // Get the user's season data
        const seasonUser = await prisma.seasonUser.findFirst({
            where: {
                accountId: session.user.account_id,
                seasonId: activeSeason.id
            }
        });

        if (!seasonUser) {
            return json({ success: false, error: 'User not found in active season' }, { status: 400 });
        }

        // Get the item
        const item = await prisma.dotadeckItem.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        // Check if user has enough gold
        if (seasonUser.gold < item.cost) {
            return json({ success: false, error: 'Not enough gold' }, { status: 400 });
        }

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Check if user already has this item
            const existingItem = await tx.seasonUserItem.findFirst({
                where: {
                    seasonUserId: seasonUser.id,
                    itemId: item.id
                }
            });

            let seasonUserItem;
            if (existingItem) {
                // Update quantity of existing item
                seasonUserItem = await tx.seasonUserItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + 1 }
                });
            } else {
                // Create a new inventory item
                seasonUserItem = await tx.seasonUserItem.create({
                    data: {
                        seasonUserId: seasonUser.id,
                        itemId: item.id,
                        quantity: 1,
                        purchasedAt: new Date()
                    }
                });
            }

            // Deduct gold from user
            const updatedUser = await tx.seasonUser.update({
                where: { id: seasonUser.id },
                data: { gold: seasonUser.gold - item.cost }
            });

            return { seasonUserItem, updatedUser };
        });

        return json({
            success: true,
            data: {
                item: result.seasonUserItem,
                user: result.updatedUser
            }
        });
    } catch (error) {
        console.error('Error purchasing item:', error);
        return json({ success: false, error: 'Failed to purchase item' }, { status: 500 });
    }
}; 