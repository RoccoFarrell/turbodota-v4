import { writable } from 'svelte/store';

function createDraftStore() {
	const { subscribe } = writable({
		allHeroes: [] as Hero[],
		availableHeroes: [] as Hero[],
		bannedHeroes: [] as Hero[],
		selectedHero: {} as Hero | null
	});

	return {
		subscribe
	};
}

export const draftStore = createDraftStore();
