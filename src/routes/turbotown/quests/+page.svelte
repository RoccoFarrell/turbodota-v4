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

	//props - must be declared before use in Svelte 5
	interface Props {
		data: PageData;
		form: any;
	}

	let { data, form }: Props = $props();

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
	
	// Helper function to create toasts with Skeleton v4 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.trigger === 'function') {
			toastStore.trigger({
				message: message,
				background: background
			});
		}
	}

	//components
	import History from './_components/History.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';
	import GenerateRandom from './_components/GenerateRandom.svelte';
	import { Confetti } from 'svelte-confetti';

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
	import { heroPoolStore } from '$lib/stores/heroPoolStore';

	//images
	import Lock from '$lib/assets/lock.png';
	import SeasonLogo from '$lib/assets/seasonLogo.png';
	import TournamentLight from '$lib/assets/tournament_light.png';
	import WantedPoster from '$lib/assets/wantedPoster.png';

	if (browser) {
		console.log('data: ', data);

		// Initialize hero pool store with all heroes
		heroPoolStore.setAllHeroes(data.heroDescriptions.allHeroes);
	}


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

					// Update hero pool store with banned heroes
					heroPoolStore.setBannedHeroes(setList);

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

	let animationSlots: number[] = [-1];
	let animateSlot1: boolean = $state(false);
	let animateSlot2: boolean = $state(false);
	let animateSlot3: boolean = $state(false);

	// Subscribe to hero pool changes
	let availableHeroCount: number = $state();
	heroPoolStore.subscribe(state => {
		availableHeroCount = state.availableHeroes.length;
	});

	const onQuestComplete = (quests: any) => {
		console.log('data.quests changed');

		let activeQuests = quests.questChecks.forEach((check: any) => {
			if (check?.tx_result?.quest) {
				let pushSlot = check.tx_result.quest.questSlot;
				console.log('trigger animation for this quest ', check.tx_result.quest);
				if (pushSlot === 1) animateSlot1 = true;
				if (pushSlot === 2) animateSlot2 = true;
				if (pushSlot === 3) animateSlot3 = true;

				let setList = checkForBanList();

				setTimeout(() => {
					if (animateSlot1) {
						$townStore.quests.quest1.reset(data.heroDescriptions.allHeroes);
						setList?.length > 0 ? quest1Store.setBanList(setList) : '';
						animateSlot1 = false;
					}
					if (animateSlot2) {
						$townStore.quests.quest2.reset(data.heroDescriptions.allHeroes);
						setList?.length > 0 ? quest2Store.setBanList(setList) : '';
						animateSlot2 = false;
					}
					if (animateSlot3) {
						$townStore.quests.quest3.reset(data.heroDescriptions.allHeroes);
						setList?.length > 0 ? quest3Store.setBanList(setList) : '';
						animateSlot3 = false;
					}
				}, 5000);
			}
		});
	};
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
			start_time:
				typeof match.start_time === 'number'
					? dayjs.unix(match.start_time).format('llll')
					: dayjs.unix(match.start_time).format('llll'),
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

	let completedRandoms: Random[] = $state([]);
	if (data.random.randoms) {
		completedRandoms = data.random.randoms.filter((random) => !random.active && random.status !== 'skipped');
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

	// if (data.userPreferences && data.userPreferences.length > 0) {
	// 	console.log(`[random/+page.svelte] - evaluating userPreferencces`);
	// 	let banListPref = data.userPreferences.filter((pref: any) => pref.name === 'randomBanList');

	// 	try {
	// 		if (banListPref.length > 0 && banListPref[0].value) {
	// 			console.log(`[random/+page.svelte] - evaluating saved ban list`);
	// 			let randomBanListParsed = JSON.parse(banListPref[0].value);

	// 			let setList = data.heroDescriptions.allHeroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

	// 			quest1Store.setBanList(setList);
	// 			quest2Store.setBanList(setList);
	// 			quest3Store.setBanList(setList);
	// 		}
	// 	} catch (e) {
	// 		console.error('error in setting preferences');
	// 	}
	// }

	const t: ToastSettings = {
		message: `Max bans of ${$quest1Store.maxBans} reached!`,
		background: 'preset-filled-warning-500'
	};

	let banLimitErrorVisible: boolean = $state(false);


	const modal: ModalSettings = {
		type: 'component',
		component: 'heroGrid'
	};

	function onFormSuccess(form: any) {
		if (form && form.success) {
			console.log('sending toast');

			if (form.action === 'use item') {
				const t: ToastSettings = {
					message: `Used ${form?.result?.action}`,
					background: 'preset-filled-success-500'
				};

				toastStore.trigger(t);
			}

			if (form.action === 'buy item') {
				const t: ToastSettings = {
					message: `Bought ${form?.result?.count} items`,
					background: 'preset-filled-success-500'
				};

				toastStore.trigger(t);
			}
		}
	}

	//$: console.log('data changed: ', data);

	run(() => {
		onQuestComplete(data.quests);
	});
	run(() => {
		animateSlot1, animateSlot2, animateSlot3;
	});
	run(() => {
		if (banLimitErrorVisible === true)
			setTimeout(() => {
				banLimitErrorVisible = false;
			}, 5000);
	});
	run(() => {
		//quest1Store.updateCalculations();
		if (banLimitErrorVisible) toastStore.trigger(t);
	});
	run(() => {
		onFormSuccess(form);
	});
</script>

<div class="container h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center">
		<!-- Available Heroes Display -->
		<div id=#availableHeroesDisplay class="w-full max-w-[1200px] p-4 bg-surface-800/50 rounded-lg mb-8 border border-surface-700/50">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-bold text-primary-500">Available Hero Pool</h3>
				<div class="text-sm text-gray-400">
					{availableHeroCount} Heroes Available
				</div>
			</div>
			<div class="flex flex-wrap gap-1 justify-center">
				{#each $heroPoolStore.availableHeroes as hero}
				<div class={`object-contain m-2 relative`}>
					<div class="w-8 h-8 hover:scale-150  transition-transform">
						<div class=""><i class={`z-0 d2mh hero-${hero.id} scale-125`}></i></div>
					</div>
				</div>
				{/each}
			</div>
		</div>

		<!-- Quest Board and ban heroes -->
		<div id="questBoardContainer" class="flex w-full">
			<!-- Quest Board -->
			<div
				class="bg-questBoard 2xl:h-[700px] xl:h-[500px] md:h-[500px] bg-no-repeat bg-contain bg-center w-full flex justify-center items-center"
			>
				<div class="flex flex-col h-full justify-center items-center w-[70%]">
					<div class="w-full h-full grid grid-cols-3 mx-auto max-h-[75%]">
						{#key animateSlot1 || data}
							<div
								class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
							>
								<div class="m-4 h-4/5 w-3/4 my-auto p-4">
									{#if animateSlot1}
										<div class="w-full flex justify-center">
											<Confetti
												x={[-2, 2]}
												delay={[500, 2000]}
												size={10}
												duration={5000}
												amount={200}
												fallDistance="75vh"
											/>
										</div>
									{/if}
									<div class={'h-full ' + (animateSlot1 ? 'exploding' : '')}>
										<GenerateRandom {data} questSlot={1}></GenerateRandom>
									</div>
								</div>
							</div>
						{/key}
						{#key animateSlot2 || data}
							<div
								class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
							>
								<div class="m-4 h-4/5 w-3/4 my-auto p-4">
									{#if animateSlot2}
										<div class="w-full flex justify-center">
											<Confetti
												x={[-2, 2]}
												delay={[500, 2000]}
												size={10}
												duration={5000}
												amount={200}
												fallDistance="75vh"
											/>
										</div>
									{/if}

									<div class={'h-full ' + (animateSlot2 ? 'exploding' : '')}>
										<GenerateRandom {data} questSlot={2}></GenerateRandom>
									</div>

									<div class="box"></div>
								</div>
							</div>
						{/key}
						{#key animateSlot3 || data}
							<div
								class="bg-questBoardPoster bg-no-repeat bg-contain bg-center w-full h-full flex items-center justify-center"
							>
								<div class="m-4 h-4/5 w-3/4 my-auto p-4">
									{#if animateSlot3}
										<div class="w-full flex justify-center">
											<Confetti
												x={[-2, 2]}
												delay={[500, 2000]}
												size={10}
												duration={5000}
												amount={200}
												fallDistance="75vh"
											/>
										</div>
									{/if}

									<div class={'h-full ' + (animateSlot3 ? 'exploding' : '')}>
										<GenerateRandom {data} questSlot={3}></GenerateRandom>
									</div>
								</div>
							</div>
						{/key}
					</div>
					<!-- Action buttons for quest board -->
					<div class="flex flex-col justify-center items-center h-fit w-full">
						<button
							class="btn p-1 w-1/3 bg-primary-500/70"
							onclick={() => {
								showHeroGridModal?.();
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
