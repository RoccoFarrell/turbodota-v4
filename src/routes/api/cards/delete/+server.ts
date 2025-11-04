import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    const session = await locals.auth.validate();
    if (!session) {
        error(401, 'Unauthorized');
    }

    const { userCardId } = await request.json();

    try {
        await prisma.userCard.delete({
            where: {
                id: userCardId
            }
        });

        return json({ success: true });
    } catch (e) {
        console.error('Error deleting card:', e);
        error(500, 'Failed to delete card');
    }
} 