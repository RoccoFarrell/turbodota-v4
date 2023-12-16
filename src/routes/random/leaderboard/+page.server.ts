import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
    const parentData = await parent();
    let response = await prisma.random.findMany()
    
    return { ...parentData, randoms: response}
}