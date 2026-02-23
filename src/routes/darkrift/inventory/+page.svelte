<script lang="ts">
	import { dev } from '$app/environment';
	import { toaster } from '$lib/toaster';
	import InventoryPanel from '$lib/incremental/components/InventoryPanel.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

	// ---- Derived ----
	const saveId = $derived(actionStore.getSaveId());

	// ---- Debug (dev only) ----

	let debugBusy = $state(false);
	let panelRefreshKey = $state(0);

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
				actionStore.fetchBank();
				panelRefreshKey++;
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
				actionStore.fetchBank();
				panelRefreshKey++;
			} else {
				toaster.error({ title: data.message ?? 'Failed' });
			}
		} finally {
			debugBusy = false;
		}
	}
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

	<InventoryPanel refreshKey={panelRefreshKey} />
</div>
