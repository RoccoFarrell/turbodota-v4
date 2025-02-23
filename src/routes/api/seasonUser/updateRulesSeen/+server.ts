import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { seasonUserId } = await request.json();

    try {
        await prisma.seasonUser.update({
            where: { id: seasonUserId },
            data: { hasSeenRules: true }
        });

        return json({ success: true });
    } catch (error) {
        console.error('Error updating rules seen:', error);
        return json({ success: false, error: 'Failed to update rules seen status' });
    }
}; 