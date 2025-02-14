import type { LayoutServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return { activeGame: null };

    const activeGame = await prisma.dotaDeckGame.findFirst({
        where: { 
            userId: session.user.userId,
            status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
    });

    return { activeGame };
}; 