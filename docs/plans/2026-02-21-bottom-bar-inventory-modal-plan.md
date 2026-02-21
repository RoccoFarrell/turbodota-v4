# Bottom Bar + Inventory Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the conditional bottom action bar with an always-visible bottom bar showing compact action progress + backpack icon that opens an inventory slide-up modal.

**Architecture:** Extract inventory UI into a shared `InventoryPanel` component. Create a new `BottomBar` component with two zones (action progress left, backpack icon right). Wire both into the incremental layout, replacing the old conditional bottom bar. The inventory modal is a Skeleton `Dialog` rendered in the layout.

**Tech Stack:** SvelteKit (Svelte 5), Skeleton UI v4 (`Dialog`, `Portal`), Tailwind CSS v4, existing action store (`action-slots.svelte.ts`)

---

### Task 1: Extract InventoryPanel component

**Files:**
- Create: `src/lib/incremental/components/InventoryPanel.svelte`
- Modify: `src/routes/incremental/inventory/+page.svelte`

**Step 1: Create InventoryPanel.svelte**

Extract the inventory grid UI (currency grid + item grid + description panel + UseItemModal) from the existing inventory page into a reusable component. The panel should be self-contained — it fetches its own bank/roster data on mount.

```svelte
<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import UseItemModal from '$lib/incremental/components/UseItemModal.svelte';
	import { ITEM_DEFINITIONS, type ItemDef } from '$lib/incremental/constants/item-definitions';
	import { CURRENCY_IDS, getCurrencyDef, type CurrencyDef } from '$lib/incremental/constants/currencies';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

	interface Props {
		/** If true, use a compact layout suitable for modals (no side-by-side, stacked instead) */
		compact?: boolean;
	}
	let { compact = false }: Props = $props();

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	// ---- State ----
	let rosterHeroIds = $state<number[]>([]);
	let inventory = $state<Array<{ itemDefId: string; quantity: number }>>([]);
	let currencies = $state<Record<string, number>>({});

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
	const selectedItem = $derived(selectedSlot?.type === 'item' ? selectedSlot.def : null);

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

	const displayCurrencies = $derived(
		CURRENCY_IDS.map((id) => {
			const def = getCurrencyDef(id);
			const amount = id === 'essence' ? essence : (currencies[id] ?? 0);
			return { currencyId: id, amount, def };
		})
			.filter((c): c is typeof c & { def: CurrencyDef } => c.def != null)
			.filter((c) => c.amount > 0)
	);

	const displayItems = $derived(
		inventory
			.filter((inv) => inv.quantity > 0)
			.map((inv) => ({ ...inv, def: getItemDef(inv.itemDefId) }))
			.filter((inv): inv is typeof inv & { def: ItemDef } => inv.def != null)
	);

	const currencySlots = $derived(
		Array.from({ length: CURRENCY_SLOT_COUNT }, (_, i) =>
			displayCurrencies[i] != null
				? { type: 'currency' as const, ...displayCurrencies[i] }
				: { type: 'empty' as const }
		)
	);

	const itemSlots = $derived(
		Array.from({ length: ITEM_SLOT_COUNT }, (_, i) =>
			displayItems[i] != null
				? { type: 'item' as const, ...displayItems[i] }
				: { type: 'empty' as const }
		)
	);

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

	// ---- Lifecycle ----
	onMount(async () => {
		await actionStore.ensureSave();
		await Promise.all([fetchBank(), fetchRoster()]);
	});
</script>

<!-- Template: currency grid + item grid + description panel -->
<!-- Use compact prop to control layout: compact=true stacks vertically, compact=false does side-by-side on lg -->
<!-- Copy the exact grid HTML from the existing inventory page, adjusting the outer flex layout based on compact prop -->
```

Key points:
- Props: `compact?: boolean` — when true, stacks grids vertically without the lg:side-by-side description panel (for modal use)
- Self-contained data fetching (same as current inventory page)
- All the same derived state, helpers, and UseItemModal integration
- The template is the same grid HTML from the inventory page; the `compact` prop controls whether the description panel renders inline (below grids) vs side-by-side

