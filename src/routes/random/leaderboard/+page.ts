import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
	const layoutData = await parent();

	return {...layoutData, ...data };
};