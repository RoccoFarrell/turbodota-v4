import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { townStore } from '$lib/stores/townStore';

export const load: PageLoad = (async ({ data, parent }) => {
	const layoutData = await parent();
    let skillCount: string | null = ""
	if (browser) {
		skillCount = localStorage.getItem('skillCount');
	}

    return { ...layoutData, skills: { count: skillCount }}
}) satisfies PageLoad;
