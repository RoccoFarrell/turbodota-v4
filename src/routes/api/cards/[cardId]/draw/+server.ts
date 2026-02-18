import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) return json({ success: false, error: 'Not authenticated' });
	
	const { seasonUserId } = await request.json();
	
	try {
		// Get current hand count, hand size limit, and available cards
		const [seasonUser, currentHand, activeDraws, availableCards] = await prisma.$transaction([
			prisma.seasonUser.findUnique({
				where: { id: seasonUserId }
			}),
			prisma.heroDraw.count({
				where: {
					seasonUserId,
					matchResult: null
				}
			}),
			prisma.heroDraw.findMany({
				where: {
					matchResult: null,
					seasonUser: {
						season: { active: true }
					}
				}
			}),
			prisma.card.findMany({
				where: {
					deck: {
						season: { active: true }
					},
					holderId: null
				}
			})
		]);

		if (!seasonUser) {
			return json({ success: false, error: 'Season user not found' });
		}

		// Validate hand size
		if (currentHand >= seasonUser.handSize) {
			return json({ success: false, error: `Cannot draw more than ${seasonUser.handSize} heroes` });
		}

		// Filter out held heroes
		const availableHeroes = availableCards.filter(
			card => !activeDraws.some(draw => draw.heroId === card.heroId)
		);

		if (availableHeroes.length === 0) {
			return json({ success: false, error: 'No heroes available to draw' });
		}

		// Randomly select a card from available heroes
		const card = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];

		if (!card) {
			return json({ success: false, error: 'Card not found' });
		}

		const result = await prisma.$transaction(async (tx) => {
			// Create hero draw record
			await tx.heroDraw.create({
				data: {
					seasonUserId,
					heroId: card.heroId,
					cardId: card.id,
					drawnAt: new Date()
				}
			});

			// Create card history entry for the draw
			await tx.cardHistory.create({
				data: {
					cardId: card.id,
					seasonUserId,
					action: 'DRAWN',
					modType: 'MODIFY',
					timestamp: new Date(),
					currentGold: card.baseGold,
					currentXP: card.baseXP,
					goldMod: 0,
					xpMod: 0
				}
			});

			// Update card holder
			const updatedCard = await tx.card.update({
				where: { id: params.cardId },
				data: {
					holderId: seasonUserId,
					drawnAt: new Date()
				}
			});

			return updatedCard;
		});

		return json({ 
			success: true, 
			card: result,
			heldHeroIds: activeDraws.map(draw => draw.heroId),
			updatedHero: {
				id: result.heroId,
				isHeld: true
			}
		});
	} catch (error) {
		console.error('Error drawing card:', error);
		return json({ success: false, error: 'Failed to draw card' }, { status: 500 });
	}
}; 