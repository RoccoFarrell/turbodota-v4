import type { PageLoad } from './$types';
import { randomStore } from '$lib/stores/randomStore';
import { townStore } from '$lib/stores/townStore';

export const load: PageLoad = async ({ parent, data }) => {
	const layoutData = await parent();

	randomStore.setAllHeroes([...layoutData.heroDescriptions.allHeroes])
	let quests = []
	if(data.leagueAndSeasonsResult && data.leagueAndSeasonsResult[0] && data.leagueAndSeasonsResult[0].seasons[0].turbotowns[0].quests.length > 0){
		quests = data.leagueAndSeasonsResult[0].seasons[0].turbotowns[0].quests
		console.log(`[random page.ts] found ${quests.length} quests`, quests)
	}

	return {...layoutData, ...data, quests };
};