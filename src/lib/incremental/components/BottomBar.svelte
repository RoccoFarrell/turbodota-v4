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
		if (def?.color === 'text-purple-400') return 'bg-purple-400';
		if (def?.color === 'text-orange-400') return 'bg-orange-400';
		if (def?.color === 'text-amber-400') return 'bg-amber-400';
		return 'bg-primary';
	}

	function slotHref(slot: SlotState): string {
		const def = getActionDef(slot.actionType);
		if (def?.category === 'training') return '/darkrift/barracks';
		return '/darkrift/scavenging';
	}
</script>

<div class="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2">
	<div class="max-w-3xl mx-auto flex items-center gap-3">
		<!-- Left zone: inventory button -->
		<button
			type="button"
			class="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
			onclick={onOpenInventory}
		>
			<i class="fi fi-rr-briefcase text-sm"></i>
			Inventory
		</button>

		<!-- Right zone: action status -->
		<div class="flex-1 min-w-0">
			{#if slots.length > 0}
				<div class="flex items-center gap-2">
					{#each slots as slot (slot.slotIndex)}
						<a href={slotHref(slot)} class="flex-1 min-w-0">
							<div class="flex items-center justify-between gap-1">
								<span class="text-xs text-gray-700 dark:text-gray-300 truncate">{slotLabel(slot)}</span>
								<span class="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">{slotNextIn(slot).toFixed(1)}s</span>
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
					<a href="/darkrift/barracks" class="rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Barracks</a>
					<a href="/darkrift/scavenging" class="rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Scavenging</a>
				</div>
			{/if}
		</div>
	</div>
</div>
