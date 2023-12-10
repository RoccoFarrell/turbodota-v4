import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	//if (session) throw redirect(302, "/");

    async function getRandomsForUser() {
        return await prisma.random.findMany({
            where: {
                account_id: session.user.account_id
            }
        });
    }

    let returnObj = {}
	if (session && session.user) {
        type RandomsForUser = Prisma.PromiseReturnType<typeof getRandomsForUser>;

		const randomsForUser: RandomsForUser = await getRandomsForUser();

		returnObj = {
			...parentData,
			randoms: randomsForUser
		};
	} else {
        returnObj = {
			...parentData,
            randoms: []
		};
    }

    console.log(returnObj)
	return returnObj;
};
