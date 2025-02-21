<script lang="ts">
	import type { Hero } from '@prisma/client';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { drawnHeroes } from '$lib/stores/drawnHeroesStore';
	import { fade } from 'svelte/transition';

	interface GameHero extends Hero {
		xp: number;
		gold: number;
	}

	interface FilteredGameHero extends GameHero {
		isFiltered: boolean;
		isDrawn: boolean;
	}

	let minXp = 0;
	let maxXp = 1000;
	let minGold = 0;
	let maxGold = 1000;

	$: filteredHeroes = $heroPoolStore.availableHeroes.map((hero) => ({
		...(hero as GameHero),
		isFiltered:
			(hero as GameHero).xp >= minXp &&
			(hero as GameHero).xp <= maxXp &&
			(hero as GameHero).gold >= minGold &&
			(hero as GameHero).gold <= maxGold,
		isDrawn: $drawnHeroes.has(hero.id)
	})) as FilteredGameHero[];

	console.log(filteredHeroes);

	export let isAnimating: boolean = false;
	export let selectedHeroId: number | null = null;
	export let currentHighlightId: number | null = null;
</script>

<div class="p-4 w-full max-h-[80vh] overflow-auto">
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-lg font-bold text-primary-500">Deck View</h2>
		<div class="flex gap-2">
			<div class="flex flex-col">
				<label for="minXp" class="text-sm text-gray-400">XP Range</label>
				<div class="flex gap-2">
					<input id="minXp" type="number" bind:value={minXp} class="w-16 px-1 py-0.5 rounded text-sm" />
					<input id="maxXp" type="number" bind:value={maxXp} class="w-16 px-1 py-0.5 rounded text-sm" />
				</div>
			</div>
			<div class="flex flex-col">
				<label for="minGold" class="text-sm text-gray-400">Gold Range</label>
				<div class="flex gap-2">
					<input id="minGold" type="number" bind:value={minGold} class="w-16 px-1 py-0.5 rounded text-sm" />
					<input id="maxGold" type="number" bind:value={maxGold} class="w-16 px-1 py-0.5 rounded text-sm" />
				</div>
			</div>
		</div>
	</div>
	<div class="flex flex-wrap gap-1 justify-center">
		{#each filteredHeroes as hero}
			<div
				class={`object-contain m-1 relative h-16 w-16 border-amber-500 border-2 rounded-lg
					${!hero.isFiltered ? 'opacity-30' : ''}
					${hero.isDrawn ? 'opacity-20 brightness-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
					${currentHighlightId === hero.id ? 'border-4 border-primary-500' : ''}`}
			>
				<div class="w-8 h-8 transition-all duration-200 relative mx-auto mt-2"
					class:scale-150={currentHighlightId === hero.id && isAnimating}
				>
					<div class="relative h-fit">
						<i class={`z-0 d2mh hero-${hero.id} scale-125`}></i>
					</div>
				</div>
				<div class="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-blue-500 border border-blue-400 flex items-center justify-center">
					<span class="text-[10px] font-bold text-black">{hero.xp}</span>
				</div>
				<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 border border-yellow-400 flex items-center justify-center">
					<span class="text-[10px] font-bold text-black">{hero.gold}</span>
				</div>
				{#if currentHighlightId === hero.id && isAnimating}
					<div 
						class="absolute inset-0 border-4 border-[#39FF14] rounded-lg animate-pulse shadow-[0_0_10px_#39FF14]"
					/>
				{:else if currentHighlightId === hero.id && !isAnimating}
					<div 
						class="absolute inset-0 border-4 border-[#39FF14] rounded-lg shadow-[0_0_10px_#39FF14]"
						transition:fade={{ duration: 200 }}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div> 