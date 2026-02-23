<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// ModalSettings type (not exported from Skeleton v3)
	type ModalSettings = {
		type?: string;
		title?: string;
		body?: string;
		component?: any;
		meta?: any;
		response?: (r: any) => void;
	};

	//day js
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
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

	//images
	import town_logo_light from '$lib/assets/turbotown_light.png';
	import town_logo_dark from '$lib/assets/turbotown_dark.png';
	import TournamentLight from '$lib/assets/tournament_light.png';

	//components
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import SeasonLeaderboard from './SeasonLeaderboard.svelte';

	
	interface Props {
		//data
		data: any;
	}

	let { data }: Props = $props();
	run(() => {
		console.log('data in seasonheaderCard: ', data)
	});

	let training = $state(false);
	
	let progressVal = $state(0);
	
	let skillCount = $state(0);
	

	//calc leaderboard info for seasons panel
	let randomSeasonStats = $state({
		userPlace: -1
	});
	if (data.session && data.user && data.league.currentSeasonLeaderboard) {
		randomSeasonStats = {
			userPlace:
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore: Unreachable code error
				data.league.currentSeasonLeaderboard.findIndex((item: any) => item.player === data.user.account_id) + 1
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


</script>

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
		{#if data.user && data.league.leagueAndSeasonsResult && data.league.leagueAndSeasonsResult[0] && data.league?.leagueAndSeasonsResult[0]?.seasons?.length > 0}
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
								<!-- <p>of {data.league.currentSeasonLeaderboard.length}</p> -->
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
						<a href={`/leagues/${data.league.leagueID}/seasons/${data.league.seasonID}`}><button class="btn preset-tonal-primary border border-primary-500">Leaderboard</button></a>
					</div>
				</div>
			</div>
		{:else}
			<div class="w-full p-4 italic flex items-center justify-center">Couldn't get league or season info</div>
		{/if}
	</div>

