<script lang="ts">
	import { slide } from 'svelte/transition';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions/constants';
	import { getStatAffinityAttr } from '$lib/incremental/actions/hero-affinity';
	import { MISC_ICONS } from '$lib/incremental/components/game-icons';
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';
	import type { HeroDef } from '$lib/incremental/types';
	import HeroPickerDropdown from './HeroPickerDropdown.svelte';
	import { shouldAutoApply } from '$lib/incremental/items/rune-apply-helpers';

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
		runeApplyMode?: boolean;
		onRuneApply?: (statKey: TrainingStatKey, heroId: number) => void;
		applyingRune?: boolean;
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
		busyHeroIds = new Set(),
		runeApplyMode = false,
		onRuneApply,
		applyingRune = false
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

	// Rune apply: hero picker sub-state (for buildings without active slot)
	let runePickerOpen = $state(false);
	let runeSelectedHeroId = $state<number | null>(null);

	function handleTrain() {
		if (selectedHeroId == null || !hasFreeSlot) return;
		onAssign(statKey, selectedHeroId);
		selectedHeroId = null;
		showPicker = false;
	}

	function handleHeroSelect(heroId: number | null) {
		selectedHeroId = heroId;
	}

	function handleRuneCardClick() {
		if (!runeApplyMode || applyingRune || !onRuneApply) return;

		const auto = shouldAutoApply(activeSlot);
		if (auto.autoApply && auto.heroId != null) {
			onRuneApply(statKey, auto.heroId);
		} else {
			runePickerOpen = true;
		}
	}

	function handleRuneHeroSelect(heroId: number | null) {
		runeSelectedHeroId = heroId;
	}

	function confirmRuneApply() {
		if (runeSelectedHeroId == null || !onRuneApply) return;
		onRuneApply(statKey, runeSelectedHeroId);
		runeSelectedHeroId = null;
		runePickerOpen = false;
	}

	// Reset rune picker when apply mode is exited
	$effect(() => {
		if (!runeApplyMode) {
			runePickerOpen = false;
			runeSelectedHeroId = null;
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 relative
		{runeApplyMode ? 'z-50 cursor-pointer' : 'overflow-hidden'}"
	onclick={handleRuneCardClick}
	onkeydown={(e) => { if (runeApplyMode && e.key === 'Enter') handleRuneCardClick(); }}
>
	{#if runeApplyMode}
		<div class="absolute -inset-px rounded-xl ring-2 ring-amber-400 animate-pulse pointer-events-none z-10"></div>
	{/if}
	<!-- Header -->
	<div class="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
		<div class="flex items-center gap-2">
			<span class="gi w-7 h-7 {building.color}" style="--gi: url({building.icon})" aria-hidden="true"></span>
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

	<div class="p-4 space-y-3" class:pointer-events-none={runeApplyMode && !runePickerOpen}>
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
					Recruit heroes in <a href="/darkrift/tavern" class="text-primary hover:underline">Hero Tavern</a> to train here.
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
						Unlock more slots in <a href="/darkrift/talents" class="text-primary hover:underline">Talents</a>
					</p>
				{/if}
			{/if}
		{/if}
	</div>

	<!-- Rune Apply: Hero picker for buildings without active slot -->
	{#if runeApplyMode && runePickerOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="p-4 border-t border-amber-500/30 bg-amber-500/5"
			transition:slide={{ duration: 200 }}
			onclick={(e) => e.stopPropagation()}
		>
			<p class="text-xs text-amber-400 font-medium mb-2">Select hero for rune</p>
			<HeroPickerDropdown
				{rosterHeroIds}
				{getHeroDef}
				{heroName}
				{trainingValues}
				targetStatKey={statKey}
				value={runeSelectedHeroId}
				onSelect={handleRuneHeroSelect}
				{busyHeroIds}
			/>
			<button
				type="button"
				onclick={confirmRuneApply}
				disabled={runeSelectedHeroId == null || applyingRune}
				class="mt-2 w-full rounded-lg py-2 text-sm font-medium transition-colors
					{runeSelectedHeroId != null && !applyingRune
						? 'bg-amber-500 text-gray-900 hover:bg-amber-400'
						: 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}"
			>
				{#if applyingRune}Applying...{:else}<span class="gi w-4 h-4 text-amber-400" style="--gi: url({MISC_ICONS.sparkle})"></span> Apply Rune{/if}
			</button>
		</div>
	{/if}

	<!-- Applying indicator for auto-apply -->
	{#if runeApplyMode && applyingRune && activeSlot}
		<div class="p-3 border-t border-amber-500/30 bg-amber-500/5 text-center">
			<span class="text-sm text-amber-400 font-medium">Applying...</span>
		</div>
	{/if}
</div>
