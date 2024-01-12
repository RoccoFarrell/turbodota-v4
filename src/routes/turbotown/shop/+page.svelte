<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import Shop from '$lib/components/Shop.svelte';
	import Inventory from '$lib/components/Inventory.svelte';

	//helpers
	import { clickOutside } from '$lib/helpers/clickOutside.ts';

	let showInventory = false;
	const collapse = () => {
		showInventory = !showInventory;
	};

	const onBlur = () => {
		console.log('blurring')
		showInventory = false;
	}
</script>

<div class="flex flex-col h-full">
	<Shop></Shop>
	<!-- <div class="relative w-full bg-primary-500">test</div> -->
	{#if !showInventory}
		<div 
		transition:slide={{ delay: 50, duration: 400, easing: quintOut, axis: 'y' }}
		class="fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 h-20">
			<div class="w-full h-full border border-orange-500 bg-primary-500">
				<button on:click={collapse} class="w-full h-full">Open me</button>
			</div>
		</div>
	{/if}
	<!-- <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }} class={"fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] bg-tertiary-900 " + (showInventory ? "h-[500px]" : "h-10")}></div> -->
	{#if showInventory}
		<div
			transition:slide={{ delay: 50, duration: 400, easing: quintOut, axis: 'y' }}
			class={'fixed bottom-0 border border-red-500 w-[calc(100vw-256px)] h-[500px]'}
			on:blur={onBlur}
			use:clickOutside on:click_outside={onBlur}
		>
			<div class="w-full h-10 border border-orange-500 bg-primary-500">
				<button on:click={collapse} class="w-full h-full">Close Me</button>
			</div>
			{#if showInventory}
				<div class="h-full" transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
					<Inventory />
				</div>
			{/if}
		</div>
	{/if}
</div>
