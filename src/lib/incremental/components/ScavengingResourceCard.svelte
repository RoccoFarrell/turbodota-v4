<script lang="ts">
	import { SCAVENGING_PARTY_MAX_SIZE, SCAVENGING_PARTY_YIELD_BONUS } from '$lib/incremental/actions/constants';
	import type { ActionDef } from '$lib/incremental/actions/action-definitions';
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';
	import { runeTargetClasses } from '$lib/incremental/items/rune-apply-helpers';

	interface Props {
		actionDef: ActionDef;
		slots: SlotState[];
		rosterHeroIds: number[];
		heroName: (id: number) => string;
		maxSlots: number;
		slotDisplayProgress: (slot: SlotState) => number;
		slotNextIn: (slot: SlotState) => number;
		isRunning: boolean;
		onAssign: (actionType: string, partyHeroIds: number[]) => void;
		onClear: (slotIndex: number) => void;
		busyHeroIds?: Set<number>;
		runeApplyMode?: boolean;
		isRuneTarget?: boolean;
		onRuneApply?: () => void;
		applyingRune?: boolean;
	}

	let {
		actionDef,
		slots,
		rosterHeroIds,
		heroName,
		maxSlots,
		slotDisplayProgress,
		slotNextIn,
		isRunning,
		onAssign,
		onClear,
		busyHeroIds = new Set(),
		runeApplyMode = false,
		isRuneTarget = false,
		onRuneApply,
		applyingRune = false
	}: Props = $props();

	/** Active slot for this action type. */
	const activeSlot = $derived(slots.find((s) => s.actionType === actionDef.id));

	/** Whether there is a free slot available. */
	const hasFreeSlot = $derived(slots.length < maxSlots);

	// Party hero selection (up to SCAVENGING_PARTY_MAX_SIZE companions)
	let partySelections = $state<(number | null)[]>(
		Array.from({ length: SCAVENGING_PARTY_MAX_SIZE }, () => null)
	);

	/** Heroes available to show in each dropdown (all non-busy). */
	const availableHeroes = $derived(rosterHeroIds.filter((id) => !busyHeroIds.has(id)));

	/** True if a hero is already selected in a different party slot. */
	function isSelectedElsewhere(heroId: number, slotIdx: number): boolean {
		return partySelections.some((id, i) => i !== slotIdx && id === heroId);
	}

	function handleStart() {
		const party = partySelections.filter((id): id is number => id != null);
		onAssign(actionDef.id, party);
		partySelections = Array.from({ length: SCAVENGING_PARTY_MAX_SIZE }, () => null);
	}

	const activePartyBonus = $derived(
		activeSlot ? activeSlot.partyHeroIds.length * SCAVENGING_PARTY_YIELD_BONUS : 0
	);

	const pendingPartyBonus = $derived(
		partySelections.filter((id) => id != null).length * SCAVENGING_PARTY_YIELD_BONUS
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 relative {runeApplyMode && isRuneTarget ? '' : 'overflow-hidden'} {runeTargetClasses(runeApplyMode, isRuneTarget)}"
	onclick={() => { if (runeApplyMode && isRuneTarget && onRuneApply && !applyingRune) onRuneApply(); }}
	onkeydown={(e) => { if (runeApplyMode && isRuneTarget && e.key === 'Enter' && onRuneApply && !applyingRune) onRuneApply(); }}
>
	{#if runeApplyMode && isRuneTarget}
		<div class="absolute -inset-px rounded-xl ring-2 ring-amber-400 animate-pulse pointer-events-none z-10"></div>
	{/if}
	<!-- Header -->
	<div class="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<span class="text-2xl" aria-hidden="true">{actionDef.icon}</span>
				<div>
					<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
						{actionDef.id === 'mining' ? 'Essence Mine' : actionDef.id === 'woodcutting' ? 'Lumber Camp' : actionDef.label}
					</h3>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						+1 per {actionDef.durationPerCompletionSec}s
					</p>
				</div>
			</div>
			{#if activeSlot && activePartyBonus > 0}
				<span class="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
					+{Math.round(activePartyBonus * 100)}% yield
				</span>
			{/if}
		</div>
	</div>

	<div class="p-4 space-y-3" class:pointer-events-none={runeApplyMode}>
		<!-- Active slot display -->
		{#if activeSlot}
			{@const prog = slotDisplayProgress(activeSlot)}
			{@const next = slotNextIn(activeSlot)}
			<div class="space-y-1.5">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-medium text-gray-800 dark:text-gray-200">
						Slot {activeSlot.slotIndex + 1}
					</span>
					<button
						type="button"
						onclick={() => onClear(activeSlot.slotIndex)}
						class="shrink-0 text-xs rounded px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Stop
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
				</p>

				<!-- Active party display -->
				{#if activeSlot.partyHeroIds.length > 0}
					<div class="flex flex-wrap gap-1.5 pt-1">
						<span class="text-xs text-gray-500 dark:text-gray-400">Party:</span>
						{#each activeSlot.partyHeroIds as pid}
							<span class="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
								{heroName(pid)}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Assignment UI -->
			{#if hasFreeSlot}
				<!-- Party picker -->
				{#if rosterHeroIds.length > 0}
					<div class="space-y-2">
						<p class="text-xs text-gray-500 dark:text-gray-400">
							Party companions (optional) · +{Math.round(SCAVENGING_PARTY_YIELD_BONUS * 100)}% yield each, up to +{Math.round(SCAVENGING_PARTY_MAX_SIZE * SCAVENGING_PARTY_YIELD_BONUS * 100)}%
						</p>
						<div class="flex gap-2">
							{#each Array.from({ length: SCAVENGING_PARTY_MAX_SIZE }, (_, i) => i) as partyIdx}
								<select
									bind:value={partySelections[partyIdx]}
									class="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
								>
									<option value={null}>+ Add hero</option>
									{#each availableHeroes as hid}
										<option value={hid} disabled={isSelectedElsewhere(hid, partyIdx)}>
											{heroName(hid)}{isSelectedElsewhere(hid, partyIdx) ? ' (in use)' : ''}
										</option>
									{/each}
								</select>
							{/each}
						</div>
						{#if pendingPartyBonus > 0}
							<p class="text-xs text-green-600 dark:text-green-400">
								→ +{Math.round(pendingPartyBonus * 100)}% yield bonus
							</p>
						{/if}
					</div>
				{/if}

				<button
					type="button"
					onclick={handleStart}
					class="w-full rounded-lg py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
				>
					Start {actionDef.label}
				</button>
			{:else}
				<p class="text-sm text-gray-400 italic text-center">No free slots available</p>
				<p class="text-xs text-gray-400 text-center">
					Unlock more slots in <a href="/incremental/talents" class="text-primary hover:underline">Talents</a>
				</p>
			{/if}
		{/if}
	</div>
</div>
