import { fail, redirect, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Season } from '@prisma/client';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	if (!session) {
		redirect(302, '/');
	}

	let selectedSeason: Season | null = parentData.selectedLeague.seasons.filter((season: Season) => season.id === parseInt(params.slug))[0] || null

	return {
		...parentData,
		selectedSeason
	};
};
