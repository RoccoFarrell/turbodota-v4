<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toaster } from '$lib/toaster';
	import { SCAVENGING_ACTION_DEFS, MINING_ACTION_ID } from '$lib/incremental/actions/action-definitions';
	import ActionSlotBar from '$lib/incremental/components/ActionSlotBar.svelte';
	import ScavengingResourceCard from '$lib/incremental/components/ScavengingResourceCard.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import { getArcaneRuneQty, formatMiningRuneToast } from '$lib/incremental/items/rune-apply-helpers';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	// ---- Store bindings ----
	const saveId = $derived(actionStore.getSaveId());
	const essence = $derived(actionStore.getEssence());
	const maxSlots = $derived(actionStore.getMaxSlots());
	const slots = $derived(actionStore.getSlots());
	const isRunning = $derived(actionStore.getIsRunning());
	const busyHeroIds = $derived(actionStore.getBusyHeroIds());

	// ---- Local state ----
	let rosterHeroIds = $state<number[]>([]);
	let woodBalance = $state(0);
	let arcaneRuneQty = $state(0);
	let runeApplyMode = $state(false);
	let applyingRune = $state(false);

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	async function fetchRoster() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			rosterHeroIds = data.heroIds ?? [];
		}
	}

	async function fetchWood() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/bank${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			woodBalance = data.currencies?.wood ?? data.wood ?? 0;
			arcaneRuneQty = getArcaneRuneQty(data.inventory ?? []);
		}
	}

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}

	function findFreeSlotIndex(): number | null {
		for (let i = 0; i < maxSlots; i++) {
			if (!slots.find((s) => s.slotIndex === i)) return i;
		}
		return null;
	}

	async function handleAssign(actionType: string, partyHeroIds: number[]) {
		const slotIndex = findFreeSlotIndex();
		if (slotIndex == null) {
			toaster.error({ title: 'No free slots available' });
			return;
		}
		const ok = await actionStore.assignSlot(slotIndex, actionType, undefined, undefined, partyHeroIds);
		if (!ok) {
			toaster.error({ title: 'Failed to start action' });
		}
	}

	async function handleClear(slotIndex: number) {
		await actionStore.clearSlot(slotIndex);
	}

	function cancelRuneApply() {
		runeApplyMode = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && runeApplyMode) {
			cancelRuneApply();
		}
	}

	async function handleRuneApplyMining() {
		if (applyingRune || !saveId) return;
		applyingRune = true;
		try {
			const res = await fetch('/api/incremental/items/use', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, itemId: 'arcane_rune', targetType: 'mining' })
			});
			if (res.ok) {
				const data = await res.json();
				const toast = formatMiningRuneToast(data.completions ?? 0);
				toaster.success({ ...toast, duration: 8000 });
				await fetchWood();
			} else {
				const err = await res.json().catch(() => null);
				toaster.error({ title: err?.message ?? 'Failed to apply rune' });
			}
		} catch {
			toaster.error({ title: 'Failed to apply rune' });
		} finally {
			applyingRune = false;
			runeApplyMode = false;
		}
	}

	// saveId is set by the layout's onMount, which runs AFTER the page's onMount.
	// Use $effect to fetch roster/wood whenever saveId becomes available.
	$effect(() => {
		if (!saveId) return;
		fetchRoster();
		fetchWood();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-4xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Scavenging</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Collect resources to power your heroes</p>
		</div>
		<!-- Resource balances + Rune button -->
		<div class="flex items-center gap-4 text-sm">
			<div class="flex items-center gap-1.5">
				<span class="gi w-4 h-4 text-purple-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/lorc/gems.svg)"></span>
				<span class="font-semibold text-gray-900 dark:text-gray-100">{essence}</span>
				<span class="text-gray-500 dark:text-gray-400">Essence</span>
			</div>
			<!-- Wood hidden until lumber is implemented
			<div class="flex items-center gap-1.5">
				<span class="gi w-4 h-4 text-orange-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/delapouite/log.svg)"></span>
				<span class="font-semibold text-gray-900 dark:text-gray-100">{woodBalance}</span>
				<span class="text-gray-500 dark:text-gray-400">Wood</span>
			</div>
			-->
			<button
				type="button"
				disabled={arcaneRuneQty === 0}
				onclick={() => { runeApplyMode = true; }}
				class="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-40"
			>
				<span class="gi inline w-4 h-4 text-amber-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/delapouite/sparkles.svg)"></span> {arcaneRuneQty} Arcane Rune{arcaneRuneQty !== 1 ? 's' : ''}
			</button>
		</div>
	</div>

	<!-- Active Slots Panel -->
	<section class="space-y-2 mb-6">
		<h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Active Slots ({slots.length}/{maxSlots})
		</h2>
		{#each { length: maxSlots } as _, i}
			{@const slot = slots.find((s) => s.slotIndex === i)}
			{#if slot}
				<ActionSlotBar
					slotLabel="Slot {i + 1}"
					actionLabel={slot.actionType === 'mining' ? 'Mining' : slot.actionType === 'woodcutting' ? 'Woodcutting' : slot.actionType}
					progress={actionStore.slotDisplayProgress(slot)}
					nextIn={actionStore.slotNextIn(slot)}
					isActive={isRunning}
					onStop={() => handleClear(i)}
				/>
			{:else}
				<ActionSlotBar
					slotLabel="Slot {i + 1}"
					actionLabel=""
					progress={0}
					nextIn={0}
					isActive={false}
					isEmpty={true}
				/>
			{/if}
		{/each}
		{#if maxSlots < 3}
			<ActionSlotBar
				slotLabel="Slot {maxSlots + 1}"
				actionLabel=""
				progress={0}
				nextIn={0}
				isActive={false}
				isLocked={true}
			/>
		{/if}
	</section>

	<!-- Resource Cards -->
	<div class="grid gap-4 sm:grid-cols-2">
		{#each SCAVENGING_ACTION_DEFS as actionDef}
			<ScavengingResourceCard
				{actionDef}
				{slots}
				{rosterHeroIds}
				{heroName}
				{maxSlots}
				slotDisplayProgress={actionStore.slotDisplayProgress}
				slotNextIn={actionStore.slotNextIn}
				{isRunning}
				onAssign={handleAssign}
				onClear={handleClear}
				{busyHeroIds}
				{runeApplyMode}
				isRuneTarget={actionDef.id === MINING_ACTION_ID}
				onRuneApply={handleRuneApplyMining}
				{applyingRune}
			/>
		{/each}
	</div>
</div>

<!-- Rune Apply Mode Overlay -->
{#if runeApplyMode}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-black/50"
		transition:fade={{ duration: 200 }}
		onclick={cancelRuneApply}
		onkeydown={() => {}}
	></div>
	<div
		class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-gray-900 border border-amber-500/40 px-4 py-2 shadow-lg"
		transition:fade={{ duration: 200 }}
	>
		<span class="text-sm text-amber-400 font-medium">
			{applyingRune ? 'Applying rune...' : 'Click a target to apply Arcane Rune'}
		</span>
		<button
			type="button"
			onclick={cancelRuneApply}
			class="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-500 transition-colors"
		>
			Cancel
		</button>
	</div>
{/if}
