<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';
	import type { HeroDef } from '$lib/incremental/types';
	import HeroCard from '$lib/incremental/components/HeroCard.svelte';

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

	const lineupId = $derived($page.params.id);

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let name = $state('');
	/** 1–5 slots; null = empty slot */
	let slots = $state<(number | null)[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let startingRunId = $state(false);

	const MIN_SLOTS = 1;
	const MAX_SLOTS = 5;

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
		const res = await fetch('/api/incremental/heroes');
		if (res.ok) {
			const data = await res.json();
			heroesFromApi = { heroes: data.heroes ?? [], heroNames: data.heroNames ?? [] };
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

	/** Heroes available for this slot: roster minus those already picked in other slots (each hero once per lineup). */
	function availableForSlot(index: number): number[] {
		const pickedElsewhere = slots.filter((s, j) => j !== index && s !== null) as number[];
		return rosterHeroIds.filter((hid) => slots[index] === hid || !pickedElsewhere.includes(hid));
	}

	async function save() {
		const heroIds = slots.filter((s): s is number => s !== null);
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
		startingRunId = true;
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
			startingRunId = false;
		}
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await fetchLineup();
			await fetchRoster();
			await fetchHeroes();
			loading = false;
		})();
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading…</p>
	{:else}
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Edit lineup</h1>

		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">
			<div>
				<label for="edit-lineup-name" class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
				<input
					id="edit-lineup-name"
					type="text"
					class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
					bind:value={name}
				/>
			</div>

			<div>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Heroes (1–5 from roster)</p>
				{#if rosterHeroIds.length === 0}
					<p class="text-sm text-gray-500 dark:text-gray-400">No heroes on your roster for this save.</p>
				{:else}
					<ul class="space-y-2">
						{#each slots as slot, i}
							<li class="flex items-center gap-2">
								<select
									class="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
									value={slot ?? ''}
									onchange={(e) => setSlot(i, (e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="">— Select hero —</option>
									{#each availableForSlot(i) as hid}
										<option value={hid}>{heroName(hid)}</option>
									{/each}
								</select>
								{#if slots.length > MIN_SLOTS}
									<button
										type="button"
										class="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
										onclick={() => removeSlot(i)}
										aria-label="Remove slot"
									>
										Remove
									</button>
								{/if}
							</li>
						{/each}
					</ul>
					{#if slots.filter((s) => s !== null).length > 0}
						<p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-1">Selected</p>
						<div class="flex flex-wrap gap-2">
							{#each slots.filter((s): s is number => s !== null) as hid}
								<HeroCard
									heroId={hid}
									displayName={heroName(hid)}
									def={heroById.get(hid) ?? null}
									variant="compact"
								/>
							{/each}
						</div>
					{/if}
					{#if slots.length < MAX_SLOTS}
						<button
							type="button"
							class="mt-2 rounded border border-dashed border-gray-400 dark:border-gray-500 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
							onclick={addSlot}
						>
							+ Add hero
						</button>
					{/if}
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
					disabled={saving || rosterHeroIds.length === 0 || slots.filter((s) => s !== null).length < MIN_SLOTS}
					onclick={save}
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button
					type="button"
					class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
					disabled={startingRunId || slots.filter((s) => s !== null).length < MIN_SLOTS}
					onclick={startRun}
				>
					{startingRunId ? 'Starting…' : 'Start run'}
				</button>
				<a
					href="/incremental/lineup"
					class="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					Cancel
				</a>
				<button
					type="button"
					class="rounded border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
					disabled={deleting}
					onclick={deleteLineup}
				>
					{deleting ? 'Deleting…' : 'Delete lineup'}
				</button>
			</div>
		</section>

		<p class="text-sm text-gray-500 dark:text-gray-400">
			<a href="/incremental/lineup" class="text-primary hover:underline">← Back to Lineups</a>
		</p>
	{/if}
</div>
