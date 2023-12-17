import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
    const parentData = await parent();
    let response = await prisma.random.findMany({
        include: {
            user: true,
            match: true
        }
    })
    
    return { ...parentData, randoms: response}
}