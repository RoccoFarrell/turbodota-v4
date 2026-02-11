<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let runs = $state<Array<{ id: string; status: string; startedAt: string }>>([]);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/incremental/runs');
			if (!res.ok) {
				error = res.status === 401 ? 'Sign in to view runs' : 'Failed to load runs';
				loading = false;
				return;
			}
			const data = await res.json();
			runs = data.runs ?? [];
			// If user has an active run, go straight to the map
			const active = runs.find((r) => r.status === 'ACTIVE' || r.status === 'active');
			if (active) {
				await goto(`/incremental/run/${active.id}`);
				return;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load runs';
		} finally {
			loading = false;
		}
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Run</h1>

	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
		<a href="/incremental/lineup" class="text-sm text-primary hover:underline">← Lineups</a>
	{:else}
		<p class="text-gray-600 dark:text-gray-300">
			You have no active run. Start one from a lineup to open the map and play.
		</p>
		<a
			href="/incremental/lineup"
			class="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
		>
			Go to Lineups →
		</a>
		{#if runs.length > 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Previous runs (finished): you can start a new run from Lineups.
			</p>
		{/if}
	{/if}
</div>
