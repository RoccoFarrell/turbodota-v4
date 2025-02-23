<script lang="ts">
	import type { Hero } from '@prisma/client';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { fade } from 'svelte/transition';
	import CardHistoryTooltip from './CardHistoryTooltip.svelte';

	interface GameHero extends Hero {
		xp: number;
		gold: number;
	}

	interface FilteredGameHero extends GameHero {
		isFiltered: boolean;
		isDrawn: boolean;
	}

	let showRaisedXP = false;
	let showRaisedGold = false;

	$: filteredHeroes = $heroPoolStore.allHeroes
	.sort((a, b) => {
		if(a.localized_name < b.localized_name) return -1;
		else if(a.localized_name > b.localized_name) return 1;
		else return 0;
	})
	.map((hero) => ({
		...hero,
		isFiltered:
			(!showRaisedXP || (hero.xp ?? 100) > 100) &&
			(!showRaisedGold || (hero.gold ?? 100) > 100),
		isDrawn: hero.isHeld
	})) as FilteredGameHero[];

	export let isAnimating: boolean = false;
	export let currentHighlightId: number | null = null;

	$: heroes = $heroPoolStore.allHeroes;

	$: isHeroDisabled = (heroId: number) => {
		return $heroPoolStore.allHeroes.find(h => h.id === heroId)?.isHeld ?? false;
	};

	let hoveredHeroId: number | null = null;
	let mouseX = 0;
	let mouseY = 0;
</script>

<div class="p-4 w-full max-h-[80vh] overflow-auto">
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-lg font-bold text-primary-500">Deck View</h2>
		<div class="flex gap-4">
			<button 
				class="btn btn-sm {showRaisedXP ? 'variant-filled-primary' : 'variant-soft-primary'}"
				on:click={() => showRaisedXP = !showRaisedXP}
			>
				<span class="text-xs">Raised XP</span>
			</button>
			<button 
				class="btn btn-sm {showRaisedGold ? 'variant-filled-warning' : 'variant-soft-warning'}"
				on:click={() => showRaisedGold = !showRaisedGold}
			>
				<span class="text-xs">Raised Gold</span>
			</button>
		</div>
	</div>
	<div class="flex flex-wrap gap-1 justify-center">
		{#each filteredHeroes as hero}
			<div
				class={`object-contain m-1 relative h-16 w-16 border-lime-700 border-2 rounded-lg
					${!hero.isFiltered ? 'opacity-10 cursor-not-allowed' : ''}
					${hero.isDrawn ? 'opacity-10 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
					${currentHighlightId === hero.id ? 'border-4 border-primary-500' : ''}
					${isHeroDisabled(hero.id) ? 'opacity-10' : ''}`}
				on:mouseenter={(e) => {
					hoveredHeroId = hero.id;
					mouseX = e.clientX;
					mouseY = e.clientY;
				}}
				on:mouseleave={() => hoveredHeroId = null}
			>
				<div class="w-8 h-8 transition-all duration-200 relative mx-auto mt-2"
					class:scale-150={currentHighlightId === hero.id && isAnimating}
				>
					<div class="relative">
						<i class={`d2mh hero-${hero.id} scale-150`}></i>
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

{#if hoveredHeroId}
	<CardHistoryTooltip 
		heroId={hoveredHeroId}
		x={mouseX}
		y={mouseY}
	/>
{/if} 