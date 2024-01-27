import { readable, derived, writable } from 'svelte/store';
import { createRandomStore } from '$lib/stores/randomStore'

export const banStore = createRandomStore();