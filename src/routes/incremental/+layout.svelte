<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions';
	import { formatSlotLabel } from '$lib/incremental/actions/action-definitions';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import type { CatchUpResult } from '$lib/incremental/stores/action-slots.svelte';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}
	let { data, children }: Props = $props();

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? 'Hero';
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	// ---- Reactive bindings to the store ----
	const slots = $derived(actionStore.getSlots());
	// Hide bottom bar on slot-management pages (they have their own slot strip)
	const isSlotManagementPage = $derived(
		$page.url.pathname === '/incremental/scavenging' ||
		$page.url.pathname === '/incremental/barracks' ||
		$page.url.pathname.startsWith('/incremental/scavenging/') ||
		$page.url.pathname.startsWith('/incremental/barracks/')
	);
	// ---- Display helpers ----

	function slotLabel(slot: actionStore.SlotState): string {
		return formatSlotLabel(slot, { heroName, statLabel });
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

	function currencyLabel(key: string): string {
		if (key === 'essence') return 'Essence';
		if (key === 'wood') return 'Wood';
		return key.replace(/_/g, ' ');
	}

	import { getCurrencyDef } from '$lib/incremental/constants/currencies';

	function currencyIcon(key: string): string {
		return getCurrencyDef(key)?.icon ?? '/game-icons/ffffff/transparent/1x1/delapouite/gold-stack.svg';
	}

	async function handleVisibilityChange() {
		if (document.hidden) {
			hiddenAt = Date.now();
			actionStore.pauseTicking();
		} else {
			const wasHiddenAt = hiddenAt;
			hiddenAt = null;

			if (wasHiddenAt && slots.length > 0) {
				const awayMs = Date.now() - wasHiddenAt;

				if (awayMs > 5000) {
					const result = await actionStore.catchUpAllSlots(heroName, statLabel);
					if (result && Object.values(result.totalCurrenciesEarned).some((v) => v > 0)) {
						catchUpResult = result;
						showCatchUp = true;
					}
				} else {
					await actionStore.catchUpAllSlots(heroName, statLabel);
				}
			}

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
	<main class="flex-1 min-h-0 overflow-y-auto">
		{@render children?.()}
	</main>

	<!-- Bottom bar: active action slots (hidden on slot-management pages that have their own strip) -->
	{#if slots.length > 0 && !isSlotManagementPage}
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
					href="/incremental/scavenging"
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
								{#if Object.keys(result.currenciesEarned).length > 0}
									<div class="flex gap-2">
										{#each Object.entries(result.currenciesEarned) as [key, amount]}
											{#if amount > 0}
												<span class="text-sm font-semibold text-primary">
													<span class="gi inline w-4 h-4 text-amber-400" style="--gi: url({currencyIcon(key)})"></span> +{amount} {currencyLabel(key)}
												</span>
											{/if}
										{/each}
									</div>
								{:else}
									<span class="text-sm text-gray-400">Training applied</span>
								{/if}
							</div>
						{/each}
					</div>

					{#if Object.values(catchUpResult.totalCurrenciesEarned).some((v) => v > 0)}
						<div class="rounded-lg bg-primary/10 px-3 py-2 space-y-1">
							<p class="text-sm text-gray-600 dark:text-gray-300 text-center">Total earned</p>
							{#each Object.entries(catchUpResult.totalCurrenciesEarned) as [key, amount]}
								{#if amount > 0}
									<p class="text-2xl font-bold text-primary text-center">
										<span class="gi inline w-4 h-4 text-amber-400" style="--gi: url({currencyIcon(key)})"></span> +{amount} {currencyLabel(key)}
									</p>
								{/if}
							{/each}
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
