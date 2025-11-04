<script lang="ts">
	import { run } from 'svelte/legacy';

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

	run(() => {
		console.log(form)
	});
	run(() => {
		if (form?.missing) {
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
