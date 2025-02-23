import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';

export const POST: RequestHandler = async ({ params, request }) => {
	const { cardId } = params;
	const { seasonUserId } = await request.json();

	try {
		const result = await prisma.$transaction(async (tx) => {
			// Check discard tokens
			const seasonUser = await tx.seasonUser.findUnique({
				where: { id: seasonUserId }
			});

			if (!seasonUser || seasonUser.discardTokens <= 0) {
				throw new Error('No discard tokens remaining');
			}

			// Deduct a token
			await tx.seasonUser.update({
				where: { id: seasonUserId },
				data: { discardTokens: { decrement: 1 } }
			});

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
					modType: 'ADD',
					currentGold: card.baseGold,
					currentXP: card.baseXP,
					goldMod: DOTADECK.DISCARD_BONUS.GOLD,
					xpMod: DOTADECK.DISCARD_BONUS.XP
				}
			});

			// Update card with increased stats
			const updatedCard = await tx.card.update({
				where: { id: cardId },
				data: {
					baseXP: { increment: DOTADECK.DISCARD_BONUS.XP },
					baseGold: { increment: DOTADECK.DISCARD_BONUS.GOLD },
					holderId: null
				}
			});

			return updatedCard;
		});

		return json({ 
			success: true, 
			card: result,
			updatedHero: {
				id: result.heroId,
				isHeld: false
			}
		});
	} catch (error) {
		console.error('Error discarding card:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		});
	}
}; 