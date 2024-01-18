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
		console.log('account_id found in turbotown layout');
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
	$: if (browser && $quest1Store) {
		console.log('town store quest 1 store: ', $quest1Store, ' heroID: ');
		$quest1Store.randomedHero ? console.log($quest1Store.randomedHero.id) : ''
		console.log('town store quest 1 store: ', $quest2Store, ' heroID: ');
		$quest2Store.randomedHero ? console.log($quest2Store.randomedHero.id) : ''
		console.log('town store quest 1 store: ', $quest3Store, ' heroID: ');
		$quest3Store.randomedHero ? console.log($quest3Store.randomedHero.id) : ''
	}

	//set statuses
	if (data.town.turbotown && data.town.turbotown.statuses) {
		setContext('townStatuses', data.town.turbotown.statuses);
	}

	//refresh turbotown on render
	//$: data.town.turbotown
	$: console.log('quests changed in layout: ', data.quests)
	$: data.quests && updateGoldAndXp()
	
	function updateGoldAndXp(){
		if(data.quests.questChecks.length > 0 && data.town.turbotown){
			let successChecks = data.quests.questChecks.filter((check: any) => check.success)
			if(successChecks.length > 0) {
				data.town.turbotown.metrics = successChecks[data.quests.questChecks.length - 1].tx_result.town.metrics
			}
			
		}
	}

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
</script>

<div id="#townLayout" class="w-screen">
	{#if data.session && data.league && data.town && data.town.turbotown}
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
				<div class="col-span-2 border-r border-dashed border-primary-500"></div>

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
				transition:slide={{ delay: 50, duration: 200, easing: expoIn, axis: 'y' }}
				class="fixed bottom-0 left-[256px] w-[calc(100vw-256px)] h-16"
			>
				<div class="w-full h-full rounded-t-3xl bg-secondary-500 hover:bg-secondary-600 border-t-2 border-primary-500">
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
				<div class="w-full h-16 rounded-t-3xl bg-secondary-500 hover:bg-secondary-600">
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
		<div class="top-20 h-fit">
			<TownLoginGate />
		</div>
	{/if}
</div>
