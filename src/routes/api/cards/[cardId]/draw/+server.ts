import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { cardId } = params;
	const { seasonUserId } = await request.json();

	try {
		const result = await prisma.$transaction(async (tx) => {
			// Get the card
			const card = await tx.card.findUnique({
				where: { id: cardId }
			});

			if (!card) {
				throw new Error('Card not found');
			}

			// Create hero draw record
			await tx.heroDraw.create({
				data: {
					seasonUserId,
					heroId: card.heroId,
					matchResult: null
				}
			});

			// Update card holder
			const updatedCard = await tx.card.update({
				where: { id: cardId },
				data: {
					holderId: seasonUserId,
					drawnAt: new Date()
				}
			});

			return updatedCard;
		});

		return json({ success: true, card: result });
	} catch (error) {
		console.error('Error drawing card:', error);
		return json({ success: false, error: 'Failed to draw card' }, { status: 500 });
	}
}; 