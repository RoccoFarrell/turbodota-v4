<script lang="ts">
	import { getContext } from 'svelte';
	import { toaster } from '$lib/toaster';
	import { SCAVENGING_ACTION_DEFS } from '$lib/incremental/actions/action-definitions';
	import ActionSlotBar from '$lib/incremental/components/ActionSlotBar.svelte';
	import ScavengingResourceCard from '$lib/incremental/components/ScavengingResourceCard.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

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

	// saveId is set by the layout's onMount, which runs AFTER the page's onMount.
	// Use $effect to fetch roster/wood whenever saveId becomes available.
	$effect(() => {
		if (!saveId) return;
		fetchRoster();
		fetchWood();
	});
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Scavenging</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Collect resources to power your heroes</p>
		</div>
		<!-- Resource balances -->
		<div class="flex items-center gap-4 text-sm">
			<div class="flex items-center gap-1.5">
				<span>⛏️</span>
				<span class="font-semibold text-gray-900 dark:text-gray-100">{essence}</span>
				<span class="text-gray-500 dark:text-gray-400">Essence</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span>🪵</span>
				<span class="font-semibold text-gray-900 dark:text-gray-100">{woodBalance}</span>
				<span class="text-gray-500 dark:text-gray-400">Wood</span>
			</div>
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
			/>
		{/each}
	</div>
</div>
