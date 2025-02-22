import { writable } from 'svelte/store';
import type { Hero } from '@prisma/client';

interface ExtendedHero extends Hero {
    xp?: number;
    gold?: number;
    cardId?: string;
    isHeld?: boolean;
}

function createHeroPoolStore() {
    const { subscribe, set, update } = writable<{
        allHeroes: ExtendedHero[];
        availableHeroes: ExtendedHero[];
        bannedHeroes: ExtendedHero[];
    }>({
        allHeroes: [],
        availableHeroes: [],
        bannedHeroes: []
    });

    return {
        subscribe,
        
        // Initialize the store with all heroes
        setAllHeroes: (heroes: ExtendedHero[]) => {
            update(state => ({
                ...state,
                allHeroes: heroes,
                availableHeroes: heroes,
                bannedHeroes: []
            }));
        },

        // Update banned heroes and recalculate available pool
        setBannedHeroes: (heroes: ExtendedHero[]) => {
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
            let result: ExtendedHero | null = null;
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
        },

        get availableHeroes() {
            let store: { allHeroes: ExtendedHero[] } = { allHeroes: [] };
            subscribe(s => { store = s; })();
            return store.allHeroes.filter(h => !h.isHeld);
        },

        updateHeroStatus: (heroId: number, isHeld: boolean) => {
            update(state => {
                const updatedHeroes = state.allHeroes.map(h => 
                    h.id === heroId ? { ...h, isHeld } : h
                );
                return {
                    ...state,
                    allHeroes: updatedHeroes
                };
            });
        }
    };
}

export const heroPoolStore = createHeroPoolStore(); 