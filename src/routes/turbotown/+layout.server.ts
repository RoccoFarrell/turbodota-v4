import type { LayoutServerLoad } from './$types'
import type { Hero } from '@prisma/client'
import prisma from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals, parent, url }) => {
	const parentData = await parent();
	const session = await locals.auth.validate()
	console.log(`session: ${session}`)

	let turbotown: any = {}
	if (session && session.user) {
			turbotown = await prisma.turbotown.findFirst({
			where: {
				account_id: session.user.account_id
			},
			include: {
				metrics: true,
				quests: true,
				season: true,
				items: true
			}
		});
	}

	const items = await prisma.item.findMany()

	return { ...parentData, items, turbotown }
}
