import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { townStore } from '$lib/stores/townStore';

export const load: LayoutLoad = (async ({ data, parent }) => {
	const layoutData = await parent();
    let skillCount: string | null = ""
	if (browser) {
		skillCount = localStorage.getItem('skillCount');
	}

    return { ...data, skills: { count: skillCount }}
}) satisfies LayoutLoad;
