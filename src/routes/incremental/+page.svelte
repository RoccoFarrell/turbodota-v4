<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import {
		getDurationSec,
		TRAINING_BUILDINGS,
		MINING_ESSENCE_PER_STRIKE,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import ActionSlotBar from '$lib/incremental/components/ActionSlotBar.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? 'Hero';
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	// ---- Shared store bindings ----
	const essence = $derived(actionStore.getEssence());
	const maxSlots = $derived(actionStore.getMaxSlots());
	const slots = $derived(actionStore.getSlots());

	let rosterCount = $state(0);

	function slotLabel(slot: actionStore.SlotState): string {
		if (slot.actionType === 'mining') return 'Mining';
		if (slot.actionType === 'training' && slot.actionHeroId != null && slot.actionStatKey != null) {
			return `Training ${heroName(slot.actionHeroId)} \u2013 ${statLabel(slot.actionStatKey)}`;
		}
		return 'Training';
	}

	function slotRate(slot: actionStore.SlotState): string {
		if (slot.actionType === 'mining') return `+${MINING_ESSENCE_PER_STRIKE} Essence`;
		return slot.actionStatKey ? `+1 ${statLabel(slot.actionStatKey)}` : '';
	}

	onMount(async () => {
		const saveId = actionStore.getSaveId();
		if (saveId) {
			const sp = `?saveId=${encodeURIComponent(saveId)}`;
			const rosterRes = await fetch(`/api/incremental/roster${sp}`);
			if (rosterRes.ok) {
				const data = await rosterRes.json();
				rosterCount = (data.heroIds ?? []).length;
			}
		}
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Dashboard</h1>

	<!-- Essence -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-between">
		<div>
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Essence</h2>
			<p class="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{essence}</p>
		</div>
		<div class="text-right">
			<p class="text-sm text-gray-500 dark:text-gray-400">{rosterCount} hero{rosterCount !== 1 ? 'es' : ''} on roster</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">{slots.length}/{maxSlots} slot{maxSlots !== 1 ? 's' : ''} active</p>
		</div>
	</section>

	<!-- Active Slots Summary -->
	{#if slots.length > 0}
		<section class="space-y-2">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active Actions</h2>
				<a href="/incremental/training" class="text-sm text-primary hover:underline">Manage &rarr;</a>
			</div>
			{#each slots as slot}
				<ActionSlotBar
					slotLabel="Slot {slot.slotIndex + 1}"
					actionLabel={slotLabel(slot)}
					progress={actionStore.slotDisplayProgress(slot)}
					nextIn={actionStore.slotNextIn(slot)}
					rateLabel={slotRate(slot)}
					isActive={true}
				/>
			{/each}
		</section>
	{:else}
		<section class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 p-6 text-center">
			<p class="text-gray-500 dark:text-gray-400">No active actions</p>
			<a href="/incremental/training" class="inline-block mt-2 text-primary hover:underline text-sm font-medium">Start training or mining &rarr;</a>
		</section>
	{/if}

	<!-- Quick Links -->
	<section class="grid grid-cols-2 sm:grid-cols-3 gap-3">
		<a href="/incremental/training" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">⛏️</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Training</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Mine & train heroes</p>
		</a>
		<a href="/incremental/tavern" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">🍺</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Tavern</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Recruit heroes</p>
		</a>
		<a href="/incremental/lineup" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">📋</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Lineups</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Build your team</p>
		</a>
		<a href="/incremental/run" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">🗺️</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Run</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Start a dungeon</p>
		</a>
		<a href="/incremental/talents" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">🌳</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Talents</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Skill tree</p>
		</a>
		<a href="/incremental/atlas" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 hover:border-primary transition-colors text-center">
			<div class="text-2xl mb-1">📖</div>
			<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Atlas</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">Hero reference</p>
		</a>
	</section>
</div>
