<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';
	import LineupCard from '$lib/incremental/components/LineupCard.svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	let heroesFromApi = $state<{
		heroes: HeroDef[];
		heroNames: Array<{ heroId: number; localizedName: string }>;
		abilityDefs: Record<string, AbilityDef>;
	}>({
		heroes: [],
		heroNames: [],
		abilityDefs: {}
	});
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));
	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	function getHeroDef(heroId: number): HeroDef | undefined {
		return heroById.get(heroId);
	}
	function getAbilityDef(abilityId: string): AbilityDef | undefined {
		return heroesFromApi.abilityDefs[abilityId];
	}

	function heroName(heroId: number): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	type ActiveRunSummary = {
		runId: string;
		status: string;
		currentNodeId: string;
		startedAt: number;
	};
	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let lineups = $state<
		Array<{ id: string; saveId: string; name: string; heroIds: number[]; activeRun: ActiveRunSummary | null }>
	>([]);
	let rosterHeroIds = $state<number[]>([]);
	let startingRunId = $state<string | null>(null);
	let cancellingRunId = $state<string | null>(null);
	let deletingLineupId = $state<string | null>(null);

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
		const res = await fetch(`/api/incremental/lineups${saveParam()}`, { cache: 'no-store' });
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
		const res = await fetch(`/api/incremental/heroes${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			heroesFromApi = {
				heroes: data.heroes ?? [],
				heroNames: data.heroNames ?? [],
				abilityDefs: data.abilityDefs ?? {}
			};
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

	async function cancelRun(runId: string) {
		cancellingRunId = runId;
		try {
			const res = await fetch(`/api/incremental/runs/${runId}/cancel`, { method: 'POST' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({
					title: 'Cancel run failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			toaster.success({ title: 'Run cancelled', description: 'You can start a new run for this lineup.' });
			await fetchLineups();
		} finally {
			cancellingRunId = null;
		}
	}

	function updateLineupOrder(lineupId: string, newHeroIds: number[]) {
		lineups = lineups.map((l) => (l.id === lineupId ? { ...l, heroIds: newHeroIds } : l));
	}

	async function deleteLineup(lineupId: string) {
		deletingLineupId = lineupId;
		try {
			const res = await fetch(`/api/incremental/lineups/${lineupId}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toaster.error({
					title: 'Delete failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			toaster.success({ title: 'Lineup deleted' });
			await fetchLineups();
		} finally {
			deletingLineupId = null;
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

	<section class="space-y-3">
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
			{#each lineups as lineup}
				<LineupCard
					name={lineup.name}
					lineupId={lineup.id}
					heroIds={lineup.heroIds}
					getHeroName={heroName}
					variant="lineups"
					showActions={true}
					activeRun={lineup.activeRun}
					getHeroDef={getHeroDef}
					getAbilityDef={getAbilityDef}
					onDelete={() => deleteLineup(lineup.id)}
					onStartRun={() => startRun(lineup.id)}
					onCancelRun={cancelRun}
					onUpdate={(newHeroIds) => newHeroIds && updateLineupOrder(lineup.id, newHeroIds)}
					startingRunId={startingRunId}
					cancellingRunId={cancellingRunId}
					deletingLineupId={deletingLineupId}
					onConfirmDelete={(lineupName) => confirm(`Delete lineup "${lineupName}"? This cannot be undone.`)}
				/>
			{/each}
		{/if}
	</section>

	<p class="text-sm text-gray-500 dark:text-gray-400">
		<a href="/incremental" class="text-primary hover:underline">← Back to Incremental</a>
	</p>
</div>
