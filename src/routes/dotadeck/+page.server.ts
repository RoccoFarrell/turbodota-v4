import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

	const activeSeason = await prisma.season.findFirst({
		where: { active: true }
	});

	if (!activeSeason) throw error(404, 'No active season found');

	let seasonUser = await prisma.seasonUser.findUnique({
		where: {
			seasonId_accountId: {
				seasonId: activeSeason.id,
				accountId: session.user.account_id
			}
		}
	});

	if (!seasonUser) {
		// Create a new season user if they don't exist
		seasonUser = await prisma.seasonUser.create({
			data: {
				seasonId: activeSeason.id,
				accountId: session.user.account_id
			}
		});
	}

	const activeDeck = await prisma.deck.findFirst({
		where: {
			seasonId: activeSeason.id,
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