import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) return { status: 401 };

	console.log("Loading for account:", session.user.account_id);
	const seasonUser = await prisma.seasonUser.findFirst({
		where: {
			accountId: session.user.account_id,
			season: {
				active: true
			}
		},
		include: {
			heroDraws: {
				where: {
					matchResult: null  // Only get active draws
				},
				orderBy: {
					drawnAt: 'desc'
				},
				take: 3  // Limit to hand size
			}
		}
	});

	console.log("Found hero draws:", seasonUser?.heroDraws);

	const activeDeck = await prisma.deck.findFirst({
		where: {
			seasonId: seasonUser?.seasonId,
			isActive: true
		},
		include: {
			cards: true
		}
	});

	const heroDescriptions = await prisma.hero.findMany();

	return {
		seasonUser,
		activeDeck,
		heroDescriptions
	};
}; 