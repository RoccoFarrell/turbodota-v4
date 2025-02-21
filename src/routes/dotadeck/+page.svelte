<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { drawnHeroes } from '$lib/stores/drawnHeroesStore';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { Hero } from '@prisma/client';
	import type { PageData } from './$types';
	import { redirect } from '@sveltejs/kit';
	import DeckView from './_components/DeckView.svelte';
	import HeroSelectionAnimation from './_components/HeroSelectionAnimation.svelte';

	export let data: PageData;

	if (!data.seasonUser) {
		throw redirect(302, '/');
	}

	// Define extended hero type with game stats
	interface CardHero extends Hero {
		xp: number;
		gold: number;
		cardId?: string;
	}

	// Initialize hero pool with default values
	if (browser && data.heroDescriptions && data.seasonUser) {
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
	if (data.seasonUser.heroDraws) {
		data.seasonUser.heroDraws.forEach(draw => {
			const hero = data.heroDescriptions.find(h => h.id === draw.heroId);
			if (hero) {
				const cardHero: CardHero = {
					...hero,
					xp: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseXP ?? 100,
					gold: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseGold ?? 100,
					cardId: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.id
				};
				// Find first empty slot
				const emptySlot = hand.findIndex(h => h === null);
				if (emptySlot !== -1) {
					hand[emptySlot] = cardHero;
					drawnHeroes.update(set => {
						set.add(hero.id);
						return set;
					});
				}
			}
		});
	}

	let showingAnimation: boolean  = false;
	let selectedHero: CardHero | null = null;
	let currentHighlightId: number | null = null;
	let animationInterval: NodeJS.Timeout;
	let activeSlot: number | null = null;

	function startHeroAnimation(hero: CardHero, slotIndex: number) {
		showingAnimation = true;
		selectedHero = hero;
		activeSlot = slotIndex;
		let speed = 50;
		let iterations = 0;
		const maxIterations = 20;

		function animate() {
			animationInterval = setInterval(() => {
				const availableHeroes = $heroPoolStore.availableHeroes;
				currentHighlightId = availableHeroes[Math.floor(Math.random() * availableHeroes.length)].id;
				iterations++;

				if (iterations > maxIterations * 0.6) {
					speed = speed * 1.5;
					clearInterval(animationInterval);
					if (iterations >= maxIterations) {
						currentHighlightId = hero.id;
						showingAnimation = false;
						setTimeout(() => {
							currentHighlightId = null;
							if (activeSlot !== null) {
								completeDrawHero(activeSlot);
							}
						}, 300);
					} else {
						animate();
					}
				}
			}, speed);
		}

		animate();
	}

	onDestroy(() => {
		if (animationInterval) clearInterval(animationInterval);
	});

	function drawHero(slotIndex: number) {
		const hero = $heroPoolStore.availableHeroes[
			Math.floor(Math.random() * $heroPoolStore.availableHeroes.length)
		] as CardHero;

		if (hero) {
			startHeroAnimation(hero, slotIndex);
		}
	}

	function showError(message: string) {
		const toastStore = getToastStore();
		toastStore.trigger({
			message,
			background: 'variant-filled-error'
		});
	}

	async function completeDrawHero(slotIndex: number) {
		showingAnimation = false;
		if (selectedHero) {
			const hero = selectedHero;
			hand[slotIndex] = hero;
			drawnHeroes.update(set => {
				set.add(hero.id);
				return set;
			});
			hand = [...hand];
			
			// Save to DB
			if (hero.cardId) {
				console.log('Drawing hero:', hero.id);
				const response = await fetch(`/api/cards/${hero.cardId}/draw`, {
					method: 'POST',
					body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
				});
				const result = await response.json();
				
				// Record the hero draw and check for matches
				const drawResponse = await fetch('/api/matches/check', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ 
						seasonUserId: data.seasonUser!.id,
						heroId: hero.id
					})
				});

				console.log('Draw response:', await drawResponse.clone().text());
				const drawResult = await drawResponse.json();
				if (!drawResult.success) {
					showError(`Failed to save hero draw: ${drawResult.error}`);
				}

				if (!result.success) {
					// Revert the draw if it failed
					drawnHeroes.update(set => {
						set.delete(hero.id);
						return set;
					});
					hand[slotIndex] = null;
					hand = [...hand];
					showError('Failed to draw card');
				}
			} else {
				// Handle case where hero.cardId is not defined
				showError('Failed to draw card: Card ID not found');
				// Revert the draw
				drawnHeroes.update(set => {
					set.delete(hero.id);
					return set;
				});
				hand[slotIndex] = null;
				hand = [...hand];
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
					body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
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
		<DeckView 
			isAnimating={showingAnimation}
			selectedHeroId={selectedHero?.id ?? null}
			currentHighlightId={currentHighlightId}
		/>
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
					{#if showingAnimation && selectedHero && hero && currentHighlightId === hero.id}
						<div class="absolute inset-0 bg-surface-900/80">
							<HeroSelectionAnimation 
								heroes={$heroPoolStore.availableHeroes}
								finalHero={selectedHero}
								onComplete={() => completeDrawHero(i)}
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