**Step 2: Update inventory page to use InventoryPanel**

Simplify `src/routes/incremental/inventory/+page.svelte` to be a thin wrapper:

```svelte
<script lang="ts">
	import { dev } from '$app/environment';
	import { toaster } from '$lib/toaster';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import InventoryPanel from '$lib/incremental/components/InventoryPanel.svelte';

	// Keep debug helpers (dev-only grant rune / simulate win buttons)
	const saveId = $derived(actionStore.getSaveId());
	let debugBusy = $state(false);

	async function debugGrantRune(count = 1) { /* ... same as current ... */ }
	async function debugSimulateWin(count = 1) { /* ... same as current ... */ }
</script>

<div class="max-w-6xl mx-auto p-4">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
			Your items and consumables. Click an item to view details and use it.
		</p>
	</div>

	{#if dev}
		<!-- Debug panel (same as current) -->
	{/if}

	<InventoryPanel />
</div>
```

**Step 3: Verify the inventory page still works**

Run: `npm run dev` and navigate to `/incremental/inventory`. Verify the page looks identical to before — grids render, description panel works, UseItemModal opens.

**Step 4: Commit**

```bash
git add src/lib/incremental/components/InventoryPanel.svelte src/routes/incremental/inventory/+page.svelte
git commit -m "refactor: extract InventoryPanel component from inventory page"
```

---

### Task 2: Create BottomBar component

**Files:**
- Create: `src/lib/incremental/components/BottomBar.svelte`

**Step 1: Create BottomBar.svelte**

```svelte
<script lang="ts">
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';
	import { getActionDef } from '$lib/incremental/actions/action-definitions';

	interface Props {
		slots: SlotState[];
		slotLabel: (slot: SlotState) => string;
		slotProgress: (slot: SlotState) => number;
		slotNextIn: (slot: SlotState) => number;
		onOpenInventory: () => void;
	}
	let { slots, slotLabel, slotProgress, slotNextIn, onOpenInventory }: Props = $props();

	function slotColor(slot: SlotState): string {
		const def = getActionDef(slot.actionType);
		// Map text color classes to bg color classes for the progress bar
		if (def?.color === 'text-purple-400') return 'bg-purple-400';
		if (def?.color === 'text-orange-400') return 'bg-orange-400';
		if (def?.color === 'text-amber-400') return 'bg-amber-400';
		return 'bg-primary';
	}

	function slotHref(slot: SlotState): string {
		const def = getActionDef(slot.actionType);
		if (def?.category === 'training') return '/incremental/barracks';
		return '/incremental/scavenging';
	}
</script>

<div class="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2">
	<div class="max-w-3xl mx-auto flex items-center gap-3">
		<!-- Left zone: action progress or idle links -->
		<div class="flex-1 min-w-0">
			{#if slots.length > 0}
				<div class="flex items-center gap-3">
					{#each slots as slot}
						<a href={slotHref(slot)} class="flex-1 min-w-0 group">
							<div class="flex items-center justify-between gap-1 mb-0.5">
								<span class="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
									{slotLabel(slot)}
								</span>
								<span class="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
									{slotNextIn(slot) > 0 ? `${Math.ceil(slotNextIn(slot))}s` : '...'}
								</span>
							</div>
							<div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
								<div
									class="h-full rounded-full {slotColor(slot)} transition-[width] duration-75 ease-linear"
									style="width: {Math.min(100, slotProgress(slot) * 100)}%"
								></div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<a
						href="/incremental/barracks"
						class="rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					>
						Barracks
					</a>
					<a
						href="/incremental/scavenging"
						class="rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					>
						Scavenging
					</a>
				</div>
			{/if}
		</div>

		<!-- Right zone: backpack icon -->
		<button
			type="button"
			class="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			onclick={onOpenInventory}
			aria-label="Open inventory"
		>
			<i class="fi fi-rr-briefcase text-lg text-gray-600 dark:text-gray-400"></i>
		</button>
	</div>
</div>
```

