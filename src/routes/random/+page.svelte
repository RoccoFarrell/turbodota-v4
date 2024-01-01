<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { browser } from '$app/environment';

	//prisma types
	import type { Random, Hero } from '@prisma/client';

	//day js
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//components
	import History from './_components/History.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';

	//constants
	import { heroRoles } from '$lib/constants/heroRoles';

	//stores
	import { randomStore } from '$lib/stores/randomStore';

	//images
	import Lock from '$lib/assets/lock.png';
	import SeasonLogo from '$lib/assets/seasonLogo.png';
	import TournamentLight from '$lib/assets/tournament_light.png';
	import WantedPoster from '$lib/assets/wantedPoster.png';

	if (browser) {
		console.log('data: ', data);
		
	}

	$: console.log('store data: ', $randomStore);

	let generatedRandomHero: Hero | null = null;

	let randomFound = false;

	/* 
		Calculations from server data
	*/
	let last5Matches: Match[] = data.rawMatchData.slice(0, 5);
	//console.log(`LAST 5 MATCHES:`, last5Matches);

	let matchTableData = last5Matches.map((match: any) => {
		return {
			match_id: match.match_id,
			start_time: dayjs(match.start_time).format('llll'),
			result: winOrLoss(match.player_slot, match.radiant_win),
			hero: data.heroDescriptions.allHeroes.filter((hero: Hero) => hero.id === match.hero_id)[0].id,
			kda: ((match.kills + match.assists) / match.deaths).toFixed(2)
		};
	});

	//calc random lifetime stats on load
	let randomLifetimeStats = {
		wins: 0,
		losses: 0,
		totalGoldWon: 0,
		totalLostGoldModifier: 0
	};

	let completedRandoms: Random[] = data.randoms.filter((random) => !random.active);
	if (completedRandoms.length > 0) {
		randomLifetimeStats = {
			wins: completedRandoms.filter((random) => random.win).length || 0,
			losses: completedRandoms.filter((random) => !random.active && !random.win).length,
			totalGoldWon: completedRandoms.reduce((acc, cur) => acc + (cur.endGold || 0), 0),
			totalLostGoldModifier: completedRandoms.reduce((acc, cur) => acc + cur.modifierTotal, 0)
		};
	}

	//calc leaderboard info for seasons panel
	let randomSeasonStats = {
		userPlace: -1
	};
	if (data.session && data.session.user) {
		randomSeasonStats = {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: Unreachable code error
			userPlace:
				data.currentSeasonLeaderboard.findIndex((item: any) => item.player === data.session.user.account_id) + 1
		};
	}

	//set user preferences on page
	if (data.userPreferences && data.userPreferences.length > 0) {
		console.log(`[random/+page.svelte] - evaluating userPreferencces`);
		let banListPref = data.userPreferences.filter((pref: any) => pref.name === 'randomBanList');

		try {
			if (banListPref.length > 0 && banListPref[0].value) {
				console.log(`[random/+page.svelte] - evaluating saved ban list`);
				let randomBanListParsed = JSON.parse(banListPref[0].value);

				let setList = data.heroDescriptions.allHeroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

				randomStore.setBanList(setList);
			}
		} catch (e) {
			console.error('error in setting preferences');
		}
	}

	/* 
		End Calculations
	*/

	//evaluate if there is an active random stored in the DB
	if ('randoms' in data && data?.randoms.length > 0 && data.randoms.filter((random) => random.active).length > 0) {
		randomFound = true;
		const { availableHeroes, bannedHeroes, selectedRoles, expectedGold, modifierAmount, modifierTotal, randomedHero } =
			data.randoms
				.filter((random) => random.active)
				.sort((a: any, b: any) => {
					if (a.start_time < b.start_time) return -1;
					else return 1;
				})[0];

		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		// console.log(availableHeroes.split(','));
		// console.log(
		// 	availableHeroes.split(',').map((randomID: string) => {
		// 		return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
		// 	})
		// );

		//console.log("randomed hero: ", allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0])

		console.log(`bannedHeroes: ${bannedHeroes} selectedRoles: ${selectedRoles} randomedHero: ${randomedHero}`);

		if (typeof bannedHeroes === 'string' && typeof selectedRoles === 'string' && randomedHero) {
			console.log(`[random/+page.svelte] - setting random store `);
			randomStore.set({
				allHeroes: data.heroDescriptions.allHeroes,
				availableHeroes: availableHeroes.split(',').map((randomID: string) => {
					return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
				}),
				bannedHeroes:
					bannedHeroes.length > 0
						? bannedHeroes.split(',').map((randomID: string) => {
								return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
							})
						: [],
				selectedRoles: selectedRoles.split(',') || [],
				startingGold: 100,
				expectedGold,
				banMultiplier: 8,
				modifierAmount,
				modifierTotal,
				freeBans: 3,
				maxBans: 10,
				randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0]
			});

			generatedRandomHero = $randomStore.randomedHero;
		} else {
			console.error('[set locked random hero] - couldnt set locked random');
		}
	} else if (data.session && data.session.user) {
		const t: ToastSettings = {
			message: `No active randoms found for user`,
			background: 'variant-filled-warning'
		};

		toastStore.trigger(t);
	}

	$: showHeroGrid = true;

	interface HeroRandom {
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

	let heroRandom: HeroRandom = {
		availableHeroes: [...data.heroDescriptions.allHeroes],
		bannedHeroes: [],
		selectedRoles: [],
		startingGold: 100,
		expectedGold: 100,
		banMultiplier: 8,
		modifierAmount: 0,
		modifierTotal: 0,
		maxBans: 10
	};

	$: heroRandom.bannedHeroes;

	const banHero = (hero: Hero) => {
		let banIndex = $randomStore.bannedHeroes.indexOf(hero);

		if ($randomStore.bannedHeroes.length + 1 > $randomStore.maxBans && banIndex === -1) banLimitErrorVisible = true;
		else {
			randomStore.banHero(hero);
		}
	};

	let autoBanLists = {
		garbage: data.heroDescriptions.allHeroes.filter((hero: Hero) =>
			[
				'Chen',
				'Meepo',
				'Tinker',
				'Broodmother',
				'Io',
				'Naga Siren',
				'Lone Druid',
				'Alchemist',
				'Arc Warden',
				'Templar Assassin',
				'Huskar',
				'Medusa'
			].includes(hero.localized_name)
		)
	};

	const setBanList = (inputList?: string) => {
		if (typeof inputList === 'string') {
			if (inputList === 'garbage') randomStore.setBanList(autoBanLists.garbage);
		} else {
			randomStore.reset(data.heroDescriptions.allHeroes);
			//randomStore.setAllHeroes(data.heroDescriptions.allHeroes)
		}
	};

	const saveBanList = async () => {
		if ($randomStore.bannedHeroes.length <= 3 && data.session) {
			let response = await fetch(`/api/preferences/${data.session.user.account_id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: 'randomBanList',
					value: JSON.stringify($randomStore.bannedHeroes.map((hero: Hero) => hero.id))
				})
			});

			let prefsResponse = await response.json();
			//console.log(prefsResponse);
			if (prefsResponse.status === 'success') {
				const t: ToastSettings = {
					message: `Bans saved!`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(t);
			}
		} else {
			const t: ToastSettings = {
				message: `Need either 0 or 3 bans selected to save!`,
				background: 'variant-filled-warning'
			};
			toastStore.trigger(t);
		}
	};

	const handleRoleSelect = (role: string) => {
		//console.log(role);
		if (role === 'All') {
			//if All was already selected, set to empty
			//if not selected, set to all roles
			$randomStore.selectedRoles.includes('All')
				? ($randomStore.selectedRoles = [])
				: ($randomStore.selectedRoles = heroRoles);
		} else {
			//if not All, remove role if already there
			//or add role if missing
			if ($randomStore.selectedRoles.includes(role))
				$randomStore.selectedRoles = $randomStore.selectedRoles.filter((r) => r !== role && r !== 'All');
			else $randomStore.selectedRoles.push(role);
		}

		$randomStore.availableHeroes = data.heroDescriptions.allHeroes.filter((heroDesc: Hero) => {
			let returnVal = false;
			$randomStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = true;
			});
			return returnVal;
		});
		console.log(`${data.heroDescriptions.allHeroes.length} filtered to ${$randomStore.availableHeroes.length}`);

		$randomStore.bannedHeroes = data.heroDescriptions.allHeroes.filter((heroDesc: Hero) => {
			let returnVal = true;
			$randomStore.selectedRoles.forEach((role) => {
				if (heroDesc.roles.includes(role)) returnVal = false;
			});
			return returnVal;
		});

		if ($randomStore.availableHeroes.length === 0) randomStore.reset(data.heroDescriptions.allHeroes);
		else randomStore.updateCalculations();
		//console.log($randomStore.selectedRoles);
	};

	// let heroLoading = generateRandomHeroIndex(124);
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

	const generateRandomHero = async () => {
		console.log(`${$randomStore.availableHeroes.length} available random heroes`);

		function genrandOld(max: number) {
			return Math.floor(Math.random() * max);
		}

		function rollRandsOld(max: number, rolls: number) {
			let min: number = 0;
			let counts: any = {};
			for (let i = min; i < max; i++) {
				counts[i.toString()] = 0;
			}
			let roll = 0;
			while (roll < rolls) {
				counts[genrandOld(max).toString()]++;
				roll++;
			}
			return counts;
		}

		console.log(
			'your random generation simulator 1M times: ',
			rollRandsOld($randomStore.availableHeroes.length, 1000000)
		);

		generatedRandomHero = $randomStore.availableHeroes[Math.floor(Math.random() * $randomStore.availableHeroes.length)];

		$randomStore.randomedHero = generatedRandomHero;

		if (data.session && generatedRandomHero) {
			let bodyData = {
				...$randomStore,
				availableHeroes: $randomStore.availableHeroes.map((hero: Hero) => hero.id),
				bannedHeroes: $randomStore.bannedHeroes.map((hero: Hero) => hero.id),
				randomedHero: generatedRandomHero.id
			};
			//bodyData.availableHeroes = bodyData.availableHeroes.map((hero: Hero) => hero.id);
			let response = await fetch(`/api/random/${data.session.user.account_id}/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bodyData)
			});

			//console.log(response);

			randomFound = true;
		} else {
			console.error('couldnt set generated random hero for specific user');
		}
	};

	let newerStratzMatches: any[] = [];
	//$: console.log(newerStratzMatches);
	let stratzTimeout: boolean = false;
	let stratzTimeoutValue: number = 30;
	let stratzTimeoutCountdown: number = 0;
	$: stratzTimeoutCountdown;
	//$: console.log(stratzTimeout);

	const checkForRandomComplete = async () => {
		let responseStratz, responseParse;
		if (!stratzTimeout && data.session) {
			responseStratz = await fetch(`/api/stratz/players/${data.session.user.account_id}/recentMatches`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					since: data.rawMatchData[0].match_id
				})
			});

			responseParse = await updateStratzMatches(responseStratz);

			stratzTimeout = true;
			stratzTimeoutCountdown = 30;
			let countdownTimer = setInterval(() => {
				stratzTimeoutCountdown--;
				if (stratzTimeoutCountdown === 0) {
					stratzTimeout = false;
					clearInterval(countdownTimer);
				}
			}, 1000);
		} else {
			responseStratz = 'timed out';
		}

		return Promise.all([responseStratz, responseParse]);
	};

	const updateStratzMatches = async (stratzPromise: any) => {
		let stratzHasMatches = await stratzPromise.json();

		console.log(stratzHasMatches);
		newerStratzMatches = stratzHasMatches.response.data.player.matches;

		console.log(`[checkForRandomComplete] stratzHasMatches:`, stratzHasMatches);

		return newerStratzMatches;
	};

	let stratzLoading: any = false;

	//https://stackoverflow.com/questions/76933374/svelte-loading-indicator-for-a-synchronous-method
	// function repaint() {
	// 	return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
	// }

	// async function doTheThing() {
	// 	showLoading = true;
	// 	await tick();
	// 	await repaint();
	// 	doIt();
	// 	showLoading = false;
	// }

	//toast settings

	const t: ToastSettings = {
		message: `Max bans of ${$randomStore.maxBans} reached!`,
		background: 'variant-filled-warning'
	};

	let banLimitErrorVisible: boolean = false;
	$: if (banLimitErrorVisible === true)
		setTimeout(() => {
			banLimitErrorVisible = false;
		}, 5000);

	$: {
		randomStore.updateCalculations();
		if (banLimitErrorVisible) toastStore.trigger(t);
	}
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center space-y-1 md:mx-8 mx-2">
		<!-- Header Card -->
		<div
			class="md:grid md:grid-cols-3 max-sm:flex max-sm:flex-col max-sm:space-y-2 justify-around items-center w-full card p-1"
		>
			<div class="flex flex-col space-x-4 md:border-r border-dashed border-primary-500/50">
				<h2 class="h2 text-primary-500 max-md:font-bold p-2">The Walker Random™</h2>
				<div class="flex justify-around items-center">
					<!-- <a href="/random/leaderboard"><button class="btn variant-ghost-primary">Leaderboard</button></a> -->

					{#if data.session && data.session.user}
						<div class="text-xs">
							Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- current season info -->
			{#if data.session && data.session.user && data.leagueAndSeasonsResult[0]}
				<div class="flex flex-col w-full justify-center col-span-2 p-2">
					<div class="w-full grid grid-cols-2 p-1">
						<div class="text-sm text-tertiary-500">
							<p class="text-xs inline">current league:</p>
							<a class="link" href={`/leagues/${data.leagueAndSeasonsResult[0].id}`}>
								<p class="font-bold inline text-primary-400 text-md hover:text-primary-600 hover:underline">
									{data.leagueAndSeasonsResult[0].name}
								</p>
							</a>
						</div>
						<div class="text-sm text-tertiary-500">
							<p class="text-xs inline">current random season:</p>
							<a
								class="link"
								href={`/leagues/${data.leagueAndSeasonsResult[0].id}/seasons/${data.leagueAndSeasonsResult[0].seasons[0].id}`}
							>
								<p class="font-bold inline text-primary-400 text-md hover:text-primary-600 hover:underline">
									{data.leagueAndSeasonsResult[0].seasons[0].name}
								</p>
							</a>
						</div>
					</div>

					<div class="flex border-t border-amber-500 p-2 justify-center space-x-8">
						<div class="flex flex-col rounded-xl p-4">
							<p class="text-xs">current place:</p>
							<div class="flex">
								<img src={TournamentLight} class="w-24 h-24 rounded-xl p-2" alt="season logo cm and lina" />
								<div class="flex flex-col items-center justify-center">
									<p class="h1 font-bold text-amber-500 vibrating">
										{randomSeasonStats.userPlace}
									</p>
									<p>of {data.currentSeasonLeaderboard.length}</p>
								</div>
							</div>
						</div>
						<div class="flex flex-col items-center justify-center space-y-1">
							<div>
								Season Start: <p class="text-green-300">
									{dayjs(data.leagueAndSeasonsResult[0].seasons[0].startDate).format('llll')}
								</p>
							</div>
							<div>
								Season End: <p class="text-red-300">
									{dayjs(data.leagueAndSeasonsResult[0].seasons[0].endDate).format('llll')}
								</p>
							</div>
						</div>
						<div class="flex justify-center items-center">
							<a href="/random/leaderboard"><button class="btn variant-ghost-primary">Leaderboard</button></a>
						</div>
					</div>
				</div>
			{:else}
				<div class="w-full p-4 italic flex items-center justify-center">Couldn't get league or season info</div>
			{/if}
		</div>

		<!-- <div>
			{#if randomFound}
				<div class="w-full">
					{#if data.randoms}
						<h3 class="h3">{data.randoms?.length} Randoms Found</h3>
					{:else}
						<h3 class="h3">New random locked!</h3>
					{/if}
				</div>
			{/if}
		</div> -->
		<div class="w-full flex max-md:flex-col">
			<div
				class={'rounded-xl mx-1 my-2 ' +
					(!data.session ? ' lg:w-3/4 mx-auto my-4' : 'lg:w-1/2')}
			>
				{#if generatedRandomHero}
					<div class="flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full">
						<!-- <img src={WantedPoster} alt="wanted" class="rounded-xl absolute"/> -->
						<div
							class="bg-blankPoster bg-contain bg-no-repeat bg-center z-50 flex flex-col items-center space-y-2 rounded-2xl p-4 mb-4 w-full h-96 justify-center"
							in:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'x' }}
						>
							<h1 class="h1 text-slate-900 font-bold">WANTED</h1>
							<h1 class="h1 vibrating animate-pulse text-amber-600">
								{generatedRandomHero.localized_name}
							</h1>
							<i class={`vibrating d2mh hero-${generatedRandomHero.id} scale-150`}></i>
						</div>
						<!-- 
						<div class="w-fit mx-auto p-4 border border-dashed border-fuchsia-300 my-4 card">
							<div class="grid grid-cols-3 place-content-start">
								<p>Pulled {newerStratzMatches.length} matches from Stratz</p>
								<div class="text-xs">
									Most recent Stratz match: <p>{newerStratzMatches[0].id}</p>
								</div>
								<div class="text-xs mt-2">
									Most recent Open Dota match: <p>{data.rawMatchData[0].match_id}</p>
								</div>
							</div>

							<div><p class="inline text-primary-500">{stratzTimeoutCountdown}s</p> before you can check again</div>
						</div> -->

						{#await stratzLoading}
							<div class="flex items-center justify-center h-full">
								<button class="btn variant-filled-success w-full">
									<i class="fi fi-br-refresh h-fit animate-spin"></i>
									<div class="placeholder animate-pulse"></div>
								</button>
							</div>
						{:then stratzData}
							{#if stratzData}
								<div class="w-fit mx-auto p-4 border border-dashed border-fuchsia-300 my-4 space-y-4 card">
									<div>
										{#if newerStratzMatches[0].id.toString() !== data.rawMatchData[0].match_id.toString()}
											<div class="flex items-center justify-center p-1 space-x-2 text-green-500">
												<i class="fi fi-ss-head-side-brain"></i>
												<p>You may have a point...</p>
											</div>
										{:else}
											<div class="text-amber-500 flex items-center space-x-2 justify-center p-1">
												<i class="fi fi-br-database mx-2"></i>
												<p>No new matches found from two sources...</p>
											</div>
										{/if}
									</div>
									<div class="grid grid-cols-3 place-content-start">
										<p class="text-xs text-secondary-600">Pulled {newerStratzMatches.length} matches from Stratz</p>
										<div class="text-xs">
											Most recent Stratz match: <p class="font-bold text-primary-500">{newerStratzMatches[0].id}</p>
										</div>
										<div class="text-xs">
											Most recent Open Dota match: <p class="font-bold text-primary-500">
												{data.rawMatchData[0].match_id}
											</p>
										</div>
									</div>

									<div class="mt-2">
										<p class="inline text-orange-500 font-bold">{stratzTimeoutCountdown}s</p>
										before you can check again
									</div>
								</div>
							{/if}
						{/await}
						{#if data.session && data.session.user}
							<div class="flex items-center justify-center">
								<button
									class="btn variant-filled-success w-full"
									disabled={stratzTimeout}
									on:click={() => {
										stratzLoading = checkForRandomComplete();
									}}
								>
									<i class="fi fi-br-refresh h-fit"></i>
									<div class="italic">I just completed this random!</div></button
								>
							</div>
						{/if}
						<!-- {#if data.session && data.session.user}
					<div class="my-4"><MatchHistory {matchTableData} /></div>
				{/if} -->
					</div>
				{:else}
					<!-- <div class="my-4"><MatchHistory {matchTableData} /></div> -->
					<div class="flex flex-col justify-center items-center h-full">
						<div>
							<i class="fi fi-sr-person-circle-question text-5xl"></i>
							<h3 class="h3 text-secondary-500">No random found, get a new one below!</h3>
						</div>
						<div class="w-full">
							<button
								on:click={generateRandomHero}
								disabled={randomFound}
								class="z-50 btn variant-filled-primary w-full my-4 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
								>Random me</button
							>
						</div>
					</div>
				{/if}
			</div>
			{#if data.session && data.session.user}
				<div class="m-2 lg:w-1/2"><MatchHistory {matchTableData} /></div>
			{/if}
		</div>

		<div class="lg:grid lg:grid-cols-3 max-sm:flex max-sm:flex-col max-lg:space-y-8 sm:place-content-start lg:gap-x-8">
			<!-- Hero ban grid -->
			<div class="w-full flex flex-col items-center sm:h-fit relative max-md:max-w-sm">
				{#if randomFound}
					<div class="z-50 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl">
						<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
							Randoming Locked, you have an active random!
						</h3>
						<img src={Lock} class="h-32 w-32 inline" alt="locked" />
					</div>
				{/if}
				<div class="mb-4 bg-surface-500/10 p-4 rounded-full w-4/5 shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">1. Ban heroes below</h3>
					<p class="text-xs">Click a hero to ban!</p>
				</div>

				<!-- Show hero grid button -->
				<div
					class="w-full py-2 bg-primary-200 rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%] shadow-lg md:hidden z-0"
				>
					<button
						class="w-full"
						on:click={() => {
							showHeroGrid = !showHeroGrid;
						}}
					>
						{`${!showHeroGrid ? 'Show' : 'Hide'}  Hero Ban Grid`}
					</button>
				</div>
				<!-- Desktop Hero Grid -->
				<div
					id="desktopHeroGrid"
					class={`z-0 flex flex-wrap max-w-[95%] p-4 max-md:hidden xs:visible justify-center overflow-y-auto w-full max-h-[50rem] ${
						showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-t-4 border-amber-500'
					}`}
				>
					{#if showHeroGrid}
						{#each data.heroDescriptions.allHeroes as hero}
							<div class="object-contain m-1 relative">
								{#if $randomStore.bannedHeroes.indexOf(hero) !== -1}
									<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
										<button on:click={() => banHero(hero)} class="w-full h-full"></button>
									</div>
								{/if}
								<button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
							</div>
						{/each}
					{/if}
				</div>
				<!-- Mobile Hero Grid -->
				<div
					id="mobileHeroGrid"
					class={`w-full flex flex-wrap max-w-[95%] p-2 md:hidden max-md:visible justify-center overflow-y-auto max-h-96 ${
						showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-b-4 border-amber-500'
					}`}
				>
					{#if showHeroGrid}
						{#each data.heroDescriptions.allHeroes as hero}
							<div class={`object-contain m-3 relative`}>
								{#if $randomStore.bannedHeroes.indexOf(hero) !== -1}
									<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
										<button on:click={() => banHero(hero)} class="w-full h-full"></button>
									</div>
								{/if}
								<button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id} scale-125`}></i></button>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Banned heroes -->
				<div id="bannedHeroes" class="w-full space-x-1 max-w-[90%] flex-wrap p-2 my-2 md:mb-10">
					<button
						class={'btn dark:bg-purple-800/50 bg-purple-500/50 w-3/4'}
						disabled={!data.session}
						on:click={() => saveBanList()}
						>{!data.session ? 'Log In to save 3 Free Bans' : 'Save Bans to account'}</button
					>
					<div class="my-2">
						<h4 class="h4">Banned Heroes:</h4>
						{#if $randomStore.bannedHeroes.length > 0}
							<div>
								{#each $randomStore.bannedHeroes as bannedHero}
									<span class="badge variant-filled-secondary">{bannedHero?.localized_name}</span>
								{/each}
							</div>
							<button class="btn bg-red-500 w-1/2 my-4" on:click={() => setBanList()}>Clear</button>
						{:else}
							<p>none</p>
						{/if}
					</div>
				</div>
				<!-- {#if !showHeroGrid}
					<div class="border-double border-b-4 border-amber-500 w-full"></div>
				{/if} -->
			</div>

			<!-- Autobans Roles and Modifiers -->
			<div
				class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
			>
				<!-- Auto Bans -->
				<div class="relative">
					{#if randomFound}
						<div
							class="z-40 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-xl"
						>
							<!-- <h2 class="h2 text-primary-500 rounded-full bg-surface-500 p-4">
							Randoming Locked, you have an active random!
						</h2> -->
							<img src={Lock} class="h-32 w-32 inline" alt="locked" />
						</div>
					{/if}

					<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
						<h3 class="h3 dark:text-yellow-500 text-primary-500">2. Autobans</h3>
						<p class="text-xs">Use the preset lists below to eliminate the worst.</p>
					</div>

					<div class="mx-8 md:my-4 my-2">
						<!-- <h3 class="h3">Auto Bans</h3> -->
						<button class="btn dark:bg-amber-800 bg-amber-500 w-1/2 my-4" on:click={() => setBanList('garbage')}
							>Garbage</button
						>
					</div>

					<!-- Role filtering -->
					<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
						<h3 class="h3 dark:text-yellow-500 text-primary-500">3. Roles</h3>
						<p class="text-xs">Filter by role to fit your comp</p>
					</div>

					<div class="mx-8 md:my-4 my-2">
						<!-- <h3 class="h3">Auto Bans</h3> -->
						<!-- <button class="btn dark:bg-amber-800 bg-amber-500 w-1/2 my-4" on:click={() => setBanList('garbage')}>Garbage</button> -->

						<div class="grid grid-cols-3">
							{#each heroRoles as role}
								<label class="flex items-center space-x-2">
									<input
										class="checkbox"
										type="checkbox"
										on:click={() => handleRoleSelect(role)}
										checked={$randomStore.selectedRoles.includes(role)}
									/>
									<p>{role}</p>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<!-- Modifier calculation -->
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">4. Modifier Calculations</h3>
					<p class="text-xs">See how much gold your random will get you on win!</p>
				</div>
				<div class="w-fullmax-w-[90%] mx-auto p-4">
					<!-- <h3 class="h3 border-b border-primary-200 border-dashed py-2">Modifier calculations</h3> -->
					<div class="grid grid-cols-2">
						<div>
							<p>Number of bans:</p>
							<p>Free bans left (max 3):</p>
							<p>Heroes in random pool:</p>
							<p>Modifier amount:</p>
							<p>Total gold on win:</p>
						</div>
						<div>
							<p>{$randomStore.bannedHeroes.length}</p>
							<p>
								{$randomStore.bannedHeroes.length < $randomStore.freeBans
									? $randomStore.freeBans - $randomStore.bannedHeroes.length
									: 0}
							</p>
							<p class="text-green-600">{$randomStore.availableHeroes.length}</p>
							<p class="text-red-500">-{$randomStore.modifierTotal}</p>
							<p class="text-amber-500 font-bold">
								<!-- {$randomStore.startingGold - $randomStore.modifierTotal > 25
									? $randomStore.startingGold - $randomStore.modifierTotal
									: `25 (min)`} -->
								{$randomStore.expectedGold}
							</p>
						</div>
					</div>
				</div>

				{#if !randomFound}
					<!-- Random Button-->
					<button
						on:click={generateRandomHero}
						disabled={randomFound}
						class="z-50 btn variant-filled-primary w-full my-4 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
						>Random me</button
					>
				{/if}
			</div>

			<!-- Stats and History -->
			<div
				class="w-full h-fit max-md:max-w-sm space-y-10 dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 rounded-lg relative"
			>
				{#if !data.session}
					<div class="z-10 absolute h-full w-full bg-slate-800/80 flex flex-col items-center justify-center rounded-lg">
						<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
							Log in to start your Turbodota Random journey!
						</h3>
						<img src={Lock} class="h-32 w-32 inline" alt="locked" />
					</div>
				{/if}
				<div class="mx-4 my-2">
					<!-- Stats -->
					<div>
						<h2 class="h2 text-primary-500 w-full border-b border-primary-500 border-dashed py-2 mb-2">Stats</h2>
						<h2 class="h2">
							<p class="text-green-700 inline font-bold h1">
								{randomLifetimeStats.wins}
							</p>
							W -
							<p class="inline text-red-600 font-bold h1">
								{randomLifetimeStats.losses}
							</p>
							L
						</h2>
						<div class="my-2">
							<div>
								Total Gold Acquired: <p class="text-amber-500 inline">{randomLifetimeStats.totalGoldWon}g</p>
							</div>
							<div>
								Gold missed from Bans: <p class="text-red-500 inline">
									{randomLifetimeStats.totalLostGoldModifier}g
								</p>
							</div>
						</div>

						<!-- Add these later once people get more games -->
						<!-- <p>Most randomed</p>
				<p>Most randomed wins: Techies</p>
				<p>Most randomed losses: Broodmother</p> -->
					</div>
					<!-- <div class="my-4"> <MatchHistory matchTableData={matchTableData}/></div> -->
					<History {completedRandoms} allHeroes={data.heroDescriptions.allHeroes} />
				</div>
			</div>
		</div>
	</div>
</div>
