<script lang="ts">
	import { run } from 'svelte/legacy';

  import SeasonHeaderCard from '../leagues/[slug]/seasons/[slug]/SeasonHeaderCard.svelte';

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	//types
	import type { PageData } from './$types';
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
	import SeasonLeaderboard from '../leagues/[slug]/seasons/[slug]/SeasonLeaderboard.svelte';
	import TurbotownIntro from '$lib/components/TurbotownIntro.svelte';

	
	interface Props {
		//data
		data: PageData;
		form: any;
	}

	let { data, form }: Props = $props();

	let training = $state(false);
	
	let progressVal = $state(0);
	
	let skillCount = $state(0);
	

	//calc leaderboard info for seasons panel
	let randomSeasonStats = {
		userPlace: -1
	};
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


	run(() => {
		console.log(form)
	});
	run(() => {
		if (form?.missing) {
			const t: ToastSettings = {
				message: `Enter at least one valid Dota User ID`,
				background: 'preset-filled-error-500'
			};

			showToast(`Enter at least one valid Dota User ID`, 'preset-filled-error-500');
		} else if (form?.success) {
			showToast(`League created!`, 'preset-filled-success-500');
		}
	});
</script>

<div class="container">
	<TurbotownIntro/>
	<!-- <div>
		<HeroGrid heroes={data.heroDescriptions.allHeroes}/>
	</div> -->
	<!-- <SeasonHeaderCard data={data}></SeasonHeaderCard> -->
	<!-- <div class="flex flex-col space-y-4 justify-center items-center">
		{#if data.league.currentSeason && data.league.currentSeason.turbotowns}
			<SeasonLeaderboard turbotowns={data.league.currentSeason.turbotowns} members={data.league.leagueAndSeasonsResult[0].members} randoms={data.league.currentSeason.randoms}/>
		{/if}
	</div> -->
</div>
