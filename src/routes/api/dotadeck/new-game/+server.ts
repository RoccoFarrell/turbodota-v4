import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export async function POST({ locals }) {
    const session = await locals.auth.validate();
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    try {
        // Start transaction to update everything atomically
        await prisma.$transaction(async (tx) => {
            // Complete any active games
            await tx.dotaDeckGame.updateMany({
                where: {
                    userId: session.user.userId,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // Create new game
            await tx.dotaDeckGame.create({
                data: {
                    userId: session.user.userId,
                    gold: 10, // Starting gold
                    score: 0,
                    status: 'ACTIVE'
                }
            });
        });

        return json({ success: true });
    } catch (e) {
        console.error('Error creating new game:', e);
        throw error(500, 'Failed to create new game');
    }
} 