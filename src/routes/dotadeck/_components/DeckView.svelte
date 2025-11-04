<script lang="ts">
	import type { Hero } from '@prisma/client';
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { fade } from 'svelte/transition';
	import CardHistoryTooltip from './CardHistoryTooltip.svelte';
	import { createEventDispatcher } from 'svelte';

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

	const toastStore = getToastStore();
	const dispatch = createEventDispatcher<{
		selectHero: { heroId: number };
	}>();

	type SortType = 'alpha' | 'xp' | 'gold';
	let currentSort: SortType = $state('alpha');

	let filteredHeroes = $derived($heroPoolStore.allHeroes
		.sort((a, b) => {
			switch (currentSort) {
				case 'alpha':
					return a.localized_name.localeCompare(b.localized_name);
				case 'xp':
					return (b.xp ?? 0) - (a.xp ?? 0);
				case 'gold':
					return (b.gold ?? 0) - (a.gold ?? 0);
				default:
					return 0;
			}
		})
		.map((hero) => ({
			...hero,
			isFiltered: (!showRaisedXP || (hero.xp ?? 100) > 100) && (!showRaisedGold || (hero.gold ?? 100) > 100),
			isDrawn: hero.isHeld
		})) as FilteredGameHero[]);

	interface Props {
		isAnimating?: boolean;
		currentHighlightId?: number | null;
		selectedHeroId?: number | null;
	}

	let { isAnimating = false, currentHighlightId = null, selectedHeroId = $bindable(null) }: Props = $props();

	let heroes = $derived($heroPoolStore.allHeroes);

	let isHeroDisabled = $derived((heroId: number) => {
		return $heroPoolStore.allHeroes.find((h) => h.id === heroId)?.isHeld ?? false;
	});

	let hoveredHeroId: number | null = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

	async function refreshHeroPool() {
		try {
			const response = await fetch('/api/cards/active');
			const result = await response.json();
			if (result.success) {
				heroPoolStore.setAllHeroes(result.heroes);
				toastStore.trigger({
					message: 'Hero pool refreshed',
					background: 'variant-filled-success'
				});
			}
		} catch (error) {
			console.error('Error refreshing hero pool:', error);
			toastStore.trigger({
				message: 'Failed to refresh hero pool',
				background: 'variant-filled-error'
			});
		}
	}
</script>

<div class="p-4 w-full max-h-[80vh] overflow-auto">
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-lg font-bold text-primary-500">Deck View</h2>
		<div class="flex gap-4">

			<div class="flex flex-col gap-2">
				
				<div class="flex gap-2 justify-center align-middle">
					<span class="text-xs text-white-500 flex items-center">Sort:</span>
					<button
						class="btn btn-sm {currentSort === 'alpha' ? 'variant-filled-surface' : 'variant-soft-surface'}"
						onclick={() => currentSort = 'alpha'}
					>
						<i class="fi fi-rr-text-alt text-xs">Alphabetical</i>
					</button>
					<button
						class="btn btn-sm {currentSort === 'xp' ? 'variant-filled-primary' : 'variant-soft-primary'}"
						onclick={() => currentSort = 'xp'}
					>
						<span class="text-xs">XP</span>
					</button>
					<button
						class="btn btn-sm {currentSort === 'gold' ? 'variant-filled-warning' : 'variant-soft-warning'}"
						onclick={() => currentSort = 'gold'}
					>
						<span class="text-xs">Gold</span>
					</button>
				</div>
			</div>
			<div class="divider-vertical h-8"></div>
			<button 
			class="btn btn-sm bg-green-500 text-slate-900" 
			onclick={refreshHeroPool}
		>
			<i class="fi fi-rr-refresh mr-2"></i>
			Refresh
		</button>
			<!-- <button
				class="btn btn-sm {showRaisedXP ? 'variant-filled-primary' : 'variant-soft-primary'}"
				on:click={() => (showRaisedXP = !showRaisedXP)}
			>
				<span class="text-xs">Raised XP</span>
			</button>
			<button
				class="btn btn-sm {showRaisedGold ? 'variant-filled-warning' : 'variant-soft-warning'}"
				on:click={() => (showRaisedGold = !showRaisedGold)}
			>
				<span class="text-xs">Raised Gold</span>
			</button> -->
		</div>
	</div>
	<div class="flex flex-wrap gap-1 justify-center">
		{#each filteredHeroes as hero}
			<div
				class={`object-contain m-1 relative h-16 w-16 border-lime-700 border-2 rounded-lg
					${!hero.isFiltered ? 'opacity-10 cursor-not-allowed' : ''}
					${hero.isDrawn ? 'opacity-10 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
					${currentHighlightId === hero.id ? 'border-4 border-primary-500' : ''}
					${selectedHeroId === hero.id ? 'ring-4 ring-amber-500' : ''}
					${isHeroDisabled(hero.id) ? 'opacity-10' : ''}`}
				role="button"
				tabindex="0"
				onmouseenter={(e) => {
					hoveredHeroId = hero.id;
					mouseX = e.clientX;
					mouseY = e.clientY;
				}}
				onmouseleave={() => (hoveredHeroId = null)}
				onclick={() => {
					selectedHeroId = selectedHeroId === hero.id ? null : hero.id;
					if (selectedHeroId !== null) {
						dispatch('selectHero', { heroId: selectedHeroId });
					}
				}}
				onkeypress={(e) => {
					if (e.key === 'Enter') {
						selectedHeroId = selectedHeroId === hero.id ? null : hero.id;
						if (selectedHeroId !== null) {
							dispatch('selectHero', { heroId: selectedHeroId });
						}
					}
				}}
			>
				<div
					class="w-8 h-8 transition-all duration-200 relative mx-auto mt-2"
					class:scale-150={currentHighlightId === hero.id && isAnimating}
				>
					<div class="relative">
						<i class={`d2mh hero-${hero.id} scale-150`}></i>
					</div>
				</div>
				<div
					class="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-blue-500 border border-blue-400 flex items-center justify-center"
				>
					<span class="text-[10px] font-bold text-black">{hero.xp}</span>
				</div>
				<div
					class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 border border-yellow-400 flex items-center justify-center"
				>
					<span class="text-[10px] font-bold text-black">{hero.gold}</span>
				</div>
				{#if currentHighlightId === hero.id && isAnimating}
					<div class="absolute inset-0 border-4 border-[#39FF14] rounded-lg animate-pulse shadow-[0_0_10px_#39FF14]" 
						transition:fade={{ duration: 100 }}
					></div>
				{:else if currentHighlightId === hero.id && !isAnimating}
					<div
						class="absolute -inset-12 flex items-center justify-center pointer-events-none"
						in:fade={{ duration: 300, delay: 200 }}
					>
						<div class="w-[calc(100%+4rem)] h-[calc(100%+4rem)] border-4 border-amber-400/80 rounded-xl
							bg-gradient-to-r from-amber-400/5 via-amber-400/10 to-amber-400/5
							shadow-[0_0_60px_30px_#FFD700,0_0_100px_60px_#FFD700/50] 
							after:absolute after:inset-0 after:rounded-xl
							after:shadow-[inset_0_0_40px_#FFD700] 
							after:animate-pulse after:animate-duration-[2s]"
						></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

{#if hoveredHeroId}
	<CardHistoryTooltip heroId={hoveredHeroId} x={mouseX} y={mouseY} />
{/if}
