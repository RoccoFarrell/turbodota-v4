import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { cardId } = params;
	const { seasonUserId } = await request.json();

	try {
		// Update card holder and history
		const updatedCard = await prisma.$transaction(async (tx) => {
			// Update the card
			const card = await tx.card.update({
				where: { id: cardId },
				data: {
					holderId: null,
					drawnAt: null
				}
			});

			// Create history entry
			await tx.cardHistory.create({
				data: {
					cardId: card.id,
					seasonUserId,
					action: 'DISCARDED',
					goldMod: 0,
					xpMod: 0
				}
			});

			return card;
		});

		return json({ success: true, card: updatedCard });
	} catch (error) {
		console.error('Error discarding card:', error);
		return json({ success: false, error: 'Failed to discard card' }, { status: 500 });
	}
}; 