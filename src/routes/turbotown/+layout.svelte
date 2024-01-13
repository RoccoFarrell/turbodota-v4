<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut, expoIn, expoOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';

	import type { Item } from '@prisma/client';

	//helpers
	import { clickOutside } from '$lib/helpers/clickOutside.ts';

	//skeleton
	import { ProgressBar } from '@skeletonlabs/skeleton';

	//components
	import Inventory from './_components/Inventory.svelte';
	import TownLoginGate from './_components/TownLoginGate.svelte';

	export let data: LayoutData;

	//avatar
	let avatarURL = '';
	if (data.session && data.session.user.avatar_url) {
		avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');
	}

	if (browser) {
		console.log('data in town layout: ', data);
	}

	let showInventory = false;
	const collapse = () => {
		showInventory = !showInventory;
	};

	const onBlur = () => {
		//console.log('blurring');
		showInventory = false;
	};
</script>

<div id="#townLayout" class="w-full flex justify-center">
	{#if data.session && data.league && data.town && data.town.turbotown}
		<div class="fixed top-20 left-[256px] w-[calc(100vw-256px)] h-24">
			<div class="grid grid-cols-4 p-1 h-24">
				<div id="turbotownPageHeader" class="flex items-center justify-center border border-primary-500">
					<h1 class="h1 text-primary-700 max-md:font-bold text-center">Shop</h1>
				</div>
				<div class="col-span-2 border border-orange-500"></div>

				<div id="turbotownProfile" class="card rounded-xl grid grid-cols-4 py-1 px-2 shadow-2xl">
					<div id="townProfileImage" class="flex flex-col justify-center items-center">
						{#if avatarURL}
							<img class="h-12 w-12 rounded-xl" src={avatarURL} alt="" />
						{:else}
							<i class="text-5xl fi fi-rr-mode-portrait"></i>
						{/if}
						<p class="dark:text-yellow-500">Level: 1</p>
					</div>
					<div id="townProfileStats" class="flex flex-col text-md justify-center col-span-3">
						<div class="flex justify-start space-x-2">
							<div>
								<i class="fi fi-rr-coins text-yellow-500 text-center"></i>
							</div>

							<p>{data.town.turbotown.metrics[0].value}</p>
						</div>

						<div class="flex justify-start space-x-2">
							<div>
								<i class="fi fi-br-arrow-trend-up text-center text-green-500"></i>
							</div>
							<p class="">
								{data.town.turbotown.metrics[0].value}
							</p>
						</div>

						<ProgressBar label="Progress Bar" value={50} max={100} />
					</div>
				</div>
				<!-- <i class="fi fi-sr-backpack text-8xl text-yellow-500"></i> -->
			</div>
		</div>
		<div class="mt-24 mb-16 p-4">
			<slot />
		</div>

		{#if !showInventory}
			<!-- <div 
		transition:slide={{ delay: 50, duration: 400, easing: quintOut, axis: 'y' }}
		class="fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 h-20"> -->
			<div
				transition:slide={{ delay: 50, duration: 200, easing: expoIn, axis: 'y' }}
				class="fixed bottom-0 left-[256px] w-[calc(100vw-256px)] h-16"
			>
				<div class="w-full h-full rounded-t-3xl bg-secondary-500 hover:bg-secondary-600">
					<button on:click={collapse} class="w-full h-full flex items-center justify-center space-x-4">
						<i class="fi fi-rs-backpack text-3xl"></i>
						<p>Inventory</p>
					</button>
				</div>
			</div>
		{/if}
		<!-- <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }} class={"fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 " + (showInventory ? "h-[500px]" : "h-10")}></div> -->
		{#if showInventory}
			<div
				transition:slide={{ delay: 50, duration: 400, easing: expoIn, axis: 'y' }}
				class={'fixed bottom-0 left-[256px] w-[calc(100vw-256px)] h-[500px]'}
				on:blur={onBlur}
				use:clickOutside
				on:click_outside={onBlur}
			>
				<div class="w-full h-16 rounded-t-3xl bg-secondary-500 hover:bg-secondary-600">
					<button on:click={collapse} class="w-full h-full flex items-center justify-center space-x-8"
						><i class="fi fi-br-angle-small-down text-3xl"></i>Close Inventory</button
					>
				</div>
				{#if showInventory}
					<div class="h-full" transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
						<Inventory items={data.town.items} />
					</div>
				{/if}
			</div>
		{/if}
	{:else}
		<TownLoginGate />
	{/if}
</div>
