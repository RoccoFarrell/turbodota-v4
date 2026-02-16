<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, MINING_ESSENCE_PER_STRIKE, type TrainingStatKey } from '$lib/incremental/actions';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import type { CatchUpResult } from '$lib/incremental/stores/action-slots.svelte';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}
	let { data, children }: Props = $props();

	// ---- Refresh matches button ----
	let refreshingMatches = $state(false);
	let matchesRefreshedAt = $state<number | null>(null);
	const REFRESH_FEEDBACK_MS = 2500;

	async function refreshMatches() {
		const accountId = data.accountId;
		if (!accountId || refreshingMatches) return;
		refreshingMatches = true;
		try {
			await fetch(`/api/updateMatchesForUser/${accountId}`, { method: 'GET' });
			matchesRefreshedAt = Date.now();
			setTimeout(() => {
				matchesRefreshedAt = null;
			}, REFRESH_FEEDBACK_MS);
		} finally {
			refreshingMatches = false;
		}
	}

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? 'Hero';
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	const incrementalNav = [
		{ label: 'Dashboard', path: '/incremental' },
		{ label: 'Training', path: '/incremental/training' },
		{ label: 'Hero Tavern', path: '/incremental/tavern' },
		{ label: 'Lineups', path: '/incremental/lineup' },
		{ label: 'Run (Map)', path: '/incremental/run' },
		{ label: 'Talents', path: '/incremental/talents' },
		{ label: 'Inventory', path: '/incremental/inventory' },
		{ label: 'Quests', path: '/incremental/quests' },
		{ label: 'History', path: '/incremental/history' },
		{ label: 'Atlas', path: '/incremental/atlas' }
	];

	function isActive(path: string): boolean {
		const p = $page.url.pathname;
		if (path === '/incremental') return p === '/incremental';
		return p === path || p.startsWith(path + '/');
	}

	// ---- Reactive bindings to the store ----
	const slots = $derived(actionStore.getSlots());
	const isTrainingPage = $derived($page.url.pathname === '/incremental/training');

	// ---- Display helpers ----

	function slotLabel(slot: actionStore.SlotState): string {
		if (slot.actionType === 'mining') return 'Mining';
		if (slot.actionType === 'training' && slot.actionHeroId != null && slot.actionStatKey) {
			return `${heroName(slot.actionHeroId)} \u2013 ${statLabel(slot.actionStatKey)}`;
		}
		return 'Training';
	}

	function slotProgress(slot: actionStore.SlotState): number {
		return actionStore.slotDisplayProgress(slot);
	}

	function slotNextIn(slot: actionStore.SlotState): number {
		return actionStore.slotNextIn(slot);
	}

	// ---- Catch-up dialog ----
	let showCatchUp = $state(false);
	let catchUpResult = $state<CatchUpResult | null>(null);
	let hiddenAt = $state<number | null>(null);

	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return `${h}h ${m}m`;
	}

	async function handleVisibilityChange() {
		if (document.hidden) {
			// Page is being hidden — record timestamp and pause client-side ticking
			hiddenAt = Date.now();
			actionStore.pauseTicking();
		} else {
			// Page is visible again
			const wasHiddenAt = hiddenAt;
			hiddenAt = null;

			if (wasHiddenAt && slots.length > 0) {
				const awayMs = Date.now() - wasHiddenAt;

				// IMPORTANT: catch up with the server BEFORE resuming client ticks,
				// because resumeTicking() resets lastTickAt to now.
				if (awayMs > 5000) {
					const result = await actionStore.catchUpAllSlots(heroName, statLabel);
					if (result && (result.totalEssenceEarned > 0 || result.slotResults.length > 0)) {
						catchUpResult = result;
						showCatchUp = true;
					}
				} else {
					// Short absence — catch up silently
					await actionStore.catchUpAllSlots(heroName, statLabel);
				}
			}

			// NOW resume client-side ticking (resets lastTickAt to now)
			actionStore.resumeTicking();
		}
	}

	// ---- Lifecycle ----

	onMount(async () => {
		await actionStore.fetchBank();
		await actionStore.fetchSlots();
		actionStore.startTickLoop();

		document.addEventListener('visibilitychange', handleVisibilityChange);
	});

	onDestroy(() => {
		actionStore.stopTickLoop();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	});
