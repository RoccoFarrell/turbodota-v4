<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		heroes?: any[];
		finalHero: any;
		onComplete: () => void;
	}

	let { heroes = [], finalHero, onComplete }: Props = $props();

	let currentIndex = $state(0);
	let isAnimating = $state(true);
	let interval: NodeJS.Timeout;
	let speed = 100; // Starting speed in ms
	let iterations = 0;
	const maxIterations = 30;

	function animate() {
		interval = setInterval(() => {
			currentIndex = Math.floor(Math.random() * heroes.length);
			iterations++;

			// Gradually slow down
			if (iterations > maxIterations / 2) {
				speed = speed * 1.2;
				clearInterval(interval);
				if (iterations >= maxIterations) {
					// Final selection
					currentIndex = heroes.findIndex(h => h.id === finalHero.id);
					isAnimating = false;
					setTimeout(onComplete, 1000);
				} else {
					animate();
				}
			}
		}, speed);
	}

	// Start animation on mount
	animate();

	// Cleanup on destroy
	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="grid grid-cols-10 gap-2 p-4">
	{#each heroes as hero, i}
		<div 
			class="relative aspect-square flex items-center justify-center"
			class:highlight={currentIndex === i}
		>
			<i class="d2mh hero-{hero.id} scale-150"></i>
			{#if currentIndex === i && !isAnimating}
				<div 
					class="absolute inset-0 border-4 border-success-500 rounded-lg"
					transition:fade={{ duration: 200 }}
				></div>
			{:else if currentIndex === i}
				<div 
					class="absolute inset-0 border-4 border-primary-500 rounded-lg animate-pulse"
				></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.highlight {
		z-index: 10;
	}
</style> 