<script lang="ts">
	import type { LayoutData } from './$types';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions';
	import { formatSlotLabel } from '$lib/incremental/actions/action-definitions';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import BottomBar from '$lib/incremental/components/BottomBar.svelte';
	import InventoryPanel from '$lib/incremental/components/InventoryPanel.svelte';
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
	let inventoryOpen = $state(false);
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

	<BottomBar
		{slots}
		{slotLabel}
		slotProgress={slotProgress}
		slotNextIn={slotNextIn}
		onOpenInventory={() => { inventoryOpen = true; }}
	/>
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

<!-- Inventory modal (slide up from bottom) -->
{#if inventoryOpen}
	<div class="fixed inset-0 z-50">
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
			onclick={() => { inventoryOpen = false; }}
		></div>
		<!-- Sheet -->
		<div class="absolute inset-x-0 bottom-0 flex justify-center animate-[slideUp_300ms_ease-out]">
			<div
				class="w-full max-w-2xl max-h-[70vh] overflow-y-auto rounded-t-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
				role="dialog"
				aria-label="Inventory"
			>
				<div class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory</h2>
					<button
						type="button"
						class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						onclick={() => { inventoryOpen = false; }}
						aria-label="Close inventory"
					>
						<i class="fi fi-rr-cross-small text-xl"></i>
					</button>
				</div>
				<div class="p-4">
					<InventoryPanel compact />
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
