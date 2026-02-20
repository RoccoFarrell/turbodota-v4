<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { dev } from '$app/environment';
	import { toaster } from '$lib/toaster';
	import UseItemModal from '$lib/incremental/components/UseItemModal.svelte';
	import { ITEM_DEFINITIONS, type ItemDef } from '$lib/incremental/constants/item-definitions';
	import { CURRENCY_IDS, getCurrencyDef, type CurrencyDef } from '$lib/incremental/constants/currencies';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	// ---- State ----
	let saves = $state<Array<{ id: string; name: string | null; essence: number }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let inventory = $state<Array<{ itemDefId: string; quantity: number }>>([]);
	let currencies = $state<Record<string, number>>({});

	/** Selected slot for description panel: currency or item. */
	type SelectedSlot =
		| { type: 'currency'; currencyId: string; amount: number; def: CurrencyDef }
		| { type: 'item'; itemDefId: string; quantity: number; def: ItemDef };
	let selectedSlot = $state<SelectedSlot | null>(null);
	let showUseModal = $state(false);
	let selectedItemQty = $state(0);

	// ---- Derived ----
	const saveId = $derived(actionStore.getSaveId());
	const essence = $derived(actionStore.getEssence());
	const CURRENCY_SLOT_COUNT = 10;
	const ITEM_SLOT_COUNT = 10;
	const selectedItem = $derived(
		selectedSlot?.type === 'item' ? selectedSlot.def : null
	);

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero #${heroId}`;
	}

	// ---- Data fetching ----

	async function fetchBank() {
		const res = await fetch(`/api/incremental/bank${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			actionStore.setEssence(data.essence ?? 0);
			currencies = data.currencies ?? {};
			inventory = data.inventory ?? [];
		}
	}

	async function fetchRoster() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			rosterHeroIds = data.heroIds ?? [];
		}
	}

	// ---- Item helpers ----

	function getItemDef(itemDefId: string): ItemDef | undefined {
		return ITEM_DEFINITIONS[itemDefId];
	}

	/** Currencies to display: only those with amount > 0 (no entry if 0). */
	const displayCurrencies = $derived(
		CURRENCY_IDS.map((id) => {
			const def = getCurrencyDef(id);
			const amount = id === 'essence' ? essence : (currencies[id] ?? 0);
			return { currencyId: id, amount, def };
		})
			.filter((c): c is typeof c & { def: CurrencyDef } => c.def != null)
			.filter((c) => c.amount > 0)
	);

	/** Items with quantity > 0 only (no icon shown for 0). */
	const displayItems = $derived(
		inventory
			.filter((inv) => inv.quantity > 0)
			.map((inv) => ({
				...inv,
				def: getItemDef(inv.itemDefId)
			}))
			.filter((inv): inv is typeof inv & { def: ItemDef } => inv.def != null)
	);

	/** 10 currency slots: filled from displayCurrencies, rest empty skeleton. */
	const currencySlots = $derived(
		Array.from({ length: CURRENCY_SLOT_COUNT }, (_, i) =>
			displayCurrencies[i] != null
				? { type: 'currency' as const, ...displayCurrencies[i] }
				: { type: 'empty' as const }
		)
	);

	/** 10 item slots: only items with qty > 0 get an icon; rest empty skeleton. */
	const itemSlots = $derived(
		Array.from({ length: ITEM_SLOT_COUNT }, (_, i) =>
			displayItems[i] != null
				? { type: 'item' as const, ...displayItems[i] }
				: { type: 'empty' as const }
		)
	);

	/** Format amount for badge: 1500 → "1.5k", 1000000 → "1M". */
	function formatAmount(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
		return String(n);
	}

	// ---- Actions ----

	function selectCurrency(c: { currencyId: string; amount: number; def: CurrencyDef }) {
		selectedSlot = { type: 'currency', currencyId: c.currencyId, amount: c.amount, def: c.def };
	}

	function selectItem(item: { itemDefId: string; quantity: number; def: ItemDef }) {
		selectedSlot = { type: 'item', itemDefId: item.itemDefId, quantity: item.quantity, def: item.def };
	}

	function openUseModal() {
		if (selectedSlot?.type !== 'item') return;
		selectedItemQty = selectedSlot.quantity;
		showUseModal = true;
	}

	async function handleItemUsed(result: Record<string, unknown>) {
		await fetchBank();
		actionStore.fetchBank();
		const current = selectedSlot;
		if (current?.type === 'item') {
			const inv = inventory.find((i) => i.itemDefId === current.itemDefId);
			if (inv) selectedSlot = { ...current, quantity: inv.quantity };
		}
	}

	// ---- Debug (dev only) ----

	let debugBusy = $state(false);

	async function debugGrantRune(count = 1) {
		if (!dev) return;
		debugBusy = true;
		try {
			const res = await fetch('/api/incremental/debug/grant-arcane-rune', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, count })
			});
			const data = await res.json();
			if (res.ok) {
				toaster.success({ title: data.message ?? 'Rune(s) added' });
				await fetchBank();
				actionStore.fetchBank();
			} else {
				toaster.error({ title: data.message ?? 'Failed' });
			}
		} finally {
			debugBusy = false;
		}
	}

	async function debugSimulateWin(count = 1) {
		if (!dev) return;
		debugBusy = true;
		try {
			const res = await fetch('/api/incremental/debug/simulate-dota-win', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ count })
			});
			const data = await res.json();
			if (res.ok) {
				toaster.success({ title: data.message ?? 'Simulated win(s)' });
				await fetchBank();
				actionStore.fetchBank();
			} else {
				toaster.error({ title: data.message ?? 'Failed' });
			}
		} finally {
			debugBusy = false;
		}
	}

	// ---- Lifecycle ----

	onMount(async () => {
		await actionStore.ensureSave();
		await Promise.all([fetchBank(), fetchRoster()]);
	});
</script>

<div class="max-w-6xl mx-auto p-4">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
			Your items and consumables. Click an item to view details and use it.
		</p>
	</div>

	{#if dev}
		<div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-6">
			<h2 class="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Debug: test Arcane Runes</h2>
			<p class="text-xs text-amber-700 dark:text-amber-300 mb-3">
				These buttons only appear in development.
			</p>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-lg border border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800/40 disabled:opacity-50"
					disabled={debugBusy}
					onclick={() => debugGrantRune(1)}
				>
					Add 1 rune
				</button>
				<button
					type="button"
					class="rounded-lg border border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800/40 disabled:opacity-50"
					disabled={debugBusy}
					onclick={() => debugGrantRune(5)}
				>
					Add 5 runes
				</button>
				<button
					type="button"
					class="rounded-lg border border-amber-500 dark:border-amber-500 bg-amber-200 dark:bg-amber-800/50 px-3 py-1.5 text-sm font-medium text-amber-900 dark:text-amber-100 disabled:opacity-50"
					disabled={debugBusy}
					onclick={() => debugSimulateWin(1)}
				>
					Simulate 1 Dota win
				</button>
			</div>
		</div>
	{/if}

	<!-- Main content: two sections (currency + items) + description panel -->
	<div class="flex flex-col lg:flex-row gap-6">
		<div class="flex-1 min-w-0 space-y-6">
			<!-- Currency section: 10 slots, same grid pattern -->
			<section>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Currency</h2>
				<div
					class="grid gap-3"
					style="grid-template-columns: repeat(5, minmax(72px, 1fr));"
				>
					{#each currencySlots as slot}
						{#if slot.type === 'currency'}
							{@const isSelected = selectedSlot?.type === 'currency' && selectedSlot.currencyId === slot.currencyId}
							<button
								type="button"
								class="relative aspect-square rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 {isSelected
									? 'border-primary bg-primary/15 shadow-md scale-[1.02]'
									: 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}"
								onclick={() => selectCurrency(slot)}
							>
								<span class="absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
									<span class="gi w-8 h-8 text-amber-400" style="--gi: url({slot.def.icon})"></span>
								</span>
								<span
									class="absolute bottom-0.5 right-0.5 min-w-5 rounded bg-black/70 px-1 py-0.5 text-center text-xs font-bold text-white shadow"
								>
									{formatAmount(slot.amount)}
								</span>
							</button>
						{:else}
							<div
								class="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
								aria-hidden="true"
							></div>
						{/if}
					{/each}
				</div>
			</section>

			<!-- Items section: 10 slots, only qty > 0 show icon; rest skeleton -->
			<section>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Items</h2>
				<div
					class="grid gap-3"
					style="grid-template-columns: repeat(5, minmax(72px, 1fr));"
				>
					{#each itemSlots as slot}
						{#if slot.type === 'item'}
							{@const isSelected = selectedSlot?.type === 'item' && selectedSlot.itemDefId === slot.itemDefId}
							<button
								type="button"
								class="relative aspect-square rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 {isSelected
									? 'border-primary bg-primary/15 shadow-md scale-[1.02]'
									: 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}"
								onclick={() => selectItem(slot)}
							>
								<span class="absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
									<span class="gi w-8 h-8 text-amber-400" style="--gi: url({slot.def.icon})"></span>
								</span>
								{#if slot.quantity > 1}
									<span
										class="absolute bottom-0.5 right-0.5 min-w-5 rounded bg-black/70 px-1 py-0.5 text-center text-xs font-bold text-white shadow"
									>
										{slot.quantity > 999 ? '999+' : slot.quantity}
									</span>
								{/if}
							</button>
						{:else}
							<div
								class="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
								aria-hidden="true"
							></div>
						{/if}
					{/each}
				</div>
			</section>
		</div>

		<!-- Description panel (side) -->
		<aside
			class="w-full lg:w-80 shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden {!selectedSlot
				? 'border-dashed'
				: ''}"
		>
			{#if selectedSlot}
				<div class="p-4 flex flex-col h-full">
					<div class="flex items-center gap-3 mb-3">
						<div
							class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 p-2"
						>
							<span class="gi w-8 h-8 text-amber-400" style="--gi: url({selectedSlot.def.icon})"></span>
						</div>
						<div class="min-w-0">
							<h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
								{selectedSlot.def.name}
							</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{#if selectedSlot.type === 'currency'}
									You have {(selectedSlot.currencyId === 'essence' ? essence : (currencies[selectedSlot.currencyId] ?? 0)).toLocaleString()}
								{:else}
									You have {selectedSlot.quantity}
								{/if}
							</p>
						</div>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 flex-1">
						{selectedSlot.def.description}
					</p>
					{#if selectedSlot.type === 'item'}
						<div class="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
							{#if selectedSlot.def.usageType !== 'none'}
								<button
									type="button"
									class="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
									onclick={openUseModal}
								>
									Use
								</button>
							{:else}
								<p class="text-xs text-gray-500 dark:text-gray-400 italic">
									This item cannot be used.
								</p>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
					Select a currency or item to view its description.
				</div>
			{/if}
		</aside>
	</div>
</div>

{#if selectedItem}
	<UseItemModal
		open={showUseModal}
		onOpenChange={(details) => {
			showUseModal = details.open;
		}}
		itemDef={selectedItem}
		quantity={selectedItemQty}
		{saveId}
		{rosterHeroIds}
		heroNameFn={heroName}
		onUsed={handleItemUsed}
	/>
{/if}
