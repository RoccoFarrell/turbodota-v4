import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load = (async () => {
	if (browser) {
		let skillCount = localStorage.getItem('skillCount');
		if (skillCount) return { skillCount };
	}
}) satisfies PageLoad;
