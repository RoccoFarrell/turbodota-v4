import type { PageLoad } from './$types';
import type { League } from '@prisma/client';

export const load: PageLoad = async ({ parent, data, params }) => {
	const layoutData = await parent();

    let selectedLeague: League | null= data.leagues.filter(league => league.id === parseInt(params.slug))[0] || null

	return {...layoutData, ...data, selectedLeague, slug: params.slug };
};