Key points:
- Receives action slot state and display helpers as props (no direct store dependency — layout wires them)
- Active slots: each is an `<a>` link to the management page, showing a truncated label + thin colored progress bar + countdown
- Idle state: two pill link buttons to Barracks and Scavenging
- Backpack button fires `onOpenInventory` callback
- Compact: ~48px height, `backdrop-blur-sm` background

**Step 2: Commit**

```bash
git add src/lib/incremental/components/BottomBar.svelte
git commit -m "feat: add BottomBar component with action progress and inventory button"
```

---

### Task 3: Wire BottomBar and inventory modal into the layout

**Files:**
- Modify: `src/routes/incremental/+layout.svelte`

**Step 1: Update the layout**

Replace the conditional bottom bar block (lines 124-154 in current layout) with the new `BottomBar` component and add the inventory modal.

Changes to the `<script>` block:
1. Import `BottomBar` and `InventoryPanel`
2. Add `let inventoryOpen = $state(false);` state
3. Remove `isSlotManagementPage` derived (no longer needed)
4. Keep all existing logic (tick loop, catch-up dialog, heroName, statLabel, etc.)

Changes to the template:
1. Replace the `{#if slots.length > 0 && !isSlotManagementPage}` block with:
   ```svelte
   <BottomBar
       {slots}
       {slotLabel}
       slotProgress={slotProgress}
       slotNextIn={slotNextIn}
       onOpenInventory={() => { inventoryOpen = true; }}
   />
   ```
2. Add the inventory modal after the catch-up dialog:
   ```svelte
   <Dialog
       open={inventoryOpen}
       onOpenChange={(details) => { inventoryOpen = details.open; }}
   >
       <Portal>
           <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
           <Dialog.Positioner class="fixed inset-0 z-50 flex items-end justify-center">
               <Dialog.Content
                   class="w-full max-w-2xl max-h-[70vh] overflow-y-auto rounded-t-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
               >
                   <div class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                       <Dialog.Title class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory</Dialog.Title>
                       <Dialog.CloseTrigger class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                           <i class="fi fi-rr-cross-small text-xl"></i>
                       </Dialog.CloseTrigger>
                   </div>
                   <div class="p-4">
                       <InventoryPanel compact />
                   </div>
               </Dialog.Content>
           </Dialog.Positioner>
       </Portal>
   </Dialog>
   ```

**Step 2: Verify everything works**

1. Navigate to `/incremental` — bottom bar should always be visible
2. When slots are active, progress bars appear with colored thin bars
3. When no slots active, "Barracks" and "Scavenging" pill links appear
4. Click backpack icon — inventory modal slides up from bottom
5. Modal shows currency and item grids
6. Click item, description shows, "Use" button works
7. Navigate to `/incremental/barracks` — bottom bar still visible
8. Navigate to `/incremental/scavenging` — bottom bar still visible
9. Existing inventory page at `/incremental/inventory` still works

**Step 3: Commit**

```bash
git add src/routes/incremental/+layout.svelte
git commit -m "feat: wire BottomBar and inventory modal into incremental layout"
```

---

### Task 4: Manual testing and polish

**Step 1: Test responsive behavior**

- Test on mobile viewport (375px wide): bottom bar should not overflow, progress labels truncate gracefully
- Test with 1, 2, and 3 active slots
- Test modal on mobile: should fill width, scrollable content

**Step 2: Test edge cases**

- Open inventory modal with no items/currencies — should show empty grid slots
- Open modal, use an item, verify quantities update
- Tab away and return — catch-up dialog should still work correctly
- Verify the existing `/incremental/inventory` page still works independently

**Step 3: Fix any visual issues found**

Adjust spacing, colors, or truncation as needed.

**Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "fix: polish bottom bar and inventory modal styling"
```
