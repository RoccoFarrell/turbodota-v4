<script lang="ts">
	import { browser } from '$app/environment';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { drawnHeroes } from '$lib/stores/drawnHeroesStore';
	import type { Hero } from '@prisma/client';
	import type { PageData } from './$types';
	import DeckView from './_components/DeckView.svelte';

	export let data: PageData;

	// Define extended hero type with game stats
	interface CardHero extends Hero {
		xp: number;
		gold: number;
		cardId?: string;
	}

	// Initialize hero pool with default values
	if (browser) {
		const heroesWithStats: CardHero[] = data.heroDescriptions.map((hero: Hero) => ({
			...hero,
			xp: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseXP ?? 100,
			gold: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseGold ?? 100,
			cardId: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.id
		}));
		heroPoolStore.setAllHeroes(heroesWithStats);
	}

	// Hand management
	let hand: (CardHero | null)[] = Array(data.seasonUser.handSize).fill(null);

	async function drawHero(slotIndex: number) {
        console.log("Drawing card")

		const hero = $heroPoolStore.availableHeroes[
			Math.floor(Math.random() * $heroPoolStore.availableHeroes.length)
		] as CardHero;

        console.log("Hero: ", hero)
		if (hero) {
			hand[slotIndex] = hero;
			drawnHeroes.update(set => {
				set.add(hero.id);
				return set;
			});
			hand = [...hand];
			// Save to DB
			if (hero.cardId) {
                
				const response = await fetch(`/api/cards/${hero.cardId}/draw`, {
					method: 'POST',
					body: JSON.stringify({ seasonUserId: data.seasonUser.id })
				});
				const result = await response.json();
				if (!result.success) {
					// Revert the draw if it failed
					drawnHeroes.update(set => {
						set.delete(hero.id);
						return set;
					});
					hand[slotIndex] = null;
					hand = [...hand];
				}
			}
		}
	}

	async function discardHero(slotIndex: number) {
		const hero = hand[slotIndex];
		if (hero) {
			const oldHero = hero;
			drawnHeroes.update(set => {
				set.delete(hero.id);
				return set;
			});
			hand[slotIndex] = null;
			hand = [...hand];
			// Save to DB
			if (hero.cardId) {
				const response = await fetch(`/api/cards/${hero.cardId}/discard`, {
					method: 'POST',
					body: JSON.stringify({ seasonUserId: data.seasonUser.id })
				});
				const result = await response.json();
				if (!result.success) {
					// Revert the discard if it failed
					drawnHeroes.update(set => {
						set.add(oldHero.id);
						return set;
					});
					hand[slotIndex] = oldHero;
					hand = [...hand];
				}
			}
		}
	}
</script>

<div class="container mx-auto p-4 flex flex-col gap-8">
	<!-- Deck View -->
	<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50">
		<DeckView />
	</div>

	<!-- Hand -->
	<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50 p-4">
		<h2 class="text-lg font-bold text-primary-500 mb-4">Hand</h2>
		<div class="flex justify-center gap-4">
			{#each hand as hero, i}
				<div class="relative w-32 h-48 bg-surface-700/50 rounded-lg border-2 border-surface-600/50 shadow-xl hover:shadow-2xl transition-all duration-200">
					{#if hero}
						<div class="absolute top-2 left-2">
							<i class={`d2mh hero-${hero.id} scale-150`}></i>
						</div>
						<div class="absolute top-2 right-2 text-sm font-bold">
							<div class="text-yellow-400">{hero.gold}g</div>
							<div class="text-blue-400">{hero.xp}xp</div>
						</div>
						<div class="absolute bottom-2 w-full flex justify-center">
							<button 
								class="btn btn-sm variant-soft-error" 
								on:click={() => discardHero(i)}
							>
								Discard
							</button>
						</div>
					{:else}
						<div class="w-full h-full flex items-center justify-center">
							<button 
								class="btn variant-filled-primary" 
								on:click={() => drawHero(i)}
							> 
								Draw 
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
