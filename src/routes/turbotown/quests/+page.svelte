<script lang="ts">
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
	export let data: PageData;

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	const modalStore = getModalStore();

	//components
	import History from './_components/History.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';
	import GenerateRandom from './_components/GenerateRandom.svelte';

	//constants
	import { heroRoles } from '$lib/constants/heroRoles';
	import {
		constant_startingGold,
		constant_banMultiplier,
		constant_freeBans,
		constant_maxBans
	} from '$lib/constants/random';

	//stores
	import { randomStore } from '$lib/stores/randomStore';
	import { townStore } from '$lib/stores/townStore';

	//images
	import Lock from '$lib/assets/lock.png';
	import SeasonLogo from '$lib/assets/seasonLogo.png';
	import TournamentLight from '$lib/assets/tournament_light.png';
	import WantedPoster from '$lib/assets/wantedPoster.png';

	if (browser) {
		console.log('data: ', data);
	}
	/* 
		Calculations from server data
	*/
	let last5Matches: Match[] = [];
	if (data.match.rawMatchData) {
		last5Matches = data?.match.rawMatchData.slice(0, 5) || [];
	}

	//console.log(`LAST 5 MATCHES:`, last5Matches);

	let matchTableData = last5Matches.map((match: any) => {
		return {
			match_id: match.match_id,
			start_time: typeof(match.start_time) === "number" ? dayjs.unix(match.start_time).format('llll') : dayjs(match.start_time).format('llll'),
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

	let completedRandoms: Random[] = [];
	if (data.random.randoms) {
		completedRandoms = data.random.randoms.filter((random) => !random.active);
		if (completedRandoms.length > 0) {
			randomLifetimeStats = {
				wins: completedRandoms.filter((random) => random.win).length || 0,
				losses: completedRandoms.filter((random) => !random.active && !random.win).length,
				totalGoldWon: completedRandoms.reduce((acc, cur) => acc + (cur.endGold || 0), 0),
				totalLostGoldModifier: completedRandoms.reduce((acc, cur) => acc + cur.modifierTotal, 0)
			};
		}
	}

	//calc leaderboard info for seasons panel
	let randomSeasonStats = {
		userPlace: -1
	};
	if (data.session && data.session.user && data.league.currentSeasonLeaderboard) {
		randomSeasonStats = {
			userPlace:
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore: Unreachable code error
				data.league.currentSeasonLeaderboard.findIndex((item: any) => item.player === data.session.user.account_id) + 1
		};
	}

	//set user preferences on page
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;
	if (data.userPreferences && data.userPreferences.length > 0) {
		console.log(`[random/+page.svelte] - evaluating userPreferencces`);
		let banListPref = data.userPreferences.filter((pref: any) => pref.name === 'randomBanList');

		try {
			if (banListPref.length > 0 && banListPref[0].value) {
				console.log(`[random/+page.svelte] - evaluating saved ban list`);
				let randomBanListParsed = JSON.parse(banListPref[0].value);

				let setList = data.heroDescriptions.allHeroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

				randomStore.setBanList(setList);
				quest1Store.setBanList(setList);
				quest2Store.setBanList(setList);
				quest3Store.setBanList(setList);
			}
		} catch (e) {
			console.error('error in setting preferences');
		}
	}

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

	const modal: ModalSettings = {
		type: 'component',
		component: 'heroGrid'
	};

	export let form;
	$: console.log('form in quests page.svelte: ', form);

	function onFormSuccess(form: any) {
		if (form && form.success) {
			console.log('sending toast');

			if (form.action === 'use item') {
				const t: ToastSettings = {
					message: `Used ${form?.result?.action}`,
					background: 'variant-filled-success'
				};

				toastStore.trigger(t);
			}

			if (form.action === 'buy item') {
				const t: ToastSettings = {
					message: `Bought ${form?.result?.count} items`,
					background: 'variant-filled-success'
				};

				toastStore.trigger(t);
			}
		}
	}

	$: onFormSuccess(form);
</script>

<div class="container h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center">
		<!-- Quest Board and ban heroes -->
		<div id="questBoardContainer" class="flex w-full">
			<!-- Quest Board -->
			<div
				class="bg-questBoard 2xl:h-[700px] xl:h-[500px] md:h-[500px] bg-no-repeat bg-contain bg-center w-full flex justify-center items-center"
			>
				<div class="flex flex-col h-full justify-center items-center w-[70%]">
					<div class="w-full h-full grid grid-cols-3 mx-auto max-h-[75%]">
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
					<!-- Action buttons for quest board -->
					<div class="flex flex-col justify-center items-center h-fit w-full">
						<button
							class="btn p-1 w-1/3 bg-primary-500/70"
							on:click={() => {
								modalStore.trigger(modal);
							}}>Ban Heroes</button
						>
					</div>
				</div>
			</div>
		</div>

		<!-- Random button and last 5-->
		<div class="w-full grid grid-cols-2 max-md:flex max-md:flex-col gap-x-4 my-4">
			{#if data.session && data.session.user}
				<div class="w-full">
					<MatchHistory {matchTableData} />
				</div>
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
				<div class="mx-4">
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
