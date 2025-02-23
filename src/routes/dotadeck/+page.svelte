<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import type { Hero } from '@prisma/client';
	import type { PageData } from './$types';
	import { redirect } from '@sveltejs/kit';
	import { DOTADECK } from '$lib/constants/dotadeck';
	import DeckView from './_components/DeckView.svelte';
	import HeroSelectionAnimation from './_components/HeroSelectionAnimation.svelte';
	import StatBoostModal from './_components/StatBoostModal.svelte';
	import StatUpdateAnimation from './_components/StatUpdateAnimation.svelte';
	import LeaderboardModal from './_components/LeaderboardModal.svelte';
	import RulesModal from './_components/RulesModal.svelte';
	import HistoryModal from './_components/HistoryModal.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';
	import type { StatBoostData } from '$lib/types/dotadeck';
	import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
	import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	export let data: PageData;

	if (!data.seasonUser) {
		console.error("No season user found for logged in user: ", data.user);
		throw redirect(302, '/');
	}

	let isCheckingWins = false;
	let autoCheckEnabled = true;  // Default to enabled
	let visibilityHandler: () => Promise<void>;

	// Setup visibility change handler in onMount
	onMount(() => {
		let checkTimeout: NodeJS.Timeout;
		
		visibilityHandler = async () => {
			if (!isCheckingWins && autoCheckEnabled) {
				console.log('Checking for wins...');
				// Clear any pending timeout
				if (checkTimeout) clearTimeout(checkTimeout);
				
				// Set a small delay to debounce multiple events
				checkTimeout = setTimeout(() => {
					const activeHeroes = hand.filter(h => h !== null).map(h => h!.id);
					console.log('Active heroes:', activeHeroes);
					if (activeHeroes.length > 0) {
						checkForWins();
					}
				}, 100);
			} else {
				console.log('Current check status:', { isCheckingWins, autoCheckEnabled, visibilityState: document.visibilityState });
			}
		};
	
		if (browser) {
			console.log('Setting up visibility and focus handlers');
			document.addEventListener('visibilitychange', visibilityHandler);
			window.addEventListener('focus', visibilityHandler);
		}
	});

	onDestroy(() => {
		if (browser && visibilityHandler) {
			document.removeEventListener('visibilitychange', visibilityHandler);
			window.removeEventListener('focus', visibilityHandler);
		}
	});

	// Define extended hero type with game stats
	interface CardHero extends Hero {
		xp: number;
		gold: number;
		cardId?: string;
		holderId?: string | null;
		isHeld?: boolean;
	}

	// Define match check result type
	interface MatchCheckResult {
		heroId: number;
		matchFound: boolean;
		win: boolean;
		latestMatch: { heroId: number; timestamp: Date } | null;
	}

	// Initialize hero pool with default values
	if (browser && data.heroDescriptions && data.seasonUser) {
		console.log('Current user draws:', data.seasonUser.heroDraws.filter(draw => !draw.matchResult));
		console.log('All held heroes in league:', data.heldHeroIds);
		
		const heroesWithStats: CardHero[] = data.heroDescriptions.map((hero: Hero) => {
			const card = data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id);
			const isHeld = data.heldHeroIds.includes(hero.id);
			//console.log(`Hero ${hero.id} (${hero.localized_name}): isHeld=${isHeld}`);
			return {
				...hero,
				xp: card?.baseXP ?? 100,
				gold: card?.baseGold ?? 100,
				cardId: card?.id,
				isHeld
			};
		});
		heroPoolStore.setAllHeroes(heroesWithStats);
	}

	// Hand management
	let hand: (CardHero | null)[] = Array(data.seasonUser.handSize).fill(null);
	if (data.seasonUser.heroDraws) {
		// Only use active (non-discarded) draws
		const activeDraws = data.seasonUser.heroDraws.filter((draw) => !draw.matchResult);
		activeDraws.forEach((draw) => {
			const hero = data.heroDescriptions.find((h) => h.id === draw.heroId);
			if (hero) {
				const cardHero: CardHero = {
					...hero,
					xp: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseXP ?? 100,
					gold: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.baseGold ?? 100,
					cardId: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.id,
					holderId: data.activeDeck?.cards.find((c: { heroId: number }) => c.heroId === hero.id)?.holderId
				};
				// Find first empty slot
				const emptySlot = hand.findIndex((h) => h === null);
				if (emptySlot !== -1) {
					hand[emptySlot] = cardHero;
				}
			}
		});
	}

	$: console.log(hand);

	let showingAnimation: boolean = false;
	let showingStatUpdate: boolean = false;
	let selectedHero: CardHero | null = null;
	let currentHighlightId: number | null = null;
	let animationInterval: NodeJS.Timeout;
	let activeSlot: number | null = null;
	let updatedCardStats: { heroId: number; gold: number; xp: number } | null = null;
	let showStatBoost = false;
	let statBoostData: StatBoostData | null = null;
	let recentMatches = data.matchTableData;
	let statUpdateData: { 
		heroId: number;
		isWin: boolean;
		oldStats: { xp: number; gold: number };
		newStats: { xp: number; gold: number };
	} | null = null;
	let isDrawing: boolean = false;
	$: discardsRemaining = data.seasonUser?.discardTokens ?? 0;

	let lastNotificationTime = 0;
	const NOTIFICATION_COOLDOWN = 10000; // 10 seconds in milliseconds

	function showDiscardNotification() {
		const now = Date.now();
		if (now - lastNotificationTime >= NOTIFICATION_COOLDOWN) {
			toastStore.trigger({
				message: 'Play a match with one of your heroes to refresh your discard tokens!',
				background: 'variant-filled-warning'
			});
			lastNotificationTime = now;
		}
	}

	function startHeroAnimation(hero: CardHero, slotIndex: number) {
		isDrawing = true;
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
					iterations < maxIterations * 0.9 ? speed = speed * 1.5 : speed * 1.05;
					clearInterval(animationInterval);
					if (iterations >= maxIterations) {
						currentHighlightId = hero.id;
						showingAnimation = false;
						setTimeout(() => {
							currentHighlightId = null;
							if (activeSlot !== null) {
								completeDrawHero(activeSlot);
							}
							isDrawing = false;
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
		// Filter out held heroes from available pool
		const availableHeroes = $heroPoolStore.availableHeroes.filter(h => !h.isHeld);

		if (availableHeroes.length === 0) {
			showError('No heroes available to draw!');
			return;
		}

		const hero = availableHeroes[
			Math.floor(Math.random() * availableHeroes.length)
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

	async function refreshCardHistories() {
		const response = await fetch('/api/cards/history');
		const data = await response.json();
		if (data.success) {
			cardHistoryStore.setHistories(data.histories);
		}
	}

	async function completeDrawHero(slotIndex: number) {
		showingAnimation = false;
		if (selectedHero) {
			const hero = selectedHero;
			if (hero.cardId) {
				const response = await fetch(`/api/cards/${hero.cardId}/draw`, {
					method: 'POST',
					body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
				});
				const result = await response.json();

				if (!result.success) {
					showError('Failed to draw card');
				} else {
					// Refresh card histories
					await refreshCardHistories();

					// Update the drawn hero's status
					heroPoolStore.updateHeroStatus(result.updatedHero.id, true);
					
					hand[slotIndex] = hero;
					hand = [...hand];
				}
			}
		}
	}

	async function discardHero(slotIndex: number) {
		if (discardsRemaining <= 0) {
			showError('No discard tokens remaining - you must play a match first');
			return;
		}
		const oldHero = hand[slotIndex];
		if (oldHero) {
			const response = await fetch(`/api/cards/${oldHero.cardId}/discard`, {
				method: 'POST',
				body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
			});
			const result = await response.json();

			if (!result.success) {
				showError(`Failed to discard card: ${result.error}`);
			} else {
				// Update local discard tokens count
				if (data.seasonUser) {
					data.seasonUser.discardTokens--;
				}

				// Refresh card histories
				await refreshCardHistories();

				// Show stat boost modal
				statBoostData = {
					heroId: oldHero.id,
					oldStats: { gold: oldHero.gold, xp: oldHero.xp },
					newStats: { 
						gold: oldHero.gold + DOTADECK.DISCARD_BONUS.GOLD,
						xp: oldHero.xp + DOTADECK.DISCARD_BONUS.XP 
					}
				};
				showStatBoost = true;
				setTimeout(() => {
					showStatBoost = false;
					statBoostData = null;
				}, 2000);

				// Update the discarded hero's status
				heroPoolStore.updateHeroStatus(result.updatedHero.id, false);

				// Update hero stats in store
				const updatedHeroes = $heroPoolStore.allHeroes.map(h => {
					if (h.id === oldHero.id) {
						return {
							...h,
							gold: (h.gold ?? 100) + DOTADECK.DISCARD_BONUS.GOLD,
							xp: (h.xp ?? 100) + DOTADECK.DISCARD_BONUS.XP
						};
					}
					return h;
				});
				heroPoolStore.setAllHeroes(updatedHeroes);

				hand[slotIndex] = null;
				hand = [...hand];
			}
		}
	}

	async function checkForWins() {
		console.log('Checking for wins...');
		isCheckingWins = true;
		toastStore.trigger({
			message: 'Checking for wins...',
			background: 'variant-filled-primary'
		});
		
		try {
			const response = await fetch('/api/matches/check', {
				method: 'POST',
				body: JSON.stringify({
					seasonUserId: data.seasonUser!.id,
					heroIds: hand.filter(h => h !== null).map(h => h!.id)
				})
			});
			const result = await response.json();

			if (result.success && result.results) {
				toastStore.trigger({
					message: 'Check complete!',
					background: 'variant-filled-success'
				});
				
				// Process wins
				result.results.forEach(async (result: MatchCheckResult) => {
					const hero = hand.find((h) => h?.id === result.heroId);
					if (!hero || !result.matchFound) return;

					// Update local discard tokens count on match completion
					if (data.seasonUser) {
						data.seasonUser.discardTokens = 5;
					}

					// Mark hero as no longer held since match was found
					heroPoolStore.updateHeroStatus(hero.id, false);

					// Refresh card histories
					await refreshCardHistories();

					// Show stat update modal
					statUpdateData = {
						heroId: hero.id,
						isWin: result.win,
						oldStats: { xp: hero.xp, gold: hero.gold },
						newStats: result.win 
							? { xp: 100, gold: 100 }  // Reset to base stats on win
							: { xp: hero.xp + DOTADECK.LOSS_REWARD.XP, gold: hero.gold + DOTADECK.LOSS_REWARD.GOLD }
					};
					modalStore.trigger({
						type: 'component',
						component: {
							ref: StatUpdateAnimation,
							props: statUpdateData
						}
					});

					// Update hero stats and remove from hand
					const updatedHeroes = $heroPoolStore.allHeroes.map((h) => {
						if (h.id === hero.id) {
							return { 
								...h, 
								...(h as CardHero),
								gold: result.win ? 100 : (h as CardHero).gold + DOTADECK.LOSS_REWARD.GOLD,
								xp: result.win ? 100 : (h as CardHero).xp + DOTADECK.LOSS_REWARD.XP,
								isHeld: false
							} as CardHero;
						}
						return h;
					});
					heroPoolStore.setAllHeroes(updatedHeroes);

					// Remove from hand after animation completes
					setTimeout(() => {
						const index = hand.findIndex((h) => h?.id === hero.id);
						if (index !== -1) {
							hand[index] = null;
							hand = [...hand];
						}
						showingStatUpdate = false;
						statUpdateData = null;
					}, 2000);
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

	async function showLeaderboard() {
		const response = await fetch('/api/dotadeck/leaderboard');
		const leaderboardData = await response.json();
		
		modalStore.trigger({
			type: 'component',
			component: {
				ref: LeaderboardModal,
				props: {
					players: leaderboardData.success ? leaderboardData.players : []
				}
			}
		});
	}

	async function showRules() {
		modalStore.trigger({
			type: 'component',
			component: {
				ref: RulesModal
			}
		});
	}

	async function showHistory() {
		const response = await fetch('/api/dotadeck/history');
		const historyData = await response.json();
		
		modalStore.trigger({
			type: 'component',
			component: {
				ref: HistoryModal,
				props: {
					history: historyData.success ? historyData.history : []
				}
			}
		});
	}

	// Load card histories on mount
	onMount(async () => {
		const response = await fetch('/api/cards/history');
		const data = await response.json();
		if (data.success) {
			cardHistoryStore.setHistories(data.histories);
		}
	});

	// Show rules modal when data is loaded and user hasn't seen rules
	$: if (data.seasonUser && !data.seasonUser.hasSeenRules) {
		showRules();
		fetch('/api/seasonUser/updateRulesSeen', {
			method: 'POST',
			body: JSON.stringify({ seasonUserId: data.seasonUser.id })
		});
	}
</script>

<div class="container mx-auto p-4 space-y-8">
	<div class="card p-4 sticky top-0 z-10">
		<div class="flex justify-between items-center">
			<div class="flex gap-4">
				<span class="text-yellow-400 font-bold">{(data.stats.totalGold)}g</span>
				<span class="text-blue-400 font-bold">{(data.stats.totalXP)}xp</span>
			</div>
			<div class="flex gap-2">
				
				<button class="btn btn-sm variant-filled-tertiary" on:click={showRules}>
					<i class="fi fi-rr-book-bookmark mr-2"></i>
					Rules
				</button>
				<button class="btn btn-sm bg-amber-500 text-black" on:click={showHistory}>
					<i class="fi fi-rr-time-past mr-2"></i>
					History
				</button>
				<button class="btn btn-sm variant-filled-secondary" on:click={showLeaderboard}>
					<div class="flex items-center justify-center">
					<i class="fi fi-rr-trophy-star mr-2"></i>
					Leaderboard
					</div>
				</button>
				<button class="btn btn-sm variant-filled-primary" on:click={checkForWins} disabled={isCheckingWins}>
					{#if isCheckingWins}
						<i class="fi fi-rr-loading animate-spin mr-2"></i>
						Checking Wins...
					{:else}
						<i class="fi fi-rr-comment-question mr-2"></i>
						Check for Matches
					{/if}
				</button>
				<button 
					class="btn btn-sm {autoCheckEnabled ? 'variant-filled-success' : 'variant-filled-surface'}" 
					on:click={() => autoCheckEnabled = !autoCheckEnabled}
					data-tooltip="When enabled, automatically checks for matches when you return to this tab"
					data-tooltip-placement="bottom"
				>
					<i class="fi {autoCheckEnabled ? 'fi-rr-refresh' : 'fi-rr-pause'} mr-2"></i>
					Auto Check {autoCheckEnabled ? 'On' : 'Off'}
				</button>
			</div>
		</div>
	</div>
	<div class="container flex flex-col gap-4">
		<!-- Deck View -->
		<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50">
			<DeckView
				isAnimating={showingAnimation}
				{currentHighlightId}
			/>
		</div>

		<div class="grid grid-cols-2 gap-8">
			<!-- Hand -->
			<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50 p-4">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-lg font-bold text-primary-500">Hand</h2>
					<div class="flex items-center gap-2">
						<i class="fi fi-rr-recycle text-surface-400"></i>
						<span class="text-sm text-surface-400">
							Discards remaining: {discardsRemaining}
						</span>
					</div>
				</div>
				<div class="flex justify-center gap-4">
					{#each hand as hero, i}
						<div
							class="relative w-32 h-48 bg-surface-700/50 rounded-lg border-2 border-surface-600/50 shadow-xl hover:shadow-2xl transition-all duration-200"
						>
							{#if hero}
								<div class="absolute top-2 left-2">
									<i class={`d2mh hero-${hero.id} scale-150`}></i>
								</div>
								<div class="absolute top-14 left-0 right-0 text-center">
									<span class="text-xs font-bold text-yellow-300/90 drop-shadow-[0_0_3px_rgba(0,0,0,1)]">
										{hero.localized_name}
									</span>
								</div>
								<div class="absolute top-2 right-2 text-sm font-bold">
									<div class="text-yellow-400">{hero.gold}g</div>
									<div class="text-blue-400">{hero.xp}xp</div>
								</div>
								<div class="absolute bottom-2 w-full flex justify-center">
									<button 
										class="btn btn-sm variant-soft-error" 
										on:click={() => discardHero(i)}
										disabled={discardsRemaining <= 0}
										role="button"
										on:mouseenter={() => {
											if (discardsRemaining <= 0) showDiscardNotification();
										}}
									> 
										Discard 
									</button>
								</div>
							{:else}
								<div class="w-full h-full flex items-center justify-center">
									<button 
										class="btn variant-filled-primary" 
										on:click={() => drawHero(i)}
										disabled={isDrawing}
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
			<!-- Match History -->

			<MatchHistory matchTableData={recentMatches} />
		</div>
	</div>
</div>

{#if showStatBoost && statBoostData}
	<StatBoostModal data={statBoostData} />
{/if}
