import type { PageLoad } from './$types';
import { randomStore } from '$lib/stores/randomStore';

export const load: PageLoad = async ({ parent, data }) => {
	const layoutData = await parent();

	randomStore.setAllHeroes([...layoutData.heroDescriptions.allHeroes])
	return {...layoutData, ...data };
};