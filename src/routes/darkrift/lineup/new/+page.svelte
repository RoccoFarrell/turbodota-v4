<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));
	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));

	function heroName(heroId: number): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}
	function getHeroDef(heroId: number): HeroDef | undefined {
		return heroById.get(heroId);
	}

	const ATTR_COLORS: Record<string, string> = {
		str: 'bg-red-500/20 text-red-400',
		agi: 'bg-green-500/20 text-green-400',
		int: 'bg-blue-500/20 text-blue-400',
		universal: 'bg-purple-500/20 text-purple-400'
	};

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let trainingByHero = $state<Record<number, Record<string, number>>>({});
	let name = $state('');
	let slots = $state<(number | null)[]>([null]);
	let saving = $state(false);

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
				byHero[row.heroId][row.statKey] = row.effectiveStat;
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
			const res = await fetch('/api/incremental/lineups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, name: name.trim(), heroIds })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({ title: 'Create failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Lineup created' });
			goto('/darkrift/lineup');
		} finally {
			saving = false;
		}
	}

	async function refreshAll() {
		await Promise.all([fetchRoster(), fetchHeroes(), fetchTraining()]);
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await refreshAll();
		})();
	});
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
	<!-- Breadcrumb -->
	<nav class="text-sm text-gray-500">
		<a href="/darkrift/lineup" class="text-primary hover:underline">Lineups</a>
		<span class="mx-1.5">/</span>
		<span class="text-gray-300">New</span>
	</nav>

	<h1 class="text-2xl font-bold text-gray-100">New lineup</h1>

	{#if saves.length > 1}
		<section class="rounded-xl border border-gray-700 bg-gray-900/80 p-3">
			<label for="new-lineup-save" class="text-sm font-medium text-gray-400">Save</label>
			<select
				id="new-lineup-save"
				class="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
				bind:value={saveId}
				onchange={refreshAll}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Hero picker -->
		<div class="lg:col-span-2 rounded-xl border border-gray-700 bg-gray-900/80 p-4 space-y-4">
			<div>
				<label for="lineup-name" class="text-sm font-medium text-gray-400">Name</label>
				<input
					id="lineup-name"
					type="text"
					class="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500"
					placeholder="e.g. Magic squad"
					bind:value={name}
				/>
			</div>

			<div>
				<p class="text-sm font-medium text-gray-400 mb-2">Heroes (1-5 from roster)</p>
				{#if rosterHeroIds.length === 0}
					<p class="text-sm text-gray-500">
						No heroes on your roster. Convert a win on the
						<a href="/darkrift" class="text-primary hover:underline">Incremental</a> page first.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each slots as slot, i}
							{@const selectedDef = slot != null ? getHeroDef(slot) : undefined}
							<li class="flex items-center gap-2">
								<span class="text-xs font-mono text-gray-500 w-4 text-center shrink-0">{i + 1}</span>
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
									<div class="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
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

			<div class="flex gap-2 pt-2 border-t border-gray-700/60">
				<button
					type="button"
					class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
					disabled={saving || rosterHeroIds.length === 0 || selectedHeroIds.length < MIN_SLOTS}
					onclick={save}
				>
					{saving ? 'Creating…' : 'Create lineup'}
				</button>
				<a
					href="/darkrift/lineup"
					class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
				>
					Cancel
				</a>
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
						<span class="text-xs text-amber-400 uppercase font-semibold">Auto DPS</span>
						<span class="text-sm font-bold text-amber-300">{fmtDps(previewStats.totalAutoDps)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-xs text-blue-400 uppercase font-semibold">Spell DPS</span>
						<span class="text-sm font-bold text-blue-300">{fmtDps(previewStats.totalSpellDps)}</span>
					</div>
					<div class="flex justify-between items-center border-t border-gray-700/60 pt-2">
						<span class="text-xs text-white/60 uppercase font-semibold">Total DPS</span>
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
						<span class="text-xs text-green-400 uppercase font-semibold">Total HP</span>
						<span class="text-sm font-bold text-green-300">{previewStats.totalHp.toLocaleString()}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-xs text-gray-400 uppercase font-semibold">Avg Armor</span>
						<span class="text-sm font-bold text-gray-300">{previewStats.avgArmor.toFixed(1)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-xs text-cyan-400 uppercase font-semibold">Avg MR</span>
						<span class="text-sm font-bold text-cyan-300">{Math.round(previewStats.avgMagicResist * 100)}%</span>
					</div>
				</div>

				<!-- Per-hero breakdown -->
				<div class="space-y-1 pt-2 border-t border-gray-700/60">
					<p class="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Per Hero</p>
					{#each previewStats.heroStats as hs}
						{@const def = getHeroDef(hs.heroId)}
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
</div>
