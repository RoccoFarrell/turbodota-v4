<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Icon or emoji to display */
		icon: string;
		/** Card title, e.g. "Essence Mine" or "Arcane Sanctum" */
		name: string;
		/** Short description of what this card does */
		description: string;
		/** Stat label, e.g. "Spell Power" (optional, for buildings) */
		stat?: string;
		/** Rate description, e.g. "+1 Essence per strike" or "+1 per 5.0s" */
		rate?: string;
		/** Duration description, e.g. "3.0s per strike" */
		duration?: string;
		/** Whether this action is currently active in a slot */
		isActive?: boolean;
		/** Which slot this is active in (display only) */
		activeSlotLabel?: string;
		/** Active detail text, e.g. hero name + stat value */
		activeDetail?: string;
		/** Whether this card is locked */
		isLocked?: boolean;
		/** Upgrade level text, e.g. "Level 3" */
		upgradeLevel?: string;
		/** Optional slot for additional content (e.g. hero selector) */
		actions?: Snippet;
	}

	let {
		icon,
		name,
		description,
		stat,
		rate,
		duration,
		isActive = false,
		activeSlotLabel,
		activeDetail,
		isLocked = false,
		upgradeLevel,
		actions
	}: Props = $props();
</script>

<div
	class="rounded-lg border p-4 transition-colors {isActive
		? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
		: isLocked
			? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/30 opacity-50'
			: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'}"
>
	<div class="flex items-start gap-3">
		<!-- Icon -->
		<div class="shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
			{icon}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
				{#if stat}
					<span class="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{stat}</span>
				{/if}
				{#if upgradeLevel}
					<span class="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{upgradeLevel}</span>
				{/if}
				{#if isLocked}
					<span class="text-xs text-gray-400 inline-flex items-center gap-1"><span class="gi w-3 h-3 text-gray-500" style="--gi: url(/game-icons/ffffff/transparent/1x1/lorc/padlock.svg)"></span> Locked</span>
				{/if}
			</div>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>

			<!-- Rate and duration -->
			{#if rate || duration}
				<div class="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-300">
					{#if rate}
						<span class="flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
							{rate}
						</span>
					{/if}
					{#if duration}
						<span class="flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M12 6v6l4 2" /></svg>
							{duration}
						</span>
					{/if}
				</div>
			{/if}

			<!-- Active state -->
			{#if isActive}
				<div class="mt-2 flex items-center gap-2 text-xs">
					<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
						<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
						Active{#if activeSlotLabel} · {activeSlotLabel}{/if}
					</span>
					{#if activeDetail}
						<span class="text-gray-600 dark:text-gray-300">{activeDetail}</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Actions slot (buttons, selectors) -->
	{#if actions && !isLocked}
		<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
			{@render actions()}
		</div>
	{/if}
</div>
