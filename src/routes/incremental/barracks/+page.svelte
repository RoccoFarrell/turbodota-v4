<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { toaster } from '$lib/toaster';
	import {
		TRAINING_BUILDINGS,
		TRAINING_STAT_KEYS,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import ActionSlotBar from '$lib/incremental/components/ActionSlotBar.svelte';
	import BarracksBuildingCard from '$lib/incremental/components/BarracksBuildingCard.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	let heroesFromApi = $state<{ heroes: HeroDef[]; heroNames: Array<{ heroId: number; localizedName: string }>; abilityDefs: Record<string, AbilityDef> }>({
		heroes: [],
		heroNames: [],
		abilityDefs: {}
	});

	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));

	function heroName(heroId: number, fallback = 'Hero'): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? fallback;
	}

	function getHeroDef(heroId: number): HeroDef | undefined {
		return heroById.get(heroId);
	}

	function statLabel(statKey: TrainingStatKey): string {
		return TRAINING_BUILDINGS[statKey]?.name ?? statKey;
	}

	// ---- Local state ----
	let rosterHeroIds = $state<number[]>([]);
	let trainingValues = $state<Record<number, Record<string, number>>>({});

	// ---- Shared store bindings ----
	const saveId = $derived(actionStore.getSaveId());
	const maxSlots = $derived(actionStore.getMaxSlots());
	const slots = $derived(actionStore.getSlots());
	const isRunning = $derived(actionStore.getIsRunning());
	const busyHeroIds = $derived(actionStore.getBusyHeroIds());

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

	async function fetchTraining() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/training${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			const map: Record<number, Record<string, number>> = {};
			for (const t of data.training ?? []) {
				if (!map[t.heroId]) map[t.heroId] = {};
				map[t.heroId][t.statKey] = t.value;
			}
			trainingValues = map;
		}
	}

	async function fetchHeroes() {
		const res = await fetch('/api/incremental/heroes');
		if (res.ok) {
			const data = await res.json();
			heroesFromApi = {
				heroes: data.heroes ?? [],
				heroNames: data.heroNames ?? [],
				abilityDefs: data.abilityDefs ?? {}
			};
		}
	}

	function findFreeSlotIndex(): number | null {
		for (let i = 0; i < maxSlots; i++) {
			if (!slots.find((s) => s.slotIndex === i)) return i;
		}
		return null;
	}

	async function handleAssign(statKey: TrainingStatKey, heroId: number) {
		const slotIndex = findFreeSlotIndex();
		if (slotIndex == null) {
			toaster.error({ title: 'No free slots available' });
			return;
		}
		const ok = await actionStore.assignSlot(slotIndex, 'training', heroId, statKey);
		if (!ok) {
			toaster.error({ title: 'Failed to start training' });
		} else {
			await fetchTraining();
		}
	}

	async function handleClearSlot(slotIndex: number) {
		await actionStore.clearSlot(slotIndex);
	}

	// fetchHeroes doesn't need saveId — fetch immediately on mount.
	onMount(() => { fetchHeroes(); });

	// saveId is set by the layout's onMount (after the page's onMount).
	// Use $effect so roster/training fetch as soon as saveId is available,
	// and the polling interval starts then too.
	$effect(() => {
		if (!saveId) return;
		fetchRoster();
		fetchTraining();
		const interval = setInterval(fetchTraining, 2000);
		return () => clearInterval(interval);
	});
</script>

<div class="max-w-6xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">The Barracks</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Train your heroes to strengthen them for battle</p>
		</div>
	</div>

	<!-- Active Slots Panel -->
	<section class="space-y-2 mb-6">
		<h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Training Slots ({slots.filter(s => s.actionType === 'training').length}/{maxSlots})
		</h2>
		{#each { length: maxSlots } as _, i}
			{@const slot = slots.find((s) => s.slotIndex === i)}
			{#if slot}
				<ActionSlotBar
					slotLabel="Slot {i + 1}"
					actionLabel={slot.actionType === 'training' && slot.actionHeroId != null && slot.actionStatKey != null
						? `Training ${heroName(slot.actionHeroId)} – ${statLabel(slot.actionStatKey as TrainingStatKey)}`
						: slot.actionType}
					progress={actionStore.slotDisplayProgress(slot)}
					nextIn={actionStore.slotNextIn(slot)}
					rateLabel="+1 per tick"
					isActive={isRunning}
					onStop={() => handleClearSlot(i)}
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

	<!-- Training Buildings Grid -->
	{#if rosterHeroIds.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Recruit heroes in <a href="/incremental/tavern" class="text-primary hover:underline font-medium">Hero Tavern</a> to start training.
			</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each TRAINING_STAT_KEYS as statKey}
				<BarracksBuildingCard
					{statKey}
					{slots}
					{rosterHeroIds}
					{getHeroDef}
					{heroName}
					{trainingValues}
					{maxSlots}
					slotDisplayProgress={actionStore.slotDisplayProgress}
					slotNextIn={actionStore.slotNextIn}
					{isRunning}
					onAssign={handleAssign}
					onClear={handleClearSlot}
					{busyHeroIds}
				/>
			{/each}
		</div>
	{/if}
</div>
