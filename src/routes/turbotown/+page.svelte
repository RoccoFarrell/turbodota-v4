<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	//types
	import type { PageData } from './$types';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	//skeleton
	import { getModalStore } from '@skeletonlabs/skeleton';
	const modalStore = getModalStore();

	//images
	import town_logo_light from '$lib/assets/turbotown_light.png';
	import town_logo_dark from '$lib/assets/turbotown_dark.png';

	//components
	import { Avatar, ProgressBar } from '@skeletonlabs/skeleton';
	import HeroGrid from '$lib/components/HeroGrid/HeroGrid.svelte';

	//data
	export let data: PageData;

	console.log(data);

	$: training = false;
	$: progressVal = 0;
	$: skillCount = 0;

	onMount(() => {
		if (data.skillCount) skillCount = parseInt(data.skillCount);
	});

	$: if (browser) {
		if (skillCount % 5 === 0) {
			localStorage.setItem('skillCount', skillCount.toString());
		}
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
	modalStore.trigger(modal);
</script>

<div class="container p-4">
	<!-- <div>
		<HeroGrid heroes={data.heroDescriptions.allHeroes}/>
	</div> -->
	<button class="btn variant-filled" on:click={() => { modalStore.trigger(modal)}}>Modal</button>
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
