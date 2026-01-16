<script lang="ts">
	import { run, createBubbler, stopPropagation, handlers } from 'svelte/legacy';

	const bubble = createBubbler();
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { heroPoolStore } from '$lib/stores/heroPoolStore';
	import type { Hero } from '@prisma/client';
	import type { PageData } from './$types';
	import { redirect } from '@sveltejs/kit';
	import { DOTADECK } from '$lib/constants/dotadeck';
	import DeckView from './_components/DeckView.svelte';
	//import HeroSelectionAnimation from './_components/HeroSelectionAnimation.svelte';
	import StatBoostModal from './_components/StatBoostModal.svelte';
	import StatUpdateAnimation from './_components/StatUpdateAnimation.svelte';
	import LeaderboardModal from './_components/LeaderboardModal.svelte';
	import RulesModal from './_components/RulesModal.svelte';
	import HistoryModal from './_components/HistoryModal.svelte';
	import HeroHistory from './_components/HeroHistory.svelte';
	import type { StatBoostData } from '$lib/types/dotadeck';
	import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
	//import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';
	import AutoCheckTooltip from './_components/AutoCheckTooltip.svelte';
	import MatchHistory from '$lib/components/MatchHistory.svelte';

	// Get toaster from context (Skeleton v3)
	import { getContext } from 'svelte';
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	const toastStore = getContext<any>('toaster');
	
	// Helper function to create toasts with Skeleton v3 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.create === 'function') {
			toastStore.create({
				title: message,
				description: '',
				type: background?.includes('error') ? 'error' : 
				       background?.includes('success') ? 'success' : 
				       background?.includes('warning') ? 'warning' : 'info',
				meta: { background }
			});
		} else {
			console.error('ToastStore not available from context');
		}
	}
	
	// Import Modal component (Skeleton v3)
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	
	// Modal state (Skeleton v3)
	let showRulesModal = $state(false);
	let showLeaderboardModal = $state(false);
	let showHistoryModal = $state(false);
	let showMatchHistoryModal = $state(false);
	let showStatUpdateModal = $state(false);
	let statUpdateData: any = $state(null);

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props();

	if (!data.seasonUser) {
		console.error("No season user found for logged in user: ", data.user);
		redirect(302, '/');
	}

	let isCheckingWins = $state(false);
	let autoCheckEnabled = $state(browser ? 
		JSON.parse(sessionStorage.getItem('autoCheckEnabled') ?? 'true') : 
		true);
	let visibilityHandler: () => Promise<void>;

	// Setup visibility change handler in onMount
	onMount(() => {
		let checkTimeout: NodeJS.Timeout;
		
		visibilityHandler = async () => {
			// Don't check if any modal is open
			if (showRulesModal || showLeaderboardModal || showHistoryModal || showMatchHistoryModal || showStatUpdateModal) {
				return;
			}
			
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
	let hand: (CardHero | null)[] = $state(Array(data.seasonUser.handSize).fill(null));
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

	run(() => {
		console.log(hand);
	});

	let showingAnimation: boolean = $state(false);
	let showingStatUpdate: boolean = false;
	let selectedHero: CardHero | null = null;
	let currentHighlightId: number | null = $state(null);
	let animationInterval: NodeJS.Timeout;
	let activeSlot: number | null = null;
	let updatedCardStats: { heroId: number; gold: number; xp: number } | null = null;
	let showStatBoost = $state(false);
	let statBoostData: StatBoostData | null = $state(null);
	let recentMatches = data.matchTableData;
	// statUpdateData is already declared above as $state(null)
	let isDrawing: boolean = $state(false);
	let discardsRemaining = $derived(data.seasonUser?.discardTokens ?? 0);

	let lastNotificationTime = 0;
	const NOTIFICATION_COOLDOWN = 10000; // 10 seconds in milliseconds

	function showDiscardNotification() {
		const now = Date.now();
		if (now - lastNotificationTime >= NOTIFICATION_COOLDOWN) {
			showToast('Play a match with one of your heroes to refresh your discard tokens!', 'preset-filled-warning-500');
			lastNotificationTime = now;
		}
	}

	function startHeroAnimation(finalHeroId: number, onComplete: () => void) {
		const availableHeroes = $heroPoolStore.availableHeroes;
		let speed = 75;
		let iterations = 0;
		const maxIterations = 15;
		const ANIMATION_TIME = 1500; // 1.5 seconds
		const startTime = Date.now();
		let completed = false;
		let lingerTimeout: NodeJS.Timeout;

		// Clear any existing highlight
		currentHighlightId = null;

		function animate() {
			animationInterval = setInterval(() => {
				// Check if we've reached 1.5 seconds
				if (Date.now() - startTime >= ANIMATION_TIME) {
					clearInterval(animationInterval);
					currentHighlightId = finalHeroId;
					if (!completed) {
						completed = true;
						// Complete the draw immediately
						onComplete();
					}
					// Keep highlighting for 2 more seconds
					lingerTimeout = setTimeout(() => {
						currentHighlightId = null;
						showingAnimation = false;
					}, 2000);
					return;
				}

				currentHighlightId = availableHeroes[Math.floor(Math.random() * availableHeroes.length)].id;
				iterations++;

				if (iterations > maxIterations * 0.6) {
					speed = iterations < maxIterations * 0.8 ? speed * 1.2 : speed * 1.1;
					clearInterval(animationInterval);
					animate();
				}
			}, speed);
		}

		animate();

		// Cleanup function
		return () => {
			if (animationInterval) clearInterval(animationInterval);
			if (lingerTimeout) clearTimeout(lingerTimeout);
			currentHighlightId = null;
			showingAnimation = false;
		};
	}

	onDestroy(() => {
		if (animationInterval) clearInterval(animationInterval);
		currentHighlightId = null;
	});

	async function drawHero(slotIndex: number) {
		if (isDrawing) return;
		isDrawing = true;
		activeSlot = slotIndex;
		if (hand[slotIndex] !== null) return; // Prevent drawing if slot is occupied
		showingAnimation = true;
		currentHighlightId = null; // Reset any existing highlight

		// Start server call immediately
		const response = await fetch(`/api/cards/draw`, {
			method: 'POST',
			body: JSON.stringify({ seasonUserId: data.seasonUser!.id })
		});
		const result = await response.json();

		if (!result.success) {
			showError(result.error);
			isDrawing = false;
			activeSlot = null;
			showingAnimation = false;
			return;
		}

		// Start animation that will end on the drawn hero
		startHeroAnimation(result.card.id, () => {
			completeDrawHero(slotIndex, result);
		});
	}

	async function completeDrawHero(slotIndex: number, result: any) {
		// Update hand and hero pool
		hand[slotIndex] = result.card;
		hand = [...hand];
		
		// Refresh card histories
		await refreshCardHistories();

		// Wait for highlight animation to finish before updating hero pool
		setTimeout(() => {
			showingAnimation = false;
			// Give time for the fade transition to complete
			setTimeout(() => {
				heroPoolStore.updateHeroStatus(result.updatedHero.id, true);
			}, 200);
		}, 2000);

		isDrawing = false;
		activeSlot = null;
	}

	function showError(message: string) {
		showToast(message, 'preset-filled-error-500');
	}

	async function refreshCardHistories() {
		const response = await fetch('/api/cards/history');
		const data = await response.json();
		if (data.success) {
			cardHistoryStore.setHistories(data.histories);
		}
	}

	let isDiscarding = $state(false);

	async function discardHero(slotIndex: number) {
		if (discardsRemaining <= 0) {
			showError('No discard tokens remaining - you must play a match first');
			return;
		}
		if (isDiscarding) return;
		isDiscarding = true;
		
		const oldHero = hand[slotIndex];
		if (oldHero) {
			try {
				// Ensure we're using the correct cardId from the drawn card
				if (!oldHero.cardId) {
					throw new Error('No card ID found');
				}
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
			} catch (error) {
				console.error('Error discarding hero:', error);
				showError('Failed to discard hero');
			} finally {
				isDiscarding = false;
			}
		}
	}

	async function checkForWins() {
		console.log('Checking for wins...');
		isCheckingWins = true;
		showToast('Checking for wins...', 'preset-filled-primary-500');
		
		try {
			const response = await fetch('/api/matches/check', {
				method: 'POST',
				body: JSON.stringify({
					seasonUserId: data.seasonUser!.id,
					heroIds: hand.filter(h => h !== null).map(h => h!.id)
				})
			});
			const result = await response.json();
			console.log(result);
			if (result.success && result.results) {
				showToast('Check complete!', 'preset-filled-success-500');
				
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
					showStatUpdateModal = true;

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
			showToast('Failed to check for wins', 'preset-filled-error-500');
		} finally {
			isCheckingWins = false;
		}
	}

	let leaderboardPlayers: any[] = $state([]);
	let historyData: any[] = $state([]);
	let isLoadingLeaderboard = $state(false);

	async function showLeaderboard() {
		// Open modal immediately for better UX
		showLeaderboardModal = true;
		isLoadingLeaderboard = true;
		
		try {
			const response = await fetch('/api/dotadeck/leaderboard');
			const leaderboardData = await response.json();
			leaderboardPlayers = leaderboardData.success ? leaderboardData.players : [];
		} catch (error) {
			console.error('Failed to load leaderboard:', error);
			leaderboardPlayers = [];
		} finally {
			isLoadingLeaderboard = false;
		}
	}

	function showRules() {
		showRulesModal = true;
	}

	async function showHistory() {
		const response = await fetch('/api/dotadeck/history');
		const historyResponse = await response.json();
		historyData = historyResponse.success ? historyResponse.history : [];
		showHistoryModal = true;
	}

	function showMatchHistory() {
		showMatchHistoryModal = true;
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
	run(() => {
		if (data.seasonUser && !data.seasonUser.hasSeenRules) {
			showRules();
			fetch('/api/seasonUser/updateRulesSeen', {
				method: 'POST',
				body: JSON.stringify({ seasonUserId: data.seasonUser.id })
			});
		}
	});

	// Add state variables for tooltip
	let showAutoCheckTooltip = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	let selectedHeroId: number | null = $state(null);
</script>

<div class="container mx-auto p-4 space-y-8">
	<div class="card bg-surface-100 dark:bg-surface-900 border border-surface-400 dark:border-surface-600 p-4 sticky top-0 z-10">
		<div class="flex justify-between items-center">
			<div class="flex gap-4">
				<span class="text-yellow-400 font-bold">{(data.stats.totalGold)}g</span>
				<span class="text-blue-400 font-bold">{(data.stats.totalXP)}xp</span>
			</div>
			<div class="flex gap-2">
				<button class="btn btn-sm preset-filled-secondary-500" onclick={showLeaderboard}>
					<div class="flex items-center justify-center">
					<i class="fi fi-rr-trophy-star mr-2"></i>
					Leaderboard
					</div>
				</button>
				<button class="btn btn-sm preset-filled-tertiary-500" onclick={showRules}>
					<i class="fi fi-rr-book-bookmark mr-2"></i>
					Rules
				</button>
				<div class="border-l border-surface-500 mx-2"></div>
				<button class="btn btn-sm bg-amber-500 text-black" onclick={showHistory}>
					<i class="fi fi-rr-time-past mr-2"></i>
					Game History
				</button>
				<button class="btn btn-sm bg-purple-800 text-white" onclick={showMatchHistory}>
					<i class="fi fi-rr-chart-line-up mr-2"></i>
					Recent Matches
				</button>
				<div class="border-l border-surface-500 mx-2"></div>
				<button class="btn btn-sm preset-filled-primary-500" onclick={checkForWins} disabled={isCheckingWins}>
					{#if isCheckingWins}
						<i class="fi fi-rr-loading animate-spin mr-2"></i>
						Checking Wins...
					{:else}
						<i class="fi fi-rr-comment-question mr-2"></i>
						Check for Matches
					{/if}
				</button>
				<button 
					class="btn btn-sm {autoCheckEnabled ? 'preset-filled-success-500' : 'preset-filled-surface-500'}" 
					onclick={() => {
						autoCheckEnabled = !autoCheckEnabled;
						if (browser) {
							sessionStorage.setItem('autoCheckEnabled', JSON.stringify(autoCheckEnabled));
						}
					}}
					onmouseenter={(e) => {
						tooltipX = e.clientX;
						tooltipY = e.clientY;
						showAutoCheckTooltip = true;
					}}
					onmouseleave={() => showAutoCheckTooltip = false}
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
				{selectedHeroId}
				on:selectHero={(e) => selectedHeroId = e.detail.heroId}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
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
							class="relative w-40 h-60 bg-surface-700/50 rounded-lg border-2 border-surface-600/50 shadow-xl 
								hover:shadow-2xl transition-all duration-200 cursor-pointer
								hover:-translate-y-2 hover:scale-105
								{selectedHeroId === hero?.id ? 'ring-4 ring-amber-500' : ''}"
							role="button"
							tabindex="0"
							onclick={() => {
								if (hero) {
									selectedHeroId = selectedHeroId === hero.id ? null : hero.id;
								}
							}}
							onkeypress={(e) => {
								if (e.key === 'Enter' && hero) {
									selectedHeroId = selectedHeroId === hero.id ? null : hero.id;
								}
							}}
						>
							{#if hero}
								<div class="absolute top-10 left-0 right-0 text-center">
									<span class="text-md font-bold text-yellow-300/90 drop-shadow-[0_0_3px_rgba(0,0,0,1)] animate-pulse">
										{hero.localized_name}
									</span>
								</div>
								<div class="absolute -top-1 -left-1">
									<div class="rounded-full bg-surface-900/80 w-10 h-10 flex items-center justify-center border border-amber-500">
										<span class="text-xs font-bold text-yellow-400">{hero.gold}g</span>
									</div>
								</div>
								<div class="absolute -top-1 -right-1">
									<div class="rounded-full bg-surface-900/80 w-10 h-10 flex items-center justify-center border border-amber-500">
										<span class="text-xs font-bold text-blue-400">{hero.xp}xp</span>
									</div>
								</div>
								<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
									<i class={`d2mh hero-${hero.id} scale-[2]`}></i>
								</div>
								<div class="absolute bottom-2 w-full flex justify-center">
									<button 
										class="btn btn-sm preset-tonal-error hover:preset-tonal-error-hover" 
										onclick={handlers(() => discardHero(i), stopPropagation(bubble('click')))}
										disabled={discardsRemaining <= 0 || isDiscarding}
										onmouseenter={() => {
											if (discardsRemaining <= 0) showDiscardNotification();
										}}
									> 
										{#if isDiscarding}
											<i class="fi fi-rr-loading animate-spin mr-2"></i>
											Discarding...
										{:else}
											Discard
										{/if}
									</button>
								</div>
							{:else}
								<div class="w-full h-full flex items-center justify-center">
									<button 
										class="btn preset-filled-primary-500" 
										onclick={() => drawHero(i)}
										disabled={isDrawing}
									> 
										Draw 
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
			<!-- Hero History -->
			<HeroHistory {selectedHeroId} />
		</div>
	</div>
</div>

{#if showStatBoost && statBoostData}
	<Modal 
		open={showStatBoost} 
		onOpenChange={(details) => {
			showStatBoost = details.open;
			if (!details.open) statBoostData = null;
		}}
		backdropBackground="bg-black/50"
		contentBackground="bg-transparent"
	>
		{#snippet content()}
			{#if statBoostData}
				<StatBoostModal 
					data={statBoostData} 
					onClose={() => {
						showStatBoost = false;
						statBoostData = null;
					}}
				/>
			{/if}
		{/snippet}
	</Modal>
{/if}

{#if showAutoCheckTooltip}
	<AutoCheckTooltip x={tooltipX} y={tooltipY} />
{/if}

<!-- Skeleton v3 Modals -->
{#if showRulesModal}
	<Modal 
		open={showRulesModal} 
		onOpenChange={(details) => showRulesModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<RulesModal />
		{/snippet}
	</Modal>
{/if}

{#if showLeaderboardModal}
	<Modal 
		open={showLeaderboardModal} 
		onOpenChange={(details) => showLeaderboardModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<LeaderboardModal 
				players={leaderboardPlayers} 
				isLoading={isLoadingLeaderboard}
				onClose={() => showLeaderboardModal = false} 
			/>
		{/snippet}
	</Modal>
{/if}

{#if showHistoryModal}
	<Modal 
		open={showHistoryModal} 
		onOpenChange={(details) => showHistoryModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<HistoryModal history={historyData} onClose={() => showHistoryModal = false} />
		{/snippet}
	</Modal>
{/if}

{#if showMatchHistoryModal}
	<Modal 
		open={showMatchHistoryModal} 
		onOpenChange={(details) => showMatchHistoryModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<MatchHistory matchTableData={recentMatches} />
		{/snippet}
	</Modal>
{/if}

{#if showStatUpdateModal && statUpdateData}
	<Modal 
		open={showStatUpdateModal} 
		onOpenChange={(details) => showStatUpdateModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<StatUpdateAnimation
				heroId={statUpdateData.heroId}
				isWin={statUpdateData.isWin}
				oldStats={statUpdateData.oldStats}
				newStats={statUpdateData.newStats}
				onClose={() => showStatUpdateModal = false}
			/>
		{/snippet}
	</Modal>
{/if}

<!-- {#if showingAnimation && selectedHero && activeSlot !== null}
	<div class="fixed inset-0 bg-surface-900/80 z-50 flex items-center justify-center">
		<HeroSelectionAnimation
			heroes={$heroPoolStore.availableHeroes}
			finalHero={selectedHero}
			onComplete={() => completeDrawHero(activeSlot)}
		/>
	</div>
{/if} -->
