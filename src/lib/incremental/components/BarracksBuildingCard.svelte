<script lang="ts">
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions/constants';
	import { getStatAffinityAttr } from '$lib/incremental/actions/hero-affinity';
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';
	import type { HeroDef } from '$lib/incremental/types';
	import HeroPickerDropdown from './HeroPickerDropdown.svelte';

	interface Props {
		statKey: TrainingStatKey;
		slots: SlotState[];
		rosterHeroIds: number[];
		getHeroDef: (id: number) => HeroDef | undefined;
		heroName: (id: number, fallback?: string) => string;
		trainingValues: Record<number, Record<string, number>>;
		maxSlots: number;
		slotDisplayProgress: (slot: SlotState) => number;
		slotNextIn: (slot: SlotState) => number;
		isRunning: boolean;
		onAssign: (statKey: TrainingStatKey, heroId: number) => void;
		onClear: (slotIndex: number) => void;
		busyHeroIds?: Set<number>;
	}

	let {
		statKey,
		slots,
		rosterHeroIds,
		getHeroDef,
		heroName,
		trainingValues,
		maxSlots,
		slotDisplayProgress,
		slotNextIn,
		isRunning,
		onAssign,
		onClear,
		busyHeroIds = new Set()
	}: Props = $props();

	const building = $derived(TRAINING_BUILDINGS[statKey]);
	const affinityAttr = $derived(getStatAffinityAttr(statKey));

	const ATTR_LABELS: Record<string, string> = { str: 'STR', agi: 'AGI', int: 'INT', universal: 'UNI' };

	/** Active slot for this building (training this statKey). */
	const activeSlot = $derived(slots.find((s) => s.actionType === 'training' && s.actionStatKey === statKey));

	/** Whether there is a free slot available. */
	const hasFreeSlot = $derived(slots.length < maxSlots);

	let selectedHeroId = $state<number | null>(null);
	let showPicker = $state(false);

	function handleTrain() {
		if (selectedHeroId == null || !hasFreeSlot) return;
		onAssign(statKey, selectedHeroId);
		selectedHeroId = null;
		showPicker = false;
	}

	function handleHeroSelect(heroId: number | null) {
		selectedHeroId = heroId;
	}
</script>

<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 overflow-hidden">
	<!-- Header -->
	<div class="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
		<div class="flex items-center gap-2">
			<span class="text-2xl" aria-hidden="true">{building.icon}</span>
			<div>
				<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{building.name}</h3>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{building.description}
					{#if affinityAttr}
						· <span class="text-amber-600 dark:text-amber-400">Affinity: {ATTR_LABELS[affinityAttr] ?? affinityAttr.toUpperCase()} +25%</span>
					{/if}
				</p>
			</div>
		</div>
	</div>

	<div class="p-4 space-y-3">
		<!-- Active slot display -->
		{#if activeSlot}
			{@const prog = slotDisplayProgress(activeSlot)}
			{@const next = slotNextIn(activeSlot)}
			<div class="space-y-1.5">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
						{activeSlot.actionHeroId != null ? heroName(activeSlot.actionHeroId) : 'Training…'}
						{#if activeSlot.actionHeroId != null && trainingValues[activeSlot.actionHeroId]?.[statKey] != null}
							<span class="text-xs text-gray-500 ml-1">+{(trainingValues[activeSlot.actionHeroId][statKey]).toFixed(0)}</span>
						{/if}
					</span>
					<button
						type="button"
						onclick={() => onClear(activeSlot.slotIndex)}
						class="shrink-0 text-xs rounded px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Clear
					</button>
				</div>
				<div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
					<div
						class="h-full bg-primary transition-[width] duration-75 ease-linear"
						style="width: {Math.min(100, prog * 100)}%"
					></div>
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{#if isRunning}
						{next > 0 ? `Next in ${next.toFixed(1)}s` : 'Completing…'}
					{:else}
						Paused
					{/if}
					· +1 per tick
				</p>
			</div>
		{/if}

		<!-- Picker / assign section -->
		{#if !activeSlot}
			{#if rosterHeroIds.length === 0}
				<p class="text-xs text-gray-400 italic">
					Recruit heroes in <a href="/incremental/tavern" class="text-primary hover:underline">Hero Tavern</a> to train here.
				</p>
			{:else}
				<button
					type="button"
					onclick={() => showPicker = !showPicker}
					class="w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
				>
					<span>{showPicker ? '▾' : '▸'}</span>
					{selectedHeroId != null ? heroName(selectedHeroId) : 'Select hero to train…'}
				</button>

				{#if showPicker}
					<HeroPickerDropdown
						{rosterHeroIds}
						{getHeroDef}
						{heroName}
						{trainingValues}
						targetStatKey={statKey}
						value={selectedHeroId}
						onSelect={handleHeroSelect}
						{busyHeroIds}
					/>
				{/if}

				<button
					type="button"
					onclick={handleTrain}
					disabled={selectedHeroId == null || !hasFreeSlot}
					class="w-full rounded-lg py-2 text-sm font-medium transition-colors
						{selectedHeroId != null && hasFreeSlot
							? 'bg-primary text-primary-foreground hover:opacity-90'
							: 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}"
				>
					{!hasFreeSlot ? 'No free slots' : 'Train'}
				</button>

				{#if !hasFreeSlot}
					<p class="text-xs text-gray-400 text-center">
						Unlock more slots in <a href="/incremental/talents" class="text-primary hover:underline">Talents</a>
					</p>
				{/if}
			{/if}
		{/if}
	</div>
</div>
