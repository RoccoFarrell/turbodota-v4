<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';
	import HeroCard from '$lib/incremental/components/HeroCard.svelte';
	import type { HeroDef } from '$lib/incremental/types';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	let heroesFromApi = $state<{ heroes: HeroDef[]; heroNames: Array<{ heroId: number; localizedName: string }> }>({
		heroes: [],
		heroNames: []
	});
	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));

	function heroName(heroId: number): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let lineups = $state<Array<{ id: string; saveId: string; name: string; heroIds: number[] }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let startingRunId = $state<string | null>(null);

	async function ensureSave() {
		if (saveId) return;
		const res = await fetch('/api/incremental/saves');
		if (res.ok) {
			const list = await res.json();
			saves = list;
			if (list.length > 0) saveId = list[0].id;
		}
		if (!saveId) {
			const w = await fetch('/api/incremental/bank');
			if (w.ok) {
				const data = await w.json();
				saveId = data.saveId ?? null;
			}
		}
	}

	async function fetchLineups() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/lineups${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			lineups = data.lineups ?? [];
		}
	}

	async function fetchRoster() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			rosterHeroIds = data.heroIds ?? [];
		}
	}

	async function fetchHeroes() {
		const res = await fetch('/api/incremental/heroes');
		if (res.ok) {
			const data = await res.json();
			heroesFromApi = { heroes: data.heroes ?? [], heroNames: data.heroNames ?? [] };
		}
	}

	async function refresh() {
		await fetchLineups();
		await fetchRoster();
	}

	async function startRun(lineupId: string) {
		startingRunId = lineupId;
		try {
			const res = await fetch('/api/incremental/runs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lineupId })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({ title: 'Start run failed', description: data.message ?? res.statusText });
				return;
			}
			const runId = data.runId ?? data.runState?.runId;
			if (runId) {
				toaster.success({ title: 'Run started' });
				goto(`/incremental/run/${runId}`);
			} else {
				toaster.error({ title: 'Start run failed', description: 'No run ID returned' });
			}
		} finally {
			startingRunId = null;
		}
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await fetchHeroes();
			await fetchLineups();
			await fetchRoster();
		})();
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Lineups</h1>
		<a
			href="/incremental/lineup/new"
			class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
		>
			New lineup
		</a>
	</div>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label for="lineup-save" class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				id="lineup-save"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={refresh}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		{#if lineups.length === 0}
			<p class="text-gray-600 dark:text-gray-400">
				No lineups yet. Create one with 1–5 heroes from your roster.
			</p>
			<a
				href="/incremental/lineup/new"
				class="mt-3 inline-block text-sm text-primary hover:underline"
			>
				Create your first lineup →
			</a>
		{:else}
			<ul class="space-y-3">
				{#each lineups as lineup}
					<li
						class="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-800/80"
					>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-gray-900 dark:text-gray-100">{lineup.name}</p>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each lineup.heroIds as hid}
									<HeroCard
										heroId={hid}
										displayName={heroName(hid)}
										def={heroById.get(hid) ?? null}
										variant="compact"
									/>
								{/each}
							</div>
						</div>
						<div class="flex shrink-0 gap-2">
							<a
								href="/incremental/lineup/{lineup.id}"
								class="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								Edit
							</a>
							<button
								type="button"
								class="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
								disabled={startingRunId !== null}
								onclick={() => startRun(lineup.id)}
							>
								{startingRunId === lineup.id ? 'Starting…' : 'Start run'}
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<p class="text-sm text-gray-500 dark:text-gray-400">
		<a href="/incremental" class="text-primary hover:underline">← Back to Incremental</a>
	</p>
</div>
