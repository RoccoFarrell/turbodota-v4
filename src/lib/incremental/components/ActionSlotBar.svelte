<script lang="ts">
	interface Props {
		/** Slot display label, e.g. "Slot 1" */
		slotLabel: string;
		/** Action description, e.g. "Mining" or "Training Lina - Spell Power" */
		actionLabel: string;
		/** Progress 0..1 */
		progress: number;
		/** Seconds until next completion */
		nextIn: number;
		/** Rate description, e.g. "+1 Essence per strike" */
		rateLabel?: string;
		/** Whether this slot is actively ticking */
		isActive: boolean;
		/** Whether the slot is empty (no action assigned) */
		isEmpty?: boolean;
		/** Whether the slot is locked (not unlocked yet) */
		isLocked?: boolean;
		/** Callback when stop/clear is clicked */
		onStop?: () => void;
	}

	let {
		slotLabel,
		actionLabel,
		progress,
		nextIn,
		rateLabel,
		isActive,
		isEmpty = false,
		isLocked = false,
		onStop
	}: Props = $props();
</script>

{#if isLocked}
	<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/30 p-3 opacity-50">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{slotLabel}</span>
				<span class="text-sm text-gray-400 dark:text-gray-500">🔒 Unlock in Talent Tree</span>
			</div>
		</div>
	</div>
{:else if isEmpty}
	<div class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 p-3">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{slotLabel}</span>
				<span class="text-sm text-gray-400 dark:text-gray-500 italic">Assign an action below</span>
			</div>
		</div>
	</div>
{:else}
	<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3 {isActive ? 'ring-1 ring-primary/30' : ''}">
		<div class="flex items-center justify-between gap-2 mb-1.5">
			<div class="flex items-center gap-2 min-w-0">
				<span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase shrink-0">{slotLabel}</span>
				<span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{actionLabel}</span>
			</div>
			{#if onStop}
				<button
					class="shrink-0 rounded px-2 py-0.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
					onclick={onStop}
				>
					Clear
				</button>
			{/if}
		</div>
		<div class="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
			<div
				class="h-full bg-primary transition-[width] duration-75 ease-linear"
				style="width: {Math.min(100, progress * 100)}%"
			></div>
		</div>
		<div class="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
			<span>
				{#if isActive}
					{nextIn > 0 ? `Next in ${nextIn.toFixed(1)}s` : 'Completing...'}
				{:else}
					Paused
				{/if}
			</span>
			{#if rateLabel}
				<span>{rateLabel}</span>
			{/if}
		</div>
	</div>
{/if}