</script>

<div class="w-full h-full flex flex-col min-h-0">
	<nav class="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-3 py-2 flex flex-wrap items-center gap-1 sm:gap-2">
		<div class="flex items-center gap-1 sm:gap-2">
			{#each incrementalNav as item}
				<a
					href={item.path}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.path)
						? 'bg-primary text-primary-foreground'
						: 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}"
				>
					{item.label}
				</a>
			{/each}
		</div>
		{#if data.accountId != null}
			<div class="ml-auto flex items-center">
				<button
					type="button"
					onclick={refreshMatches}
					disabled={refreshingMatches}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-60 disabled:pointer-events-none"
					title="Fetch latest Dota 2 matches from OpenDota"
				>
					{#if refreshingMatches}
						Refreshing…
					{:else if matchesRefreshedAt != null && Date.now() - matchesRefreshedAt < REFRESH_FEEDBACK_MS}
						Updated
					{:else}
						Refresh matches
					{/if}
				</button>
			</div>
		{/if}
	</nav>
	<main class="flex-1 min-h-0 overflow-y-auto">
		{@render children?.()}
	</main>

	<!-- Bottom bar: active action slots (in-flow so it doesn't cover nav; hidden on training page) -->
	{#if slots.length > 0 && !isTrainingPage}
		<div class="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2">
			<div class="max-w-3xl mx-auto flex items-center gap-4">
				{#each slots as slot}
					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between gap-2 mb-0.5">
							<span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
								{slotLabel(slot)}
							</span>
							<span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">
								{slotNextIn(slot) > 0 ? `${slotNextIn(slot).toFixed(1)}s` : '...'}
							</span>
						</div>
						<div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
							<div
								class="h-full bg-primary transition-[width] duration-75 ease-linear"
								style="width: {Math.min(100, slotProgress(slot) * 100)}%"
							></div>
						</div>
					</div>
				{/each}
				<a
					href="/incremental/training"
					class="shrink-0 text-xs text-primary hover:underline font-medium"
				>
					Manage
				</a>
			</div>
		</div>
	{/if}
</div>

<!-- Catch-up dialog (shown after returning from background) -->
{#if showCatchUp && catchUpResult}
	<Dialog
		open={showCatchUp}
		onOpenChange={(details) => { showCatchUp = details.open; }}
	>
		<Portal>
			<Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
			<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
				<Dialog.Content class="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
					<div class="text-center">
						<div class="text-3xl mb-2">⏰</div>
						<Dialog.Title class="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome back!</Dialog.Title>
						<Dialog.Description class="text-sm text-gray-500 dark:text-gray-400 mt-1">
							You were away for {formatDuration(catchUpResult.awaySeconds)}
						</Dialog.Description>
					</div>

					<div class="space-y-2">
						{#each catchUpResult.slotResults as result}
							<div class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{result.actionLabel}</span>
								{#if result.essenceEarned > 0}
									<span class="text-sm font-semibold text-primary">+{result.essenceEarned} Essence</span>
								{:else}
									<span class="text-sm text-gray-400">Training applied</span>
								{/if}
							</div>
						{/each}
					</div>

					{#if catchUpResult.totalEssenceEarned > 0}
						<div class="text-center rounded-lg bg-primary/10 px-3 py-2">
							<p class="text-sm text-gray-600 dark:text-gray-300">Total earned</p>
							<p class="text-2xl font-bold text-primary">+{catchUpResult.totalEssenceEarned} Essence</p>
						</div>
					{/if}

					<div class="text-center pt-1">
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Current balance: <span class="font-semibold text-gray-900 dark:text-gray-100">{catchUpResult.newEssence} Essence</span>
						</p>
					</div>

					<Dialog.CloseTrigger
						class="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
					>
						Continue
					</Dialog.CloseTrigger>
				</Dialog.Content>
			</Dialog.Positioner>
		</Portal>
	</Dialog>
{/if}
