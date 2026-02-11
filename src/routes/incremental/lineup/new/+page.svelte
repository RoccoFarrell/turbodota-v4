<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let name = $state('');
	/** 1–5 slots; null = empty slot */
	let slots = $state<(number | null)[]>([null]);
	let saving = $state(false);

	const MIN_SLOTS = 1;
	const MAX_SLOTS = 5;

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
			goto('/incremental/lineup');
		} finally {
			saving = false;
		}
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await fetchRoster();
		})();
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">New lineup</h1>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label for="new-lineup-save" class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				id="new-lineup-save"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={fetchRoster}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">
		<div>
			<label for="lineup-name" class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
			<input
				id="lineup-name"
				type="text"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				placeholder="e.g. Magic squad"
				bind:value={name}
			/>
		</div>

		<div>
			<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Heroes (1–5 from roster)</p>
			{#if rosterHeroIds.length === 0}
				<p class="text-sm text-gray-500 dark:text-gray-400">
					No heroes on your roster. Convert a win on the
					<a href="/incremental" class="text-primary hover:underline">Incremental</a> page first.
				</p>
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

		<div class="flex gap-2">
			<button
				type="button"
				class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
				disabled={saving || rosterHeroIds.length === 0 || slots.filter((s) => s !== null).length < MIN_SLOTS}
				onclick={save}
			>
				{saving ? 'Creating…' : 'Create lineup'}
			</button>
			<a
				href="/incremental/lineup"
				class="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
			>
				Cancel
			</a>
		</div>
	</section>

	<p class="text-sm text-gray-500 dark:text-gray-400">
		<a href="/incremental/lineup" class="text-primary hover:underline">← Back to Lineups</a>
	</p>
</div>
