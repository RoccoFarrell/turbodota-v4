<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { computeLineupStats } from '$lib/incremental/stats/lineup-stats';

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
	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));

	function heroName(heroId: number): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}
	function getHeroDef(heroId: number): HeroDef | undefined {
		return heroById.get(heroId);
	}

	const lineupId = $derived($page.params.id);

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let trainingByHero = $state<Record<number, Record<string, number>>>({});
	let name = $state('');
	let slots = $state<(number | null)[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let startingRun = $state(false);

	const MIN_SLOTS = 1;
	const MAX_SLOTS = 5;

	// Live lineup stats preview
	const selectedHeroIds = $derived(slots.filter((s): s is number => s !== null));
	const previewStats = $derived(
		computeLineupStats(selectedHeroIds, getHeroDef, heroesFromApi.abilityDefs, trainingByHero)
	);

	function fmtDps(v: number): string {
		return v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1);
	}

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	async function ensureSave() {
		if (saveId) return;
		const res = await fetch('/api/incremental/saves');
		if (res.ok) {
			const list = await res.json();
			saves = list;
			if (list.length > 0) saveId = list[0].id;
		}
	}

	async function fetchLineup() {
		const res = await fetch(`/api/incremental/lineups/${lineupId}`);
		if (!res.ok) {
			toaster.error({ title: 'Lineup not found', description: res.statusText });
			goto('/incremental/lineup');
			return;
		}
		const lineup = await res.json();
		name = lineup.name ?? '';
		slots = (lineup.heroIds ?? []).length > 0 ? [...lineup.heroIds] : [null];
		saveId = lineup.saveId ?? saveId;
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
		// Bug fix: fetch with saveId so hero defs include training-baked stats
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

	function addSlot() {
		if (slots.length < MAX_SLOTS) slots = [...slots, null];
	}

	function removeSlot(index: number) {
		if (slots.length <= MIN_SLOTS) return;
		slots = slots.filter((_, i) => i !== index);
	}

	function setSlot(index: number, value: string) {
		const n = value === '' ? null : parseInt(value, 10);
		if (Number.isNaN(n)) return;
		const next = [...slots];
		next[index] = n;
		slots = next;
	}

	function availableForSlot(index: number): number[] {
		const pickedElsewhere = slots.filter((s, j) => j !== index && s !== null) as number[];
		return rosterHeroIds.filter((hid) => slots[index] === hid || !pickedElsewhere.includes(hid));
	}

	async function save() {
		const heroIds = selectedHeroIds;
		if (heroIds.length < MIN_SLOTS) {
			toaster.error({ title: 'Invalid lineup', description: 'Pick at least one hero.' });
			return;
		}
		if (new Set(heroIds).size !== heroIds.length) {
			toaster.error({ title: 'Invalid lineup', description: 'Each hero can only appear once.' });
			return;
		}
		if (!name.trim()) {
			toaster.error({ title: 'Invalid lineup', description: 'Enter a name.' });
			return;
		}
		saving = true;
		try {
			const res = await fetch(`/api/incremental/lineups/${lineupId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), heroIds })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({ title: 'Update failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Lineup updated' });
			goto('/incremental/lineup');
		} finally {
			saving = false;
		}
	}

	async function deleteLineup() {
		if (!confirm('Delete this lineup?')) return;
		deleting = true;
		try {
			const res = await fetch(`/api/incremental/lineups/${lineupId}`, { method: 'DELETE' });
			if (!res.ok) {
				toaster.error({ title: 'Delete failed', description: res.statusText });
				return;
			}
			toaster.success({ title: 'Lineup deleted' });
			goto('/incremental/lineup');
		} finally {
			deleting = false;
		}
	}

	async function startRun() {
		startingRun = true;
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
			startingRun = false;
		}
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await fetchLineup();
			// After fetchLineup sets saveId, fetch the rest in parallel
			await Promise.all([fetchRoster(), fetchHeroes(), fetchTraining()]);
			loading = false;
		})();
	});
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
	{#if loading}
		<p class="text-gray-400">Loading...</p>
	{:else}
		<!-- Breadcrumb -->
		<nav class="text-sm text-gray-500">
			<a href="/incremental/lineup" class="text-primary hover:underline">Lineups</a>
			<span class="mx-1.5">/</span>
			<span class="text-gray-300">Edit</span>
		</nav>

		<h1 class="text-2xl font-bold text-gray-100">Edit lineup</h1>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left: Hero picker -->
			<div class="lg:col-span-2 rounded-xl border border-gray-700 bg-gray-900/80 p-4 space-y-4">
				<div>
					<label for="edit-lineup-name" class="text-sm font-medium text-gray-400">Name</label>
					<input
						id="edit-lineup-name"
						type="text"
						class="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500"
						bind:value={name}
					/>
				</div>

				<div>
					<p class="text-sm font-medium text-gray-400 mb-2">Heroes (1-5 from roster)</p>
					{#if rosterHeroIds.length === 0}
						<p class="text-sm text-gray-500">No heroes on your roster for this save.</p>
					{:else}
						<ul class="space-y-2">
							{#each slots as slot, i}
								{@const selectedDef = slot != null ? getHeroDef(slot) : undefined}
								<li class="flex items-center gap-2">
									<span class="text-[11px] font-mono text-gray-500 w-4 text-center shrink-0">{i + 1}</span>
									{#if slot != null}
										<span class="d2mh hero-{slot} shrink-0 w-7 h-7 rounded bg-gray-700" aria-hidden="true"></span>
									{/if}
									<select
										class="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 text-sm"
										value={slot ?? ''}
										onchange={(e) => setSlot(i, (e.currentTarget as HTMLSelectElement).value)}
									>
										<option value="">-- Select hero --</option>
										{#each availableForSlot(i) as hid}
											{@const hDef = getHeroDef(hid)}
											<option value={hid}>
												{heroName(hid)}{#if hDef} ({hDef.primaryAttribute.toUpperCase()}){/if}
											</option>
										{/each}
									</select>
									{#if selectedDef}
										<div class="hidden sm:flex items-center gap-1.5 text-[10px] shrink-0">
											<span class="rounded bg-green-500/15 px-1 py-0.5 text-green-400">{selectedDef.baseMaxHp} HP</span>
											<span class="rounded bg-amber-500/15 px-1 py-0.5 text-amber-400">{selectedDef.baseAttackDamage} DMG</span>
										</div>
									{/if}
									{#if slots.length > MIN_SLOTS}
										<button
											type="button"
											class="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
											onclick={() => removeSlot(i)}
											aria-label="Remove slot"
										>
											Remove
										</button>
									{/if}
								</li>
							{/each}
						</ul>
						{#if slots.length < MAX_SLOTS}
							<button
								type="button"
								class="mt-3 w-full rounded-lg border border-dashed border-gray-600 px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 hover:border-gray-500 transition-colors"
								onclick={addSlot}
							>
								+ Add hero slot
							</button>
						{/if}
					{/if}
				</div>

				<div class="flex flex-wrap gap-2 pt-2 border-t border-gray-700/60">
					<button
						type="button"
						class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
						disabled={saving || rosterHeroIds.length === 0 || selectedHeroIds.length < MIN_SLOTS}
						onclick={save}
					>
						{saving ? 'Saving…' : 'Save'}
					</button>
					<button
						type="button"
						class="rounded-lg bg-emerald-600/70 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
						disabled={startingRun || selectedHeroIds.length < MIN_SLOTS}
						onclick={startRun}
					>
						{startingRun ? 'Starting…' : 'Start run'}
					</button>
					<a
						href="/incremental/lineup"
						class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
					>
						Cancel
					</a>
					<button
						type="button"
						class="rounded-lg border border-red-800/60 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 transition-colors"
						disabled={deleting}
						onclick={deleteLineup}
					>
						{deleting ? 'Deleting…' : 'Delete lineup'}
					</button>
				</div>
			</div>

			<!-- Right: Live stats preview -->
			<div class="rounded-xl border border-gray-700 bg-gray-900/80 p-4 space-y-4 h-fit">
				<h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider">Lineup Preview</h2>

				{#if selectedHeroIds.length === 0}
					<p class="text-sm text-gray-500">Select heroes to see stats</p>
				{:else}
					<!-- Aggregate stats -->
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<span class="text-[11px] text-amber-400 uppercase font-semibold">Auto DPS</span>
							<span class="text-sm font-bold text-amber-300">{fmtDps(previewStats.totalAutoDps)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-[11px] text-blue-400 uppercase font-semibold">Spell DPS</span>
							<span class="text-sm font-bold text-blue-300">{fmtDps(previewStats.totalSpellDps)}</span>
						</div>
						<div class="flex justify-between items-center border-t border-gray-700/60 pt-2">
							<span class="text-[11px] text-white/60 uppercase font-semibold">Total DPS</span>
							<span class="text-base font-bold text-white">{fmtDps(previewStats.totalDps)}</span>
						</div>
					</div>

					<!-- DPS bar -->
					{#if previewStats.totalDps > 0}
						{@const autoP = (previewStats.totalAutoDps / previewStats.totalDps) * 100}
						<div class="h-2 rounded-full bg-gray-800 overflow-hidden flex">
							{#if autoP > 0}
								<div class="h-full bg-amber-500/80" style="width: {autoP}%"></div>
							{/if}
							{#if autoP < 100}
								<div class="h-full bg-blue-500/80" style="width: {100 - autoP}%"></div>
							{/if}
						</div>
					{/if}

					<!-- Defensive stats -->
					<div class="space-y-1.5 pt-2 border-t border-gray-700/60">
						<div class="flex justify-between items-center">
							<span class="text-[11px] text-green-400 uppercase font-semibold">Total HP</span>
							<span class="text-sm font-bold text-green-300">{previewStats.totalHp.toLocaleString()}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-[11px] text-gray-400 uppercase font-semibold">Avg Armor</span>
							<span class="text-sm font-bold text-gray-300">{previewStats.avgArmor.toFixed(1)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-[11px] text-cyan-400 uppercase font-semibold">Avg MR</span>
							<span class="text-sm font-bold text-cyan-300">{Math.round(previewStats.avgMagicResist * 100)}%</span>
						</div>
					</div>

					<!-- Per-hero breakdown -->
					<div class="space-y-1 pt-2 border-t border-gray-700/60">
						<p class="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1">Per Hero</p>
						{#each previewStats.heroStats as hs}
							<div class="flex items-center gap-2 text-xs">
								<span class="d2mh hero-{hs.heroId} shrink-0 w-5 h-5 rounded bg-gray-700" aria-hidden="true"></span>
								<span class="truncate text-gray-300 flex-1">{heroName(hs.heroId)}</span>
								<span class="text-amber-400 tabular-nums">{fmtDps(hs.autoDps)}</span>
								<span class="text-blue-400 tabular-nums">{fmtDps(hs.spellDps)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
