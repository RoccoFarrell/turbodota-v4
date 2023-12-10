import { writable } from 'svelte/store'
import { heroRoles } from '$lib/constants/heroRoles';

interface HeroRandom {
    allHeroes: Hero[]
    availableHeroes: Hero[];
    bannedHeroes: Hero[];
    selectedRoles: string[];
    startingGold: number;
    expectedGold: number;
    banMultiplier: number;
    modifierAmount: number;
    modifierTotal: number;
    maxBans: number;
}


function createRandomStore() {
    const { subscribe, set, update } = writable({
        allHeroes: [],
		availableHeroes: [],
		bannedHeroes: [],
		selectedRoles: [],
		startingGold: 100,
		expectedGold: 100,
		banMultiplier: 8,
		modifierAmount: 0,
		modifierTotal: 0,
		maxBans: 10
	});

    return {
        subscribe,
        set,
        update,
        // setEndDate: (input: Date) => update(n => n = {
        //     ...n,
        //     endDate: input.toISOString().slice(0,10)
        // }),
        // setRole: (input: string) => update(n => n = {
        //     ...n,
        //     role: input
        // }),
        // setHeroID: (input: number) => update(n => n = {
        //     ...n,
        //     heroID: input
        // }),
        // setSelectedPlayer: (input: string) => update(n => n = {
        //     ...n,
        //     selectedPlayer: input 
        // }),
        // setSortHeader: (input: string) => update(n => n = {
        //     ...n,
        //     sortHeader: input 
        // }),
    }
}

// function autoBanLists() {
//     let autoBanLists = {
// 		garbage: data.heroDescriptions.allHeroes.filter((hero: Hero) =>
// 			[
// 				'Chen',
// 				'Meepo',
// 				'Tinker',
// 				'Broodmother',
// 				'Io',
// 				'Naga Siren',
// 				'Lone Druid',
// 				'Alchemist',
// 				'Arc Warden',
// 				'Templar Assassin',
// 				'Huskar',
// 				'Medusa'
// 			].includes(hero.localized_name)
// 		)
// 	};
// }

export const randomStore = createRandomStore()