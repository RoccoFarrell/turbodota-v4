import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
    const parentData = await parent();
    return { ...parentData }
}