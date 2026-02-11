<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const incrementalNav = [
		{ label: 'Training & Mining', path: '/incremental' },
		{ label: 'Hero Tavern', path: '/incremental/tavern' },
		{ label: 'Lineups', path: '/incremental/lineup' },
		{ label: 'Run (Map)', path: '/incremental/run' },
		{ label: 'Talents', path: '/incremental/talents' },
		{ label: 'Atlas', path: '/incremental/atlas' }
	];

	function isActive(path: string): boolean {
		const p = $page.url.pathname;
		if (path === '/incremental') return p === '/incremental';
		return p === path || p.startsWith(path + '/');
	}
</script>

<div class="w-full flex flex-col">
	<nav class="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-3 py-2 flex flex-wrap items-center gap-1 sm:gap-2">
		{#each incrementalNav as item}
			<a
				href={item.path}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.path)
					? 'bg-primary text-primary-foreground'
					: 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}"
			>
				{item.label}
			</a>
		{/each}
	</nav>
	<main class="flex-1 min-h-0">
		{@render children?.()}
	</main>
</div>
