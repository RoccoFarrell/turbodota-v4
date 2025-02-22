<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { drawnHeroes } from '$lib/stores/drawnHeroesStore';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { Hero } from '@prisma/client';
	import type { PageData } from './$types';
	import { redirect } from '@sveltejs/kit';
	import DeckView from './_components/DeckView.svelte';
	import HeroSelectionAnimation from './_components/HeroSelectionAnimation.svelte';
	import StatBoostModal from './_components/StatBoostModal.svelte';

	const toastStore = getToastStore();

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

	// Define match check result type
	interface MatchCheckResult {
		heroId: number;
		matchFound: boolean;
		latestMatch: { heroId: number; timestamp: Date } | null;
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
		// Only use active (non-discarded) draws
		const activeDraws = data.seasonUser.heroDraws.filter(draw => !draw.matchResult);
		activeDraws.forEach(draw => {
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
	let updatedCardStats: { heroId: number, gold: number, xp: number } | null = null;
	let showStatBoost = false;
	let statBoostData: { heroId: number; oldStats: { gold: number; xp: number }; newStats: { gold: number; xp: number } } | null = null;
	let isCheckingWins = false;

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
		const oldHero = hand[slotIndex];
		if (oldHero) {
			try {
				const response = await fetch(`/api/cards/${oldHero.cardId}/discard`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
				});
				const result = await response.json();
				
				if (!result.success) {
					showError(`Failed to discard card: ${result.error}`);
					return;
				}

				// Show stat boost modal
				statBoostData = {
					heroId: oldHero.id,
					oldStats: { gold: oldHero.gold, xp: oldHero.xp },
					newStats: { gold: result.card.baseGold, xp: result.card.baseXP }
				};
				showStatBoost = true;
				setTimeout(() => {
					showStatBoost = false;
					statBoostData = null;
				}, 2000);

				// Update hero stats in store
				const updatedHeroes = $heroPoolStore.allHeroes.map(h => {
					if (h.id === oldHero.id) {
						return { ...h, gold: (h as CardHero).gold + 20, xp: (h as CardHero).xp + 20 } as CardHero;
					}
					return h;
				});
				heroPoolStore.setAllHeroes(updatedHeroes);

				// Remove from hand
				drawnHeroes.update(set => {
					set.delete(oldHero.id);
					return set;
				});
				hand[slotIndex] = null;
				hand = [...hand];
			} catch (error) {
				showError('Failed to discard card: Network error');
				console.error('Discard error:', error);
			}
		}
	}

	async function checkForWins() {
		isCheckingWins = true;
		try {
			// Get all hero IDs from hand
			const heroIds = hand.filter(Boolean).map(h => h!.id);
			
			if (heroIds.length === 0) {
				toastStore.trigger({
					message: 'No heroes in hand to check',
					background: 'variant-filled-warning'
				});
				return;
			}
			
			// Check all heroes at once
			const response = await fetch('/api/matches/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					seasonUserId: data.seasonUser!.id,
					heroIds
				})
			});
			
			const { success, results } = await response.json();
			
			if (success) {
				// Build summary message
				const winsFound = results.filter((r: MatchCheckResult) => r.matchFound);
				const noMatches = results.filter((r: MatchCheckResult) => !r.matchFound);
				
				let message = '';
				
				// Add latest match info
				if (results.length > 0 && results[0].latestMatchInfo) {
					const hero = $heroPoolStore.allHeroes.find(h => h.id === results[0].latestMatchInfo.heroId);
					message += `Latest match: ${hero?.localized_name} at ${results[0].latestMatchInfo.timestamp.toLocaleString()}\n\n`;
				}
				
				// Add wins summary
				if (winsFound.length > 0) {
					const winHeroes = winsFound.map((r: MatchCheckResult) => {
						const hero = hand.find(h => h?.id === r.heroId);
						return hero?.localized_name;
					}).join(', ');
					message += `Found wins with: ${winHeroes}\n`;
				}
				
				// Add no matches summary
				if (noMatches.length > 0) {
					const pendingHeroes = noMatches.map((r: MatchCheckResult) => {
						const hero = hand.find(h => h?.id === r.heroId);
						return hero?.localized_name;
					}).join(', ');
					message += `No matches found for: ${pendingHeroes}`;
				}

				toastStore.trigger({
					message,
					background: winsFound.length > 0 ? 'variant-filled-success' : 'variant-filled-warning'
				});

				// Process wins
				winsFound.forEach((result: MatchCheckResult) => {
					const hero = hand.find(h => h?.id === result.heroId);
					if (!hero) return;
					
					// Update hero stats and remove from hand
					const updatedHeroes = $heroPoolStore.allHeroes.map(h => {
						if (h.id === hero.id) {
							return { ...h, gold: (h as CardHero).gold + 20, xp: (h as CardHero).xp + 20 } as CardHero;
						}
						return h;
					});
					heroPoolStore.setAllHeroes(updatedHeroes);
					
					const index = hand.findIndex(h => h?.id === hero.id);
					if (index !== -1) {
						drawnHeroes.update(set => {
							set.delete(hero.id);
							return set;
						});
						hand[index] = null;
						hand = [...hand];
					}
				});
			}
		} catch (error) {
			console.error('Error checking wins:', error);
			toastStore.trigger({
				message: 'Failed to check for wins',
				background: 'variant-filled-error'
			});
		} finally {
			isCheckingWins = false;
		}
	}
</script>

<div class="container mx-auto p-4 flex flex-col gap-8">
	<!-- Action Bar -->
	<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50 p-4">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-bold text-primary-500">Actions</h2>
			<div class="flex gap-4">
				<button 
					class="btn variant-filled-primary"
					on:click={checkForWins}
					disabled={isCheckingWins}
				>
					{#if isCheckingWins}
						<i class="fa fa-spinner fa-spin mr-2"></i>
						Checking Wins...
					{:else}
						<i class="fa fa-refresh mr-2"></i>
						Check for Wins
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Deck View -->
	<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50">
		<DeckView 
			isAnimating={showingAnimation}
			selectedHeroId={selectedHero?.id ?? null}
			currentHighlightId={currentHighlightId}
			updatedStats={updatedCardStats}
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

{#if showStatBoost && statBoostData}
	<StatBoostModal {...statBoostData} />
{/if}
