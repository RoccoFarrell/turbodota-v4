import type { LayoutServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) return { activeGame: null };

    const activeGame = await prisma.dotaDeckGame.findFirst({
        where: { 
            userId: user.id,
            status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
    });

    return { activeGame };
}; 