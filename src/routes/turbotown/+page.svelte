<script lang="ts">
  import SeasonHeaderCard from '../leagues/[slug]/seasons/[slug]/SeasonHeaderCard.svelte';

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
	import SeasonLeaderboard from '../leagues/[slug]/seasons/[slug]/SeasonLeaderboard.svelte';

	//data
	export let data: PageData;
	export let form;

	$: training = false;
	$: progressVal = 0;
	$: skillCount = 0;

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
	<SeasonHeaderCard data={data}></SeasonHeaderCard>
	<!-- <button
		class="btn variant-filled"
		on:click={() => {
			modalStore.trigger(modal);
		}}>Modal</button
	> -->
	<div class="flex flex-col space-y-4 justify-center items-center">
		{#if data.league.currentSeason && data.league.currentSeason.turbotowns}
			<SeasonLeaderboard turbotowns={data.league.currentSeason.turbotowns} members={data.league.leagueAndSeasonsResult[0].members} randoms={data.league.currentSeason.randoms}/>
		{/if}
	</div>
</div>
