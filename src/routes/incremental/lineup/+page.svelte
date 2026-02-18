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
	let trainingByHero = $state<Record<number, Record<string, number>>>({});
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

	async function fetchTraining() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/training${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			const byHero: Record<number, Record<string, number>> = {};
			for (const row of data.training ?? []) {
				if (!byHero[row.heroId]) byHero[row.heroId] = {};
				byHero[row.heroId][row.statKey] = row.value;
			}
			trainingByHero = byHero;
		}
	}

	async function refresh() {
		await Promise.all([fetchLineups(), fetchRoster(), fetchTraining()]);
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
			await Promise.all([fetchHeroes(), fetchTraining(), fetchLineups(), fetchRoster()]);
		})();
	});
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-100">Lineups</h1>
			<p class="text-sm text-gray-500 mt-0.5">Manage your hero teams for atlas runs</p>
		</div>
		<a
			href="/incremental/lineup/new"
			class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30"
		>
			+ New lineup
		</a>
	</div>

	{#if saves.length > 1}
		<section class="rounded-xl border border-gray-700 bg-gray-900/80 p-3">
			<label for="lineup-save" class="text-sm font-medium text-gray-400">Save</label>
			<select
				id="lineup-save"
				class="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
				bind:value={saveId}
				onchange={refresh}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<section class="space-y-4">
		{#if lineups.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
				<p class="text-gray-400 mb-3">
					No lineups yet. Create a team of 1-5 heroes from your roster.
				</p>
				<a
					href="/incremental/lineup/new"
					class="inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
				>
					Create your first lineup
				</a>
			</div>
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
					abilityDefs={heroesFromApi.abilityDefs}
					{trainingByHero}
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

	<p class="text-sm text-gray-500">
		<a href="/incremental" class="text-primary hover:underline">← Back to Incremental</a>
	</p>
</div>
