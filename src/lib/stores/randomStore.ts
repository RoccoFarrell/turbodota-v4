import { writable } from 'svelte/store';
import { heroRoles } from '$lib/constants/heroRoles';

function createRandomStore() {
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
		updateCalculations: () => update((n) => (n = updateCalculations(n))),
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
		},
		setBanList: (input: Hero[]) => update((n) => (n = setBanList(input, n)))
		// setSelectedPlayer: (input: string) => update(n => n = {
		//     ...n,
		//     selectedPlayer: input
		// }),
		// setSortHeader: (input: string) => update(n => n = {
		//     ...n,
		//     sortHeader: input
		// }),
	};
}

const updateCalculations = (store: any) => {
	store.modifierAmount = store.bannedHeroes.length;
	store.modifierTotal = (store.bannedHeroes.length - store.freeBans < 0 ? 0 : store.bannedHeroes.length - store.freeBans) * store.banMultiplier;

	//store.expectedGold =
		// store.startingGold - (store.bannedHeroes.length > 3 ? store.modifierTotal : 0) > 25
		// 	? store.startingGold - store.modifierTotal
		// 	: 25;
	store.expectedGold = store.startingGold - store.modifierTotal > 25 ? store.startingGold - store.modifierTotal : 25;
	return store;
};

const banHero = (hero: Hero, store: any) => {
	console.log(`banning hero:`);
	console.log(hero)
	let banIndex = store.bannedHeroes.indexOf(hero);

	console.log(banIndex);
	if (banIndex === -1) {
		store.bannedHeroes = [...store.bannedHeroes, hero];
		let availableIndex = store.availableHeroes.indexOf(hero);

		if(availableIndex === -1){
			store.availableHeroes.forEach((storeHero: Hero, i: number) => {
				if(storeHero.id === hero.id) availableIndex = i
			})
		}

		if (availableIndex > -1) store.availableHeroes.splice(availableIndex, 1);

	} else {
		store.bannedHeroes = store.bannedHeroes.filter((arrHero: Hero) => arrHero !== hero);
		store.availableHeroes.push(hero)
	}
	console.log(store.bannedHeroes);

	store = updateCalculations(store);
	return store;
};

const setBanList = (inputList: Hero[] | null, store: any) => {
	if (inputList) {
		//sets the garbage preset
		store.bannedHeroes = inputList;
		store.bannedHeroes.forEach((hero: Hero) => {
			if (store.availableHeroes.indexOf(hero) !== -1)
				store.availableHeroes.splice(store.availableHeroes.indexOf(hero), 1);
		});

		store = updateCalculations(store);
		return store;
	} else {
		console.log('reset store in store');
		store.reset();
		//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
	}
};

const handleRoleChange = (roleList: string[]) => {};

export const randomStore = createRandomStore();