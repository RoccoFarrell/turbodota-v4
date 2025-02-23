import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { seasonId } = params;
	const { active } = await request.json();

	try {
		const updatedSeason = await prisma.season.update({
			where: { id: parseInt(seasonId) },
			data: { active }
		});

		return json({ success: true, season: updatedSeason });
	} catch (error) {
		console.error('Error updating season status:', error);
		return json({ success: false, error: 'Failed to update season status' }, { status: 500 });
	}
}; 