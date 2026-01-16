<script lang="ts">
	import { run } from 'svelte/legacy';

	import { fade, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { browser } from '$app/environment';

	//prisma types
	import type { Random, Hero, TurbotownQuest } from '@prisma/client';

	//day js
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//page data
	import type { PageData } from './$types';

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	// ModalSettings type (not exported from Skeleton v3)
	type ModalSettings = {
		type?: string;
		title?: string;
		body?: string;
		component?: any;
		meta?: any;
		response?: (r: any) => void;
	};
	import { getContext } from 'svelte';
	const toastStore = getContext<any>('toaster');
	const showHeroGridModal = getContext<() => void>('showHeroGridModal');
	
	// Helper function to create toasts with Skeleton v3 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.create === 'function') {
			toastStore.create({
				title: message,
				description: '',
				type: background?.includes('error') ? 'error' : 
				       background?.includes('success') ? 'success' : 
				       background?.includes('warning') ? 'warning' : 'info',
				meta: { background }
			});
		}
	}

	//components
	import History from '../turbotown/quests/_components/History.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';
	import GenerateRandom from '../turbotown/quests/_components/GenerateRandom.svelte';

	//constants
	import { heroRoles } from '$lib/constants/heroRoles';
	import { constant_startingGold, constant_banMultiplier, constant_freeBans, constant_maxBans } from "$lib/constants/random"

	//stores
	import { randomStore } from '$lib/stores/randomStore';
	import { townStore } from '$lib/stores/townStore';

	//images
	import Lock from '$lib/assets/lock.png';
	import SeasonLogo from '$lib/assets/seasonLogo.png';
	import TournamentLight from '$lib/assets/tournament_light.png';
	import WantedPoster from '$lib/assets/wantedPoster.png';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	if (browser) {
		console.log('data: ', data);
	}

	// $: console.log('random store data: ', $randomStore);
	// $: console.log('town store data: ', $townStore);
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;
	run(() => {
		if(browser && $quest1Store){
			console.log('town store quest 1 store: ', $quest1Store);
			console.log('town store quest 2 store: ', $quest2Store);
			console.log('town store quest 3 store: ', $quest3Store);
		}
	});

	//loop through quests and set stores
	let quest1 = data.quests.filter((quest: TurbotownQuest) => quest.questSlot === 1)
	console.log('quest1: ', quest1)
	let quest2 = data.quests.filter((quest: TurbotownQuest) => quest.questSlot === 2)
	console.log('quest3: ', quest2)
	let quest3 = data.quests.filter((quest: TurbotownQuest) => quest.questSlot === 3)
	console.log('quest3: ', quest3)
	if(quest1.length > 0){
		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		quest1 = quest1[0]
		quest1Store.set({
				allHeroes: data.heroDescriptions.allHeroes,
				availableHeroes: quest1.random.availableHeroes.split(',').map((randomID: string) => {
					return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
				}),
				bannedHeroes:
					quest1.random.bannedHeroes.length > 0
						? quest1.random.bannedHeroes.split(',').map((randomID: string) => {
								return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
							})
						: [],
				selectedRoles: quest1.random.selectedRoles.split(',') || [],
				startingGold: constant_startingGold,
				expectedGold: quest1.random.expectedGold,
				banMultiplier: constant_banMultiplier,
				modifierAmount: quest1.random.modifierAmount,
				modifierTotal: quest1.random.modifierTotal,
				freeBans: constant_freeBans,
				maxBans: constant_maxBans,
				randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === quest1.random.randomedHero)[0]
			});
	} else quest1Store.reset(data.heroDescriptions.allHeroes);

	if(quest2.length > 0){
		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		quest2 = quest2[0]
		quest2Store.set({
				allHeroes: data.heroDescriptions.allHeroes,
				availableHeroes: quest2.random.availableHeroes.split(',').map((randomID: string) => {
					return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
				}),
				bannedHeroes:
					quest2.random.bannedHeroes.length > 0
						? quest2.random.bannedHeroes.split(',').map((randomID: string) => {
								return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
							})
						: [],
				selectedRoles: quest2.random.selectedRoles.split(',') || [],
				startingGold: constant_startingGold,
				expectedGold: quest2.random.expectedGold,
				banMultiplier: constant_banMultiplier,
				modifierAmount: quest2.random.modifierAmount,
				modifierTotal: quest2.random.modifierTotal,
				freeBans: constant_freeBans,
				maxBans: constant_maxBans,
				randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === quest2.random.randomedHero)[0]
			});
	} else quest2Store.reset(data.heroDescriptions.allHeroes);

	if(quest3.length > 0){
		let allHeroesCopy = [...data.heroDescriptions.allHeroes];
		quest3 = quest3[0]
		quest3Store.set({
				allHeroes: data.heroDescriptions.allHeroes,
				availableHeroes: quest3.random.availableHeroes.split(',').map((randomID: string) => {
					return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
				}),
				bannedHeroes:
					quest3.random.bannedHeroes.length > 0
						? quest3.random.bannedHeroes.split(',').map((randomID: string) => {
								return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
							})
						: [],
				selectedRoles: quest3.random.selectedRoles.split(',') || [],
				startingGold: constant_startingGold,
				expectedGold: quest3.random.expectedGold,
				banMultiplier: constant_banMultiplier,
				modifierAmount: quest3.random.modifierAmount,
				modifierTotal: quest3.random.modifierTotal,
				freeBans: constant_freeBans,
				maxBans: constant_maxBans,
				randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === quest3.random.randomedHero)[0]
			});
	} else quest3Store.reset(data.heroDescriptions.allHeroes);

	//end set stores

	/* 
		Calculations from server data
	*/
	let last5Matches: Match[] = data.rawMatchData.slice(0, 5);
	//console.log(`LAST 5 MATCHES:`, last5Matches);

	let matchTableData = last5Matches.map((match: any) => {
		return {
			match_id: match.match_id,
			start_time: dayjs.unix(match.start_time).format('llll'),
			result: winOrLoss(match.player_slot, match.radiant_win),
			hero: data.heroDescriptions.allHeroes.filter((hero: Hero) => hero.id === match.hero_id)[0].id,
			kda: ((match.kills + match.assists) / match.deaths).toFixed(2)
		};
	});

	//calc random lifetime stats on load
	let randomLifetimeStats = $state({
		wins: 0,
		losses: 0,
		totalGoldWon: 0,
		totalLostGoldModifier: 0
	});

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
	let randomSeasonStats = $state({
		userPlace: -1
	});
	if (data.session && data.session.user) {
		randomSeasonStats = {
			userPlace:
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore: Unreachable code error
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
				quest1Store.setBanList(setList)
				quest2Store.setBanList(setList);
				quest3Store.setBanList(setList);
			}
		} catch (e) {
			console.error('error in setting preferences');
		}
	}

	/* 
		End Calculations
	*/

	//evaluate if there is an active random stored in the DB
	// if ('randoms' in data && data?.randoms.length > 0 && data.randoms.filter((random) => random.active).length > 0) {
	// 	randomFound = true;
	// 	const { availableHeroes, bannedHeroes, selectedRoles, expectedGold, modifierAmount, modifierTotal, randomedHero } =
	// 		data.randoms
	// 			.filter((random) => random.active)
	// 			.sort((a: any, b: any) => {
	// 				if (a.start_time < b.start_time) return -1;
	// 				else return 1;
	// 			})[0];

	// 	let allHeroesCopy = [...data.heroDescriptions.allHeroes];
	// 	// console.log(availableHeroes.split(','));
	// 	// console.log(
	// 	// 	availableHeroes.split(',').map((randomID: string) => {
	// 	// 		return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
	// 	// 	})
	// 	// );

	// 	//console.log("randomed hero: ", allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0])

	// 	console.log(`bannedHeroes: ${bannedHeroes} selectedRoles: ${selectedRoles} randomedHero: ${randomedHero}`);

	// 	if (typeof bannedHeroes === 'string' && typeof selectedRoles === 'string' && randomedHero) {
	// 		console.log(`[random/+page.svelte] - setting random store `);
	// 		randomStore.set({
	// 			allHeroes: data.heroDescriptions.allHeroes,
	// 			availableHeroes: availableHeroes.split(',').map((randomID: string) => {
	// 				return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
	// 			}),
	// 			bannedHeroes:
	// 				bannedHeroes.length > 0
	// 					? bannedHeroes.split(',').map((randomID: string) => {
	// 							return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
	// 						})
	// 					: [],
	// 			selectedRoles: selectedRoles.split(',') || [],
	// 			startingGold: 100,
	// 			expectedGold,
	// 			banMultiplier: 8,
	// 			modifierAmount,
	// 			modifierTotal,
	// 			freeBans: 3,
	// 			maxBans: 10,
	// 			randomedHero: allHeroesCopy.filter((hero: Hero) => hero.id === randomedHero)[0]
	// 		});

	// 		generatedRandomHero = $randomStore.randomedHero;
	// 	} else {
	// 		console.error('[set locked random hero] - couldnt set locked random');
	// 	}
	// } else if (data.session && data.session.user) {
	// 	const t: ToastSettings = {
	// 		message: `No active randoms found for user`,
	// 		background: 'variant-filled-warning'
	// 	};

	// 	toastStore.trigger(t);
	// }

	// interface HeroRandom {
	// 	availableHeroes: Hero[];
	// 	bannedHeroes: Hero[];
	// 	selectedRoles: string[];
	// 	startingGold: number;
	// 	expectedGold: number;
	// 	banMultiplier: number;
	// 	modifierAmount: number;
	// 	modifierTotal: number;
	// 	maxBans: number;
	// }

	// let heroRandom: HeroRandom = {
	// 	availableHeroes: [...data.heroDescriptions.allHeroes],
	// 	bannedHeroes: [],
	// 	selectedRoles: [],
	// 	startingGold: 100,
	// 	expectedGold: 100,
	// 	banMultiplier: 8,
	// 	modifierAmount: 0,
	// 	modifierTotal: 0,
	// 	maxBans: 10
	// };

	// $: heroRandom.bannedHeroes;

	const t: ToastSettings = {
		message: `Max bans of ${$randomStore.maxBans} reached!`,
		background: 'preset-filled-warning-500'
	};

	let banLimitErrorVisible: boolean = $state(false);
	run(() => {
		if (banLimitErrorVisible === true)
			setTimeout(() => {
				banLimitErrorVisible = false;
			}, 5000);
	});

	run(() => {
		randomStore.updateCalculations();
		if (banLimitErrorVisible) toastStore.trigger(t);
	});

	const modal: ModalSettings = {
		type: 'component',
		component: 'heroGrid'
	};
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center md:mx-8 mx-2">
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
			{#if data.session && data.session.user && data.leagueAndSeasonsResult[0] && data.leagueAndSeasonsResult[0].seasons.length > 0}
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
							<a href="/random/leaderboard"><button class="btn preset-tonal-primary border border-primary-500">Leaderboard</button></a>
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

		<!-- Action buttons for quest board -->
		<div class="w-full m-4">
			<button
				class="btn preset-filled"
				onclick={() => {
					showHeroGridModal?.();
				}}>Ban Heroes</button
			>

			<button class="btn preset-filled">Test</button>
		</div>

		<!-- Quest Board -->
		<div
			class="bg-questBoard 2xl:h-[700px] xl:h-[600px] md:h-[500px] bg-no-repeat bg-contain bg-center w-full flex justify-center items-center"
		>
			<div class="w-[70%] h-full grid grid-cols-3 mx-auto max-h-[75%]">
				<div
					class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
				>
					<div class="m-4 h-3/4 w-3/4 my-auto p-4">
						<GenerateRandom {data} questSlot={1}></GenerateRandom>
					</div>
				</div>
				<div
					class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
				>
					<div class="m-4 h-3/4 w-3/4 my-auto p-4">
						<GenerateRandom {data} questSlot={2}></GenerateRandom>
					</div>
				</div>
				<div
					class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
				>
					<div class="m-4 h-3/4 w-3/4 my-auto p-4">
						<GenerateRandom {data} questSlot={3}></GenerateRandom>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Random button and last 5-->
		<div class="w-full flex max-md:flex-col">
			<!-- <div class={'rounded-xl mx-1 my-2 ' + (!data.session ? ' lg:w-3/4 mx-auto my-4' : 'lg:w-1/2')}>
				<GenerateRandom {data}></GenerateRandom>
			</div> -->
			{#if data.session && data.session.user}
				<div class="m-2 lg:w-1/2"><MatchHistory {matchTableData} /></div>
			{/if}
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
