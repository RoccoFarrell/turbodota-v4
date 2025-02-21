import { writable } from 'svelte/store';

export const drawnHeroes = writable(new Set<number>()); 