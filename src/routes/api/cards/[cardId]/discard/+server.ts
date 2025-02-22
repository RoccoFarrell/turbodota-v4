import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { cardId } = params;
	const { seasonUserId } = await request.json();

	try {
		// Start a transaction to handle all updates
		const result = await prisma.$transaction(async (tx) => {
			// Get the current card
			const card = await tx.card.findUnique({
				where: { id: cardId }
			});

			if (!card) {
				throw new Error('Card not found');
			}

			// Get the hero draw record
			const heroDraw = await tx.heroDraw.findFirst({
				where: {
					seasonUser: { id: seasonUserId },
					heroId: card.heroId,
					matchResult: null
				}
			});

			if (heroDraw) {
				// Mark the hero draw as completed
				await tx.heroDraw.update({
					where: { id: heroDraw.id },
					data: { matchResult: false }
				});
			}

			// Create discard history
			await tx.cardHistory.create({
				data: {
					seasonUserId,
					cardId,
					action: 'DISCARDED',
					goldMod: 10,
					xpMod: 10
				}
			});

			// Update card with increased stats
			const updatedCard = await tx.card.update({
				where: { id: cardId },
				data: {
					baseGold: { increment: 10 },
					baseXP: { increment: 10 }
				}
			});

			return updatedCard;
		});

		return json({ success: true, card: result });
	} catch (error) {
		console.error('Error discarding card:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		});
	}
}; 