<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut, expoIn, expoOut } from 'svelte/easing';
	import type { PageData } from './$types';
	import Inventory from '$lib/components/Inventory.svelte';
	import type { Item } from '@prisma/client';

	//helpers
	import { clickOutside } from '$lib/helpers/clickOutside.ts';

	export let data: PageData;

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
	<slot />
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
					<Inventory items={data.items} />
				</div>
			{/if}
		</div>
	{/if}
</div>
