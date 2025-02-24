import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth.validate();
	if (!session) return json({ success: false, error: 'Not authenticated' });
	
	const { seasonUserId } = await request.json();
	
	try {
		// Get current hand count and hand size limit
		const [seasonUser, currentHand] = await prisma.$transaction([
			prisma.seasonUser.findUnique({
				where: { id: seasonUserId }
			}),
			prisma.heroDraw.count({
				where: {
					seasonUserId,
					matchResult: null  // Only count active draws
				}
			})
		]);

		if (!seasonUser) {
			return json({ success: false, error: 'Season user not found' });
		}

		// Validate hand size
		if (currentHand >= seasonUser.handSize) {
			return json({ 
				success: false, 
				error: `Cannot draw more than ${seasonUser.handSize} heroes` 
			});
		}

		// Get all currently held heroes in the league
		const heldCards = await prisma.card.findMany({
			where: {
				deck: {
					seasonId: seasonUser.seasonId,
					isActive: true
				},
				holderId: {
					not: null
				},
				heroDraws: {
					some: {
						matchResult: null
					}
				}
			}
		});

		const result = await prisma.$transaction(async (tx) => {
			// Get the card
			const card = await tx.card.findUnique({
				where: { id: params.cardId }
			});

			if (!card) {
				throw new Error('Card not found');
			}

			// Check if hero is already held by someone in the active season
			const existingDraw = await tx.heroDraw.findFirst({
				where: {
					heroId: card.heroId,
					matchResult: null,  // Active draw
					seasonUser: {
						season: {
							active: true
						}
					}
				}
			});

			if (existingDraw) {
				throw new Error('This hero is currently held in the league');
			}

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
			heldHeroIds: heldCards.map(card => card.heroId),
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