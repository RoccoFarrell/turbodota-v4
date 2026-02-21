<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import arcaneRuneIcon from '$lib/assets/arcanerune.png';
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
	import { getArcaneRuneQty, formatTrainingRuneToast } from '$lib/incremental/items/rune-apply-helpers';

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
	let arcaneRuneQty = $state(0);
	let runeApplyMode = $state(false);
	let applyingRune = $state(false);

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

	async function fetchBank() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/bank${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			arcaneRuneQty = getArcaneRuneQty(data.inventory ?? []);
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

	function cancelRuneApply() {
		runeApplyMode = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && runeApplyMode) {
			cancelRuneApply();
		}
	}

	async function handleRuneApplyTraining(targetStatKey: TrainingStatKey, heroId: number) {
		if (applyingRune || !saveId) return;
		applyingRune = true;
		try {
			const res = await fetch('/api/incremental/items/use', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					saveId,
					itemId: 'arcane_rune',
					targetType: 'training',
					targetHeroId: heroId,
					targetStatKey
				})
			});
			if (res.ok) {
				const data = await res.json();
				const toast = formatTrainingRuneToast(
					data.completions ?? 0,
					TRAINING_BUILDINGS[targetStatKey].name,
					heroName(heroId),
					data.newTrainingValue ?? 0
				);
				toaster.success({ ...toast, duration: 8000 });
				await Promise.all([fetchBank(), fetchTraining()]);
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

	// fetchHeroes doesn't need saveId — fetch immediately on mount.
	onMount(() => { fetchHeroes(); });

	// saveId is set by the layout's onMount (after the page's onMount).
	// Use $effect so roster/training fetch as soon as saveId is available,
	// and the polling interval starts then too.
	$effect(() => {
		if (!saveId) return;
		fetchRoster();
		fetchTraining();
		fetchBank();
		const interval = setInterval(fetchTraining, 2000);
		return () => clearInterval(interval);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-6xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">The Barracks</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Train your heroes to strengthen them for battle</p>
		</div>
		<!-- Rune button -->
		<div class="flex items-center gap-4 text-sm">
			<button
				type="button"
				disabled={arcaneRuneQty === 0}
				onclick={() => { runeApplyMode = true; }}
				class="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-40"
			>
				<img src={arcaneRuneIcon} alt="Arcane Rune" class="inline w-4 h-4 object-contain" /> {arcaneRuneQty} Arcane Rune{arcaneRuneQty !== 1 ? 's' : ''}
			</button>
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
					{runeApplyMode}
					onRuneApply={handleRuneApplyTraining}
					{applyingRune}
				/>
			{/each}
		</div>
	{/if}
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
			{applyingRune ? 'Applying rune...' : 'Click a building to apply Arcane Rune'}
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
