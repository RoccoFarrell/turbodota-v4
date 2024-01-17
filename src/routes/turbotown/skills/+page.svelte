<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	//types
	import type { PageData } from './$types';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	//day js
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//skeleton
	import { getModalStore } from '@skeletonlabs/skeleton';
	const modalStore = getModalStore();

	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//images
	import town_logo_light from '$lib/assets/turbotown_light.png';
	import town_logo_dark from '$lib/assets/turbotown_dark.png';
	import TournamentLight from '$lib/assets/tournament_light.png';

	//components
	import { Avatar, ProgressBar } from '@skeletonlabs/skeleton';
	import HeroGrid from '$lib/components/HeroGrid/HeroGrid.svelte';

	//data
	export let data: PageData;
	export let form;

	$: training = false;
	$: progressVal = 0;
	$: skillCount = 0;

	onMount(() => {
		if (data.skills.count) skillCount = parseInt(data.skills.count);
	});

	$: if (browser) {
		if (skillCount % 5 === 0) {
			localStorage.setItem('skillCount', skillCount.toString());
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

	let interval: ReturnType<typeof setInterval>;
	function trainSkill() {
		training = !training;
		console.log(training);
		if (training) {
			interval = setInterval(() => {
				progressVal += 10;
				if (progressVal > 100) {
					progressVal = 0;
					skillCount += 1;
				}
			}, 100);
		} else {
			progressVal = 0;
			clearInterval(interval);
		}
	}

	//modal
	const modal: ModalSettings = {
		type: 'component',
		component: 'heroGrid'
	};
	//modalStore.trigger(modal);

	$: console.log(form)
	$: if (form?.missing) {
		const t: ToastSettings = {
			message: `Enter at least one valid Dota User ID`,
			background: 'variant-filled-error'
		};

		toastStore.trigger(t);
	} else if (form?.success) {
		const t: ToastSettings = {
			message: `League created!`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);
	}
</script>

<div class="container">
	<!-- <div>
		<HeroGrid heroes={data.heroDescriptions.allHeroes}/>
	</div> -->
	<!-- Header Card -->
	<div
		class="md:grid md:grid-cols-3 max-sm:flex max-sm:flex-col max-sm:space-y-2 justify-around items-center w-full card p-1"
	>
		<div class="flex flex-col space-x-4 md:border-r border-dashed border-primary-500/50">
			<h2 class="h2 text-primary-500 max-md:font-bold p-2 text-center">Turbotown</h2>
			<h4 class="h4 text-center italic">The Quest to Become King is back</h4>
			<div class="flex justify-around items-center">
				<!-- <a href="/random/leaderboard"><button class="btn variant-ghost-primary">Leaderboard</button></a> -->

				<!-- {#if data.session && data.session.user}
					<div class="text-xs">
						Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
					</div>
				{/if} -->
			</div>
		</div>

		<!-- current season info -->
		{#if data.session && data.session.user && data.league.leagueAndSeasonsResult && data.league.leagueAndSeasonsResult[0] && data.league.leagueAndSeasonsResult[0].seasons.length > 0}
			<div class="flex flex-col w-full justify-center col-span-2 p-2">
				<div class="w-full grid grid-cols-2 p-1">
					<div class="text-sm text-tertiary-500">
						<p class="text-xs inline">current league:</p>
						<a class="link" href={`/leagues/${data.league.leagueAndSeasonsResult[0].id}`}>
							<p class="font-bold inline text-primary-400 text-md hover:text-primary-600 hover:underline">
								{data.league.leagueAndSeasonsResult[0].name}
							</p>
						</a>
					</div>
					<div class="text-sm text-tertiary-500">
						<p class="text-xs inline">current random season:</p>
						<a
							class="link"
							href={`/leagues/${data.league.leagueAndSeasonsResult[0].id}/seasons/${data.league.leagueAndSeasonsResult[0].seasons[0].id}`}
						>
							<p class="font-bold inline text-primary-400 text-md hover:text-primary-600 hover:underline">
								{data.league.leagueAndSeasonsResult[0].seasons[0].name}
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
								<p>of {data.league.currentSeasonLeaderboard.length}</p>
							</div>
						</div>
					</div>
					<div class="flex flex-col items-center justify-center space-y-1">
						<div>
							Season Start: <p class="text-green-300">
								{dayjs(data.league.leagueAndSeasonsResult[0].seasons[0].startDate).format('llll')}
							</p>
						</div>
						<div>
							Season End: <p class="text-red-300">
								{dayjs(data.league.leagueAndSeasonsResult[0].seasons[0].endDate).format('llll')}
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
	<!-- <button
		class="btn variant-filled"
		on:click={() => {
			modalStore.trigger(modal);
		}}>Modal</button
	> -->
	<div class="flex flex-col space-y-4 justify-center items-center">
		<div class="flex flex-col md:flex-row items-center text-center w-full justify-center">
			<h1 class="h1">ONLY THE BEST CAN BECOME MAYOR OF</h1>
			<img class="block dark:hidden w-64" alt="TurboTownLight" src={town_logo_light} />
			<img class="hidden dark:block w-64" alt="TurboTownDark" src={town_logo_dark} />
		</div>
		<div class="flex flex-col space-y-8 justify-center w-3/4">
			<p class="text-lg text-primary-500 text-center italic">Training your last hitting...</p>
			<div class="text-secondary-500 text-center">
				Last Hitting Level: <p
					class="text-primary-500 text-2xl font-bold bg-surface-100 w-1/12 mx-auto rounded-full p-4"
				>
					{skillCount}
				</p>
			</div>
			<ProgressBar value={progressVal} class="text-primary-500 fill-primary-500" transition="transition-width" />
			<button class="btn variant-filled w-1/4 mx-auto" on:click={() => trainSkill()}>Train!</button>
		</div>
	</div>
</div>
