<script lang="ts">
	import { slide, blur, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintIn, quintOut } from 'svelte/easing';
	import { setContext, getContext } from 'svelte';

	//prisma types
	import type { Random, Hero, UserPrefs, Session } from '@prisma/client';
	//types
	import type { createRandomStore } from '$lib/stores/randomStore';

	//day js
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//skeleton
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	const popupClick: PopupSettings = {
		event: 'click',
		target: 'popupClick',
		placement: 'bottom'
	};

	//images
	import Dice from '$lib/assets/dice.png';

	//page data
	import type { PageData } from '../$types';
	export let data: PageData;

	//stores
	//import { randomStore } from '$lib/stores/randomStore';
	import { townStore } from '$lib/stores/townStore';
	import { banStore } from '$lib/stores/banStore';
	import { load } from '../../../blog/+page';

	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//component props
	export let session: Session | null = null;
	export let questSlot: number = 1;

	let randomStore = $townStore.quests.quest1;
	if (questSlot === 1) randomStore = $townStore.quests.quest1;
	else if (questSlot === 2) randomStore = $townStore.quests.quest2;
	else if (questSlot === 3) randomStore = $townStore.quests.quest3;

	/* Get session from context */
	if (!session) session = getContext('session');
	let preferences: UserPrefs[] = [];
	if (!preferences || preferences.length === 0) preferences = getContext('userPreferences');
	//console.log(preferences);

	// type BanStore = ReturnType<typeof createRandomStore>
	// let banStore = getContext<BanStore>('banStore')

	// $: console.log(`[questSlot ${questSlot}] ban store in generate random: `, $banStore)
	// $: console.log(`[questSlot ${questSlot}] random store in generate random: `, $randomStore)

	// if (browser) {
	// 	console.log('data: ', data);
	// }

	//$: console.log('store data in component: ', $randomStore);

	let generatedRandomHero: Hero | null = null;
	if ($randomStore.randomedHero && $randomStore.randomedHero.id) generatedRandomHero = $randomStore.randomedHero;

	let randomFound = false;

	/* 
		End Calculations
	*/
	const generateRandomHero = async () => {
		loadingCircle = true;
		//console.log('randomStore in generate random', randomStore);
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

		let randomizedHero = $randomStore.availableHeroes[Math.floor(Math.random() * $randomStore.availableHeroes.length)];

		if (data.session && randomizedHero) {
			let bodyData = {
				...$randomStore,
				availableHeroes: $randomStore.availableHeroes.map((hero: Hero) => hero.id),
				bannedHeroes: $randomStore.bannedHeroes.map((hero: Hero) => hero.id),
				randomedHero: randomizedHero.id,
				questSlot
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

			if (response.status === 200) {
				$randomStore.randomedHero = randomizedHero;
				generatedRandomHero = randomizedHero
				randomFound = true;
			} else {
				const t: ToastSettings = {
					message: `Trying to cheat ;) ? Refresh the page.`,
					background: 'variant-filled-warning'
				};

				toastStore.trigger(t);
			}
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
		console.log('checking for random complete');
		let responseStratz, responseParse;
		if (!stratzTimeout && data.session) {
			responseStratz = await fetch(`/api/stratz/players/${data.session.user.account_id}/recentMatches`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
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

	//transitionCircle
	let loadingCircle: boolean = false;
	$: generatedRandomHero &&
		setTimeout(() => {
			loadingCircle = false;
		}, 2000);
</script>

{#if generatedRandomHero}
	<div class="flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full">
		{#if loadingCircle}
			<div
				class="absolute top-[30%] left-[25%] rounded-full w-32 animate-pulse"
				out:fade={{ delay: 0, duration: 2000, easing: quintOut }}
			>
				<img src={Dice} alt="dice roll" class="spin" />
			</div>
		{/if}
		<!-- <img src={WantedPoster} alt="wanted" class="rounded-xl absolute"/> -->
		<div
			class="flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full"
			in:fade={{ delay: 0, duration: 4000, easing: quintIn }}
			out:fade={{ delay: 0, duration: 4000, easing: quintOut }}
		>
			<div class="z-50 flex flex-col items-center rounded-2xl p-4 w-full h-full justify-around">
				<!-- <h1 class="h1 text-slate-900 font-bold">WANTED</h1> -->
				<h2 class="h2 text-primary-500 font-bold">Wanted</h2>
				<i class={`d2mh hero-${generatedRandomHero.id} xl:scale-[3] lg:scale-[2.5] md:scale-[2]`}></i>
				<h1 class="xl-h1 h3 font-bold animate-pulse text-amber-600">
					{generatedRandomHero.localized_name}
				</h1>
				<!-- <i class={`vibrating d2mh hero-${generatedRandomHero.id} scale-150`}></i> -->
			</div>
			<!-- {#if data.session && data.session.user}
				<div class="flex items-center justify-center">
					<button
						class="btn variant-filled-success w-full"
						use:popup={popupClick}
						on:click={() => {
							stratzLoading = checkForRandomComplete();
						}}
					>
						<i class="fi fi-br-refresh h-fit"></i>
						<div class="italic">Completed?</div></button
					>
				</div>
			{/if} -->
		</div>
		<!-- {#if data.session && data.session.user}
					<div class="my-4"><MatchHistory {matchTableData} /></div>
				{/if} -->
	</div>
{:else}
	<!-- <div class="my-4"><MatchHistory {matchTableData} /></div> -->
	<div class="flex flex-col justify-center items-center h-full">
		<!-- <div>
			<i class="fi fi-sr-person-circle-question text-5xl text-primary-500"></i>
			<h3 class="h3 text-secondary-500">No random found, get a new one below!</h3>
		</div> -->
		<div class="w-full">
			<button
				on:click={generateRandomHero}
				disabled={randomFound}
				class="z-50 btn variant-filled-primary w-full my-4 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
				in:fade={{ delay: 0, duration: 1000, easing: quintIn }}
			>
				<div class="flex items-center space-x-2">
					<i class="h-5 w-5 fi fi-rs-treasure-chest text-amber-200"></i>
					<p>Get Quest</p>
				</div>
			</button>
		</div>
	</div>
{/if}

<div class="z-50" data-popup="popupClick">
	<div class="w-fit mx-auto p-4 border border-dashed border-fuchsia-300 my-4 space-y-4 card">
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
						{#if newerStratzMatches[0].id.toString() !== data.match.rawMatchData[0].match_id.toString()}
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
								{data.match.rawMatchData[0].match_id}
							</p>
						</div>
					</div>

					<div class="mt-2">
						<p class="inline text-orange-500 font-bold">{stratzTimeoutCountdown}s</p>
						before you can check again
					</div>
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
								<div class="italic">Completed?</div></button
							>
						</div>
					{/if}
				</div>
			{:else}
				<div>didnt work</div>
			{/if}
		{/await}
	</div>
</div>

<style>
	.spin {
		-webkit-animation: spin 2s linear infinite;
		-moz-animation: spin 2s linear infinite;
		animation: spin 2s linear infinite;
	}
	@-moz-keyframes spin {
		100% {
			-moz-transform: rotate(360deg);
		}
	}
	@-webkit-keyframes spin {
		100% {
			-webkit-transform: rotate(360deg);
		}
	}
	@keyframes spin {
		100% {
			-webkit-transform: rotate(360deg);
			transform: rotate(360deg);
		}
	}
</style>
