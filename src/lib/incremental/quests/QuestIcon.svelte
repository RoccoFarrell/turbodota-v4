<!--
  Quest icons — simple SVGs in the style of game-icons.net (https://game-icons.net/).
  Each icon matches the quest theme: crosshair (last hits), shield (denies), etc.
-->
<script lang="ts">
	import type { QuestIconId } from './quest-definitions';

	interface Props {
		iconId: QuestIconId | string | null | undefined;
		/** Size in pixels. Default 24. */
		size?: number;
		/** Optional class for the wrapper. */
		class?: string;
		/** Optional class for the SVG (e.g. text-amber-500). Defaults to gray. */
		iconClass?: string;
	}

	let { iconId, size = 24, class: className = '', iconClass = 'text-gray-700 dark:text-gray-300' }: Props = $props();

	const viewBox = '0 0 24 24';
</script>

{#if iconId}
	<div class="shrink-0 inline-flex items-center justify-center {className}" style="width: {size}px; height: {size}px;">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={viewBox}
			width={size}
			height={size}
			aria-hidden="true"
			class={iconClass}
			fill="currentColor"
		>
			{#if iconId === 'crosshair'}
				<!-- Crosshair / target - last hits -->
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" />
				<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
				<path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			{:else if iconId === 'shield'}
				<!-- Shield - denies -->
				<path d="M12 2L4 6v6c0 5.5 3.8 9.7 8 11 4.2-1.3 8-5.5 8-11V6l-8-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
			{:else if iconId === 'coins'}
				<!-- Stack of coins - net worth -->
				<ellipse cx="12" cy="14" rx="6" ry="2" fill="none" stroke="currentColor" stroke-width="1.5" />
				<path d="M6 14v2c0 1.1 2.7 2 6 2s6-.9 6-2v-2" fill="none" stroke="currentColor" stroke-width="1.5" />
				<path d="M6 12c0 1.1 2.7 2 6 2s6-.9 6-2" fill="none" stroke="currentColor" stroke-width="1.5" />
				<ellipse cx="12" cy="10" rx="6" ry="2" fill="none" stroke="currentColor" stroke-width="1.5" />
			{:else if iconId === 'sword'}
				<!-- Sword - hero damage -->
				<path d="M6 2l3 3-4 4 2 2 4-4 3 3-2 2-1-1-2 2-4-4-2-2 4-4L6 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
				<path d="M14 10l6 6-2 2-6-6 2-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
				<path d="M4 20l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			{:else if iconId === 'tower'}
				<!-- Tower / building - building damage -->
				<path d="M12 2l-4 5h2v4H8l4 5 4-5h-2V7h2L12 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
				<path d="M6 22h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			{:else if iconId === 'heart'}
				<!-- Heart - healing -->
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
			{:else if iconId === 'pickaxe'}
				<!-- Pickaxe - scavenging/mining -->
				<path d="M14.5 3.5l6 6M17 3l4 4M14 10l-9 9-2.5.5.5-2.5 9-9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			{:else if iconId === 'users'}
				<!-- Two people - recruit -->
				<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				<circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
				<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			{:else if iconId === 'swords'}
				<!-- Crossed swords - lineup -->
				<path d="M5 3l6 6M3 5l2-2M19 3l-6 6M21 5l-2-2M7 17l-4 4M17 17l4 4M12 12l-5 5M12 12l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			{:else if iconId === 'portal'}
				<!-- Portal ring - dark rift -->
				<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5" />
				<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
				<path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			{:else}
				<!-- Fallback: quest scroll -->
				<path d="M6 2h12v4H6V2zM4 8h16v14H4V8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
			{/if}
		</svg>
	</div>
{/if}
