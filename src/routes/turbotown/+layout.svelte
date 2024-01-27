<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut, expoIn, expoOut } from 'svelte/easing';
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import type { Item, TurbotownItem, TurbotownQuest, Hero } from '@prisma/client';
	import { Prisma } from '@prisma/client';

	//helpers
	import { clickOutside } from '$lib/helpers/clickOutside.ts';

	//skeleton
	import { ProgressBar } from '@skeletonlabs/skeleton';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	//components
	import Inventory from './_components/Inventory.svelte';
	import TownLoginGate from './_components/TownLoginGate.svelte';

	//images
	import town_logo_light from '$lib/assets/turbotown_light.png';
	import town_logo_dark from '$lib/assets/turbotown_dark.png';

	//stores
	import { townStore } from '$lib/stores/townStore';

	//constants
	import {
		constant_startingGold,
		constant_banMultiplier,
		constant_freeBans,
		constant_maxBans
	} from '$lib/constants/random';

	export let data: LayoutData;

	//avatar
	let avatarURL = '';
	if (data.session && data.session.user.avatar_url) {
		avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');
	}

	let pagePath = $page.url.pathname.split('/turbotown/')[1] || '';
	let routeName = pagePath !== '' ? pagePath.charAt(0).toUpperCase() + pagePath.slice(1) : 'Town';

	if (browser) {
		console.log('data in town layout: ', data);
	}

	let showInventory = false;
	const collapse = () => {
		showInventory = !showInventory;
	};

	const onBlur = () => {
		//console.log('blurring');
		showInventory = false;
	};

	//set towninfo
	if (data.session && data.session.user) {
		//console.log('account_id found in turbotown layout');
		setContext('account_id', data.session.user.account_id);
	} else {
		console.error('no account_id found in turbotown layout');
	}

	//set quests
	type QuestWithRandom = Prisma.TurbotownQuestGetPayload<{
		include: {
			random: true;
		};
	}>;

	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;

	//set statuses
	if (data.town.turbotown && data.town.turbotown.statuses) {
		setContext('townStatuses', data.town.turbotown.statuses);
	}

	//set metrics
	let questRandomIDs = [...new Set(data.town.turbotown?.quests.map((quest) => quest.randomID))];
	let randomVariabilityPercent: number = questRandomIDs.length / data.town?.turbotown?.quests?.length;

	//refresh turbotown on render
	//$: data.town.turbotown
	$: console.log('quests changed in layout: ', data.quests);
	$: data.quests && updateGoldAndXp();
	$: data.quests && setQuestStores();

	//set ban list
	const checkForBanList = () => {
		if (data.userPreferences && data.userPreferences.length > 0) {
			console.log(`[random/+page.svelte] - evaluating userPreferencces`);
			let banListPref = data.userPreferences.filter((pref: any) => pref.name === 'randomBanList');

			try {
				if (banListPref.length > 0 && banListPref[0].value) {
					console.log(`[random/+page.svelte] - evaluating saved ban list`);
					let randomBanListParsed = JSON.parse(banListPref[0].value);

					let setList = data.heroDescriptions.allHeroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

					return setList;
				} else {
					console.error('[quests page.svelte] - couldnt get ban list in checkForBanList');
					return [];
				}
			} catch (e) {
				console.error('error in setting preferences');
			}
		} else return [];
	};

	$: if (browser && $quest1Store) {
		let setList = checkForBanList();
		// if (setList.length > 0) {
		// 	quest1Store.setBanList(setList);
		// 	quest2Store.setBanList(setList);
		// 	quest3Store.setBanList(setList);
		// } else {
		// 	console.error('[turbotown layout] - could not set bans, banList length 0');
		// }

		if (!$quest1Store.randomedHero) {
			quest1Store.setBanList(setList);
		}

		if (!$quest2Store.randomedHero) {
			quest2Store.setBanList(setList);
		}

		if (!$quest3Store.randomedHero) {
			quest3Store.setBanList(setList);
		}

		console.log('town store quest 1 store after bans: ', $quest1Store, ' heroID: ');
		$quest1Store.randomedHero ? console.log($quest1Store.randomedHero.id) : '';
		console.log('town store quest 2 store after bans: ', $quest2Store, ' heroID: ');
		$quest2Store.randomedHero ? console.log($quest2Store.randomedHero.id) : '';
		console.log('town store quest 3 store after bans: ', $quest3Store, ' heroID: ');
		$quest3Store.randomedHero ? console.log($quest3Store.randomedHero.id) : '';
	}

	function updateGoldAndXp() {
		if (data.quests.questChecks?.length > 0 && data.town.turbotown) {
			let successChecks = data.quests.questChecks.filter((check: any) => check.success);
			if (successChecks.length > 0) {
				data.town.turbotown.metrics = successChecks[successChecks.length - 1].tx_result.town.metrics;
			}
		}
	}

	function setQuestStores() {
		console.log('setting quest stores');
		//loop through quests and set stores
		if (data.town && data.quests) {
			let quest1arr: QuestWithRandom[] = data.quests.quests.filter(
				(quest: QuestWithRandom) => quest.questSlot === 1 && quest.status === 'active'
			);
			//console.log('quest1: ', quest1arr);
			let quest2arr: QuestWithRandom[] = data.quests.quests.filter(
				(quest: QuestWithRandom) => quest.questSlot === 2 && quest.status === 'active'
			);
			//console.log('quest3: ', quest2arr);
			let quest3arr: QuestWithRandom[] = data.quests.quests.filter(
				(quest: QuestWithRandom) => quest.questSlot === 3 && quest.status === 'active'
			);
			//console.log('quest3: ', quest3arr);

			let quest1: QuestWithRandom, quest2: QuestWithRandom, quest3: QuestWithRandom;
			if (quest1arr.length > 0) {
				let allHeroesCopy = [...data.heroDescriptions.allHeroes];
				quest1 = quest1arr[0];
				quest1Store.set({
					allHeroes: data.heroDescriptions.allHeroes,
					availableHeroes: quest1.random.availableHeroes.split(',').map((randomID: string) => {
						return allHeroesCopy.filter((hero: Hero) => hero.id === parseInt(randomID))[0];
					}),
					bannedHeroes:
						quest1?.random?.bannedHeroes.length > 0
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

			if (quest2arr.length > 0) {
				let allHeroesCopy = [...data.heroDescriptions.allHeroes];
				quest2 = quest2arr[0];
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

			if (quest3arr.length > 0) {
				let allHeroesCopy = [...data.heroDescriptions.allHeroes];
				quest3 = quest3arr[0];
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
		}
		//end set stores
	}

	const popupHover: PopupSettings = {
		event: 'hover',
		target: 'popupHover',
		placement: 'bottom'
	};
</script>

<div id="#townLayout" class="w-screen">
	{#if data.session}
		{#if data.league && data.town && data.town.turbotown}
			<div
				id="#turbotownHeader"
				class="fixed top-20 left-[256px] w-[calc(100vw-256px)] h-24 card rounded-t-none shadow-xl border-primary-500 border-b z-50"
			>
				<div class="grid grid-cols-4 p-1 h-24">
					<div
						id="turbotownPageHeader"
						class="flex items-center justify-around border-r border-dashed border-primary-500"
					>
						<img class="block dark:hidden w-32" alt="TurboTownLight" src={town_logo_light} />
						<img class="hidden dark:block w-32" alt="TurboTownDark" src={town_logo_dark} />
						<h2 class="h2 text-amber-500 max-md:font-bold text-center">{routeName}</h2>
					</div>
					<div class="col-span-2 border-r border-dashed border-primary-500 h-100% p-1">
						<div class="h-full grid grid-cols-2">
							<div class="flex flex-col w-full">
								<p class="text-center border-b border-tertiary-500 w-1/2 mx-auto">Turbotown Stats</p>
								<div class="grid grid-cols-3 w-full h-full">
									<div class="h-full flex justify-center">
										<div class="w-full my-auto">
											<p class="text-xs italic text-tertiary-500 text-center">Quest Win %</p>
											{#if data.quests?.quests.length > 0}
												<p class="font-bold text-green-500 text-center">
													{(
														(data.quests.quests.filter((quest) => quest.win).length / data.quests.quests.length) *
														100
													).toFixed(2)}
												</p>
											{:else}
												<p class="text-center font-slate-700">n/a</p>
											{/if}
										</div>
									</div>

									<div class="h-full flex justify-center">
										<div class="w-full my-auto">
											<p class="text-xs italic text-tertiary-500 text-center">Season Participation %</p>
											{#if data.quests?.quests.length > 0}
												<p class="font-bold text-green-500 text-center">
													{((data.quests.quests.length / data.league._counts.questsInSeason) * 100).toFixed(2)}
												</p>
											{:else}
												<p class="text-center font-slate-700">n/a</p>
											{/if}
										</div>
									</div>
									<div class="h-full flex justify-center [&>*]:pointer-events-none" use:popup={popupHover}>
										<div class="w-full my-auto">
											<p class="text-xs italic text-tertiary-500 text-center">Random Variability %</p>
											{#if data.quests?.quests.length > 0}
												<p class="font-bold text-green-500 text-center">
													{(randomVariabilityPercent * 100).toFixed(2)}
												</p>
											{:else}
												<p class="text-center font-slate-700">n/a</p>
											{/if}
										</div>
										<div class="card p-4 variant-filled-secondary" data-popup="popupHover">
											<p class="italic font-tertiary-500">Unique Randomed Heroes / Total Quests</p>
											<div class="arrow variant-filled-secondary" />
										</div>
									</div>
								</div>
							</div>
							<div class="flex justify-center items-center h-full">
								<a
									class="w-1/2"
									href={`/leagues/${data.league.leagueID}/seasons/${data.league.seasonID}`}
									target="_blank"
								>
									<button class="btn variant-ghost-primary w-full h-min">Season Leaderboard</button>
								</a>
							</div>
						</div>
					</div>

					<div id="turbotownProfile" class="rounded-xl grid grid-cols-4 py-1 px-2">
						<div id="townProfileImage" class="flex flex-col justify-center items-center">
							{#if avatarURL}
								<img class="h-12 w-12 rounded-xl" src={avatarURL} alt="" />
							{:else}
								<i class="text-5xl fi fi-rr-mode-portrait"></i>
							{/if}
							<p class="dark:text-yellow-500">Level: 1</p>
						</div>
						{#key data.town.turbotown}
							<div id="townProfileStats" class="flex flex-col text-md justify-center col-span-3">
								<div class="flex justify-start space-x-2">
									<div>
										<i class="fi fi-rr-coins text-yellow-500 text-center"></i>
									</div>

									<p>{data.town.turbotown.metrics.filter((metric) => metric.label === 'gold')[0].value}</p>
								</div>

								<div class="flex justify-start space-x-2">
									<div>
										<i class="fi fi-br-arrow-trend-up text-center text-green-500"></i>
									</div>
									<p class="">
										{data.town.turbotown.metrics.filter((metric) => metric.label === 'xp')[0].value}
									</p>
								</div>

								<ProgressBar label="Progress Bar" value={50} max={100} />
							</div>
						{/key}
					</div>
					<!-- <i class="fi fi-sr-backpack text-8xl text-yellow-500"></i> -->
				</div>
			</div>
			<div class="w-full mt-24 mb-16 py-4 px-2">
				<slot />
			</div>

			{#if !showInventory}
				<!-- <div 
		transition:slide={{ delay: 50, duration: 400, easing: quintOut, axis: 'y' }}
		class="fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 h-20"> -->
				<div
					in:slide={{ delay: 300, duration: 200, easing: expoIn, axis: 'y' }}
					out:slide={{ delay: 100, duration: 200, easing: expoOut, axis: 'y' }}
					class="fixed bottom-0 left-[256px] w-[calc(100vw-256px)] h-16 z-0"
				>
					<div
						class="w-full h-full rounded-t-3xl bg-yellow-950 hover:bg-yellow-900 border border-yellow-800 bg-gradient-to-b to-transparent from-yellow-950"
					>
						<button on:click={collapse} class="w-full h-full flex items-center justify-center space-x-4">
							<i class="fi fi-rs-backpack text-3xl"></i>
							<p>Inventory</p>
						</button>
					</div>
				</div>
			{/if}
			<!-- <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }} class={"fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 " + (showInventory ? "h-[500px]" : "h-10")}></div> -->
			{#if showInventory}
				<div
					transition:slide={{ delay: 50, duration: 400, easing: expoIn, axis: 'y' }}
					class={'fixed bottom-0 left-[256px] w-[calc(100vw-256px)] h-[500px] z-50'}
					on:blur={onBlur}
					use:clickOutside
					on:click_outside={onBlur}
				>
					<div
						class="w-full h-16 rounded-t-3xl bg-yellow-950 hover:bg-yellow-900 border-yellow-800 border-t border-l border-r bg-gradient-to-b to-transparent from-yellow-950"
					>
						<button on:click={collapse} class="w-full h-full flex items-center justify-center space-x-8"
							><i class="fi fi-br-angle-small-down text-3xl"></i>Close Inventory</button
						>
					</div>
					{#if showInventory}
						<div class="h-full" transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
							<Inventory {data} />
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="top-20 h-fit m-20 w-full">
				<div>
					<h1 class="h1">Missing one of:</h1>
				</div>
				<div class="">
					<div>
						League: <p class={'inline font-bold ' + (!!data.league ? 'text-green-500' : 'text-red-500')}>
							{!!data.league ? 'Found' : 'Missing'}
						</p>
					</div>
					<div>
						Town: <p class={'inline font-bold ' + (!!data.town ? 'text-green-500' : 'text-red-500')}>
							{!!data.town ? 'Found' : 'Missing'}
						</p>
					</div>
					<div>
						Turbotown: <p class={'inline font-bold ' + (!!data.town.turbotown ? 'text-green-500' : 'text-red-500')}>
							{!!data.town.turbotown ? 'Found' : 'Missing'}
						</p>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="top-20 h-fit m-20 border-b border-double border-amber-500">
			<TownLoginGate />
		</div>
	{/if}
</div>
