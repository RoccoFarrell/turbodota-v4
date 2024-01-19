import { readable, derived, writable } from 'svelte/store';
import { createRandomStore } from './randomStore';

function createTownStore() {
    const { subscribe, set, update } = writable({
		quests: {
            quest1: createRandomStore(),
            quest2: createRandomStore(),
            quest3: createRandomStore()
        }
	});

    return {
		subscribe,
		set,
		update
    }
}

export const townStore = createTownStore();