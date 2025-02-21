import { writable } from 'svelte/store';
import type { Hero } from '@prisma/client';

function createHeroPoolStore() {
    const { subscribe, set, update } = writable<{
        allHeroes: Hero[];
        availableHeroes: Hero[];
        bannedHeroes: Hero[];
    }>({
        allHeroes: [],
        availableHeroes: [],
        bannedHeroes: []
    });

    return {
        subscribe,
        
        // Initialize the store with all heroes
        setAllHeroes: (heroes: Hero[]) => {
            update(state => ({
                ...state,
                allHeroes: heroes,
                availableHeroes: heroes,
                bannedHeroes: []
            }));
        },

        // Update banned heroes and recalculate available pool
        setBannedHeroes: (heroes: Hero[]) => {
            update(state => {
                const bannedIds = new Set(heroes.map(h => h.id));
                return {
                    ...state,
                    bannedHeroes: heroes,
                    availableHeroes: state.allHeroes.filter(h => !bannedIds.has(h.id))
                };
            });
        },

        // Get a random hero from available pool
        getRandomHero: () => {
            let result: Hero | null = null;
            update(state => {
                if (state.availableHeroes.length === 0) return state;
                const randomIndex = Math.floor(Math.random() * state.availableHeroes.length);
                result = state.availableHeroes[randomIndex];
                return state;
            });
            return result;
        },

        // Reset store to initial state
        reset: () => {
            update(state => ({
                allHeroes: state.allHeroes,
                availableHeroes: state.allHeroes,
                bannedHeroes: []
            }));
        }
    };
}

export const heroPoolStore = createHeroPoolStore(); 