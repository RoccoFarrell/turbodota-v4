import { writable } from 'svelte/store';
import { heroRoles } from '$lib/constants/heroRoles';
import type { Hero } from '@prisma/client';

function createHeroGridStore() {
	const { subscribe, set, update } = writable({
		allHeroes: [] as Hero[],
		availableHeroes: [] as Hero[],
		bannedHeroes: [] as Hero[],
		selectedRoles: [] as string[],
		startingGold: 100,
		expectedGold: 100,
		banMultiplier: 10,
		modifierAmount: 0,
		modifierTotal: 0,
		freeBans: 3,
		maxBans: 10,
		randomedHero: {} as Hero | null
	});

	return {
		subscribe,
		set,
		update,
		setAllHeroes: (input: Hero[]) =>
			update(
				(n) =>
					(n = {
						...n,
						allHeroes: [...input],
						availableHeroes: [...input]
					})
			),
		banHero: (input: Hero) => update((n) => (n = banHero(input, n))),
		setBanList: (input: Hero[]) => update((n) => (n = setBanList(input, n))),
		reset: (input: Hero[]) => {
			console.log(` reset length ${input.length}`);
			update(
				(n) =>
					(n = {
						allHeroes: [...input] as Hero[],
						availableHeroes: [...input] as Hero[],
						bannedHeroes: [] as Hero[],
						selectedRoles: [] as string[],
						startingGold: 100,
						expectedGold: 100,
						banMultiplier: 10,
						modifierAmount: 0,
						modifierTotal: 0,
						freeBans: 3,
						maxBans: 10,
						randomedHero: null
					})
			);
		}
	};
}

const updateCalculations = (store: any) => {
	store.modifierAmount = store.bannedHeroes.length;
	store.modifierTotal =
		(store.bannedHeroes.length - store.freeBans < 0 ? 0 : store.bannedHeroes.length - store.freeBans) *
		store.banMultiplier;

	// store.expectedGold =
	// store.startingGold - (store.bannedHeroes.length > 3 ? store.modifierTotal : 0) > 25
	// 	? store.startingGold - store.modifierTotal
	// 	: 25;
	store.expectedGold = store.startingGold - store.modifierTotal > 10 ? store.startingGold - store.modifierTotal : 10;
	return store;
};

const banHero = (hero: Hero, store: any) => {
	console.log(`[herogridStore - banHero] banning hero: ${hero.localized_name}, ${hero.id}`);
	//console.log(hero);
	//console.log(store);
	let banIndex_available = store.availableHeroes.findIndex((availHero: Hero) => availHero.id === hero.id);
	let banIndex_banned = store.bannedHeroes.findIndex((banHero: Hero) => hero.id === banHero.id);

	if (banIndex_available > -1 && banIndex_banned === -1) {
		store.bannedHeroes = [...store.bannedHeroes, hero];
		let availableIndex = store.availableHeroes.findIndex((availHero: Hero) => availHero.id === hero.id);

		if (availableIndex === -1) {
			store.availableHeroes.forEach((storeHero: Hero, i: number) => {
				if (storeHero.id === hero.id) availableIndex = i;
			});
		}

		if (availableIndex > -1) store.availableHeroes.splice(availableIndex, 1);
	} else if (banIndex_banned > -1 && banIndex_available === -1) {
		console.warn('[herogridStore - banHero] hero is already banned');
		store.bannedHeroes = store.bannedHeroes.filter((arrHero: Hero) => arrHero !== hero);
		store.availableHeroes.push(hero);
	}

	store = updateCalculations(store);
	//console.log("after update", store)
	return store;
};

const setBanList = (inputList: Hero[] | null, store: any) => {
	if (inputList) {
		console.log(`[setBanList] - banning ${inputList.length} heroes: ${inputList}`);
		//sets the garbage preset
		inputList.forEach((hero: Hero) => {
			//console.log('checking hero', hero);
			//console.log('available heroes', store.availableHeroes, 'indexOf: ', store.availableHeroes.findIndex((availHero: Hero) => availHero.id === hero.id))
			banHero(hero, store);
			// if (store.availableHeroes.indexOf(hero) !== -1) {
			// 	store.availableHeroes.splice(store.availableHeroes.indexOf(hero), 1);
			// } else console.error('couldnt ban hero', hero);
		});

		store = updateCalculations(store);
		return store;
	} else {
		console.log('reset store in store');
		store.reset();
		//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
	}
};

// const handleRoleChange = (roleList: string[]) => {};

export const herogridStore = createHeroGridStore();
