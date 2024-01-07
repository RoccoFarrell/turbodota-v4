// function handleRandomClick() {
	// 	heroLoading = generateRandomHeroIndex(124);

	// 	//heroLoading = generateRandomHeroIndex($randomStore.availableHeroes.length)
	// 	//generateRandomHero();
	// }

	// async function generateRandomHeroIndex(max: number) {
	// 	/*
	// 	New random scheme 1
	// 	*/
	// 	function genrand1(min: number, max: number) {
	// 		return (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min)) + min;
	// 	}

	// 	// rolling the rand
	// 	async function rollRands1(max: number, rolls: number) {
	// 		let min: number = 0;
	// 		let counts: any = {};
	// 		for (let i = min; i < max; i++) {
	// 			counts[i.toString()] = 0;
	// 		}
	// 		let roll = 0;
	// 		while (roll < rolls) {
	// 			counts[genrand1(min, max).toString()]++;
	// 			roll++;
	// 		}
	// 		return counts;
	// 	}

	// 	/*
	// 		New random scheme 2
	// 	*/

	// 	function genrand2(max: number) {
	// 		const array = new Uint32Array(10);
	// 		let rand = crypto.getRandomValues(array);
	// 		let heroRand = rand.map((number) => number % max);
	// 		let randomedHero = heroRand[Math.floor(Math.random() * 9)];
	// 		return randomedHero;
	// 	}

	// 	async function rollRands2(max: number, rolls: number) {
	// 		let min: number = 0;
	// 		let counts: any = {};
	// 		for (let i = min; i < max; i++) {
	// 			counts[i.toString()] = 0;
	// 		}
	// 		let roll = 0;
	// 		while (roll < rolls) {
	// 			counts[genrand2(max).toString()]++;
	// 			roll++;
	// 		}
	// 		return counts;
	// 	}

	// 	function genrandOld(max: number) {
	// 		return Math.floor(Math.random() * max);
	// 	}

	// 	async function rollRandsOld(max: number, rolls: number) {
	// 		let min: number = 0;
	// 		let counts: any = {};
	// 		for (let i = min; i < max; i++) {
	// 			counts[i.toString()] = 0;
	// 		}
	// 		let roll = 0;
	// 		while (roll < rolls) {
	// 			counts[genrandOld(max).toString()]++;
	// 			roll++;
	// 		}
	// 		return counts;
	// 	}

	// 	return await rollRands2($randomStore.availableHeroes.length, 1000000);

	// 	// Promise.all([
	// 	// 	rollRands1($randomStore.availableHeroes.length, 1000000),
	// 	// 	rollRands2($randomStore.availableHeroes.length, 1000000),
	// 	// 	rollRandsOld($randomStore.availableHeroes.length, 1000000)
	// 	// ])
	// }