<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions/constants';
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';

	interface Props {
		open: boolean;
		onOpenChange: (details: { open: boolean }) => void;
		slots: SlotState[];
		heroName: (id: number, fallback?: string) => string;
		slotDisplayProgress: (slot: SlotState) => number;
		onCancel: (slotIndex: number) => void;
	}

	let {
		open,
		onOpenChange,
		slots,
		heroName,
		slotDisplayProgress,
		onCancel
	}: Props = $props();

	const trainingSlots = $derived(
		slots.filter((s) => s.actionType === 'training' && s.actionStatKey != null)
	);

	function handleCancel(slotIndex: number) {
		onCancel(slotIndex);
	}
</script>

<Dialog {open} {onOpenChange}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
				<div class="text-center">
					<Dialog.Title class="text-lg font-bold text-gray-900 dark:text-gray-100">
						All Training Slots Occupied
					</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Cancel an active training to free a slot.
					</Dialog.Description>
				</div>

				<div class="space-y-2">
					{#each trainingSlots as slot}
						{@const building = TRAINING_BUILDINGS[slot.actionStatKey as TrainingStatKey]}
						{@const prog = slotDisplayProgress(slot)}
						<div class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
							<span
								class="gi w-5 h-5 shrink-0 {building?.color ?? 'text-gray-400'}"
								style="--gi: url({building?.icon})"
								aria-hidden="true"
							></span>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
									{slot.actionHeroId != null ? heroName(slot.actionHeroId) : 'Unknown'}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{building?.name ?? slot.actionStatKey} · {Math.round(prog * 100)}%
								</p>
							</div>
							<button
								type="button"
								onclick={() => handleCancel(slot.slotIndex)}
								class="shrink-0 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
							>
								Cancel
							</button>
						</div>
					{/each}
				</div>

				<Dialog.CloseTrigger
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					Nevermind
				</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
