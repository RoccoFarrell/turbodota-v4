<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toaster } from '$lib/toaster';

	const runId = $derived($page.params.runId);

	let runState = $state<{
		runId: string;
		status: string;
		currentNodeId: string;
		nextNodeIds: string[];
	} | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(() => {
		(async () => {
			try {
				const res = await fetch(`/api/incremental/runs/${runId}`);
				if (!res.ok) {
					if (res.status === 404) error = 'Run not found';
					else error = res.statusText;
					loading = false;
					return;
				}
				runState = await res.json();
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load run';
			} finally {
				loading = false;
			}
		})();
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Run</h1>

	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading run…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
		<a href="/incremental/lineup" class="text-sm text-primary hover:underline">← Back to Lineups</a>
	{:else if runState}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				<strong>Status:</strong> {runState.status}
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				<strong>Current node:</strong> {runState.currentNodeId || '(start)'}
			</p>
			{#if runState.nextNodeIds && runState.nextNodeIds.length > 0}
				<p class="text-sm text-gray-500 dark:text-gray-400">
					<strong>Next choices:</strong> {runState.nextNodeIds.join(', ')}
				</p>
			{/if}
			<p class="text-sm text-gray-600 dark:text-gray-300 mt-4">
				Map and battle UI coming in the next phase. For now you can start a run and see its state here.
			</p>
		</section>

		<p class="text-sm text-gray-500 dark:text-gray-400">
			<a href="/incremental/lineup" class="text-primary hover:underline">← Back to Lineups</a>
			·
			<a href="/incremental" class="text-primary hover:underline">Incremental</a>
		</p>
	{/if}
</div>
