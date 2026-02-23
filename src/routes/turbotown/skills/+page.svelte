<script lang="ts">
	import { run } from 'svelte/legacy';

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
	// Progress component import
	import { Progress } from '@skeletonlabs/skeleton-svelte';

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

	
	interface Props {
		//data
		data: PageData;
		form: any;
	}

	let { data, form }: Props = $props();

	let training = $state(false);
	
	let progressVal = $state(0);
	
	let skillCount = $state(0);
	

	onMount(() => {
		if (data.skills.count) skillCount = parseInt(data.skills.count);
	});

	run(() => {
		if (browser) {
			if (skillCount % 5 === 0) {
				localStorage.setItem('skillCount', skillCount.toString());
			}
		}
	});

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
	<!-- <div>
		<HeroGrid heroes={data.heroDescriptions.allHeroes}/>
	</div> -->

	<!-- <button
		class="btn variant-filled"
		on:click={() => {
			showHeroGridModal?.();
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
			<Progress value={progressVal} />
			<button class="btn preset-filled w-1/4 mx-auto" onclick={() => trainSkill()}>Train!</button>
		</div>
	</div>
</div>
