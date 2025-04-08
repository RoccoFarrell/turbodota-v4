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

        // Get the user's item from their inventory
        const userItem = await prisma.seasonUserItem.findFirst({
            where: {
                id: itemId,
                seasonUserId: seasonUser.id
            },
            include: {
                item: true
            }
        });

        if (!userItem) {
            return json({ success: false, error: 'Item not found in inventory' }, { status: 404 });
        }

        // Calculate sell value
        const sellValue = Math.floor(userItem.item.cost * (userItem.item.sellValue / 100));

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Add gold to user
            const updatedUser = await tx.seasonUser.update({
                where: { id: seasonUser.id },
                data: { gold: seasonUser.gold + sellValue }
            });

            // If quantity is 1, delete the item, otherwise decrement quantity
            if (userItem.quantity === 1) {
                await tx.seasonUserItem.delete({
                    where: { id: userItem.id }
                });
            } else {
                await tx.seasonUserItem.update({
                    where: { id: userItem.id },
                    data: { quantity: userItem.quantity - 1 }
                });
            }

            return { updatedUser, sellValue };
        });

        return json({
            success: true,
            data: {
                user: result.updatedUser,
                sellValue: result.sellValue
            }
        });
    } catch (error) {
        console.error('Error selling item:', error);
        return json({ success: false, error: 'Failed to sell item' }, { status: 500 });
    }
}; 