<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { toaster } from '$lib/toaster';
	import {
		formatStat,
		getDurationSec,
		ACTION_TYPE_TRAINING,
		TRAINING_BUILDINGS,
		TRAINING_STAT_KEYS,
		MINING_ESSENCE_PER_STRIKE,
		type TrainingStatKey
	} from '$lib/incremental/actions';

	/** Hero list from root layout (populated via getHeroes or Prisma fallback) */
	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number, fallback: string): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? fallback;
	}

	function statLabel(statKey: TrainingStatKey): string {
		return TRAINING_BUILDINGS[statKey]?.name ?? statKey;
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let essence = $state(0);
	let progress = $state(0);
	let lastTickAt = $state(Date.now());
	/** Current action: mining or training (heroId, statKey) */
	let actionType = $state<'mining' | 'training'>('mining');
	let actionHeroId = $state<number | null>(null);
	let actionStatKey = $state<TrainingStatKey | null>(null);
	let rosterHeroIds = $state<number[]>([]);
	/** heroId -> statKey -> value */
	let trainingValues = $state<Record<number, Record<string, number>>>({});
	let miningActive = $state(true);
	let tickInterval: ReturnType<typeof setInterval> | null = null;
	let displayInterval: ReturnType<typeof setInterval> | null = null;
	/** Updated frequently when mining is active so the bar interpolates smoothly */
	let displayTime = $state(Date.now());

	const TICK_MS = 200;
	const DISPLAY_MS = 50;

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
		if (!saveId) {
			const w = await fetch('/api/incremental/wallet');
			if (w.ok) {
				const data = await w.json();
				saveId = data.saveId ?? null;
				essence = data.essence ?? 0;
			}
		}
	}

	async function fetchWallet() {
		await ensureSave();
		const res = await fetch(`/api/incremental/wallet${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			essence = data.essence ?? 0;
			if (data.saveId) saveId = data.saveId;
			actionType = data.actionType === ACTION_TYPE_TRAINING ? 'training' : 'mining';
			actionHeroId = data.actionHeroId ?? null;
			actionStatKey = data.actionStatKey ?? null;
			progress = typeof data.progress === 'number' ? data.progress : 0;
			lastTickAt = typeof data.lastTickAt === 'number' ? data.lastTickAt : Date.now();
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

	async function fetchTraining() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/training${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			const map: Record<number, Record<string, number>> = {};
			for (const t of data.training ?? []) {
				if (!map[t.heroId]) map[t.heroId] = {};
				map[t.heroId][t.statKey] = t.value;
			}
			trainingValues = map;
		}
	}

	async function tickAction() {
		const now = Date.now();
		const body: Record<string, unknown> = {
			saveId,
			lastTickAt,
			progress,
			actionType: actionType === 'training' ? ACTION_TYPE_TRAINING : 'mining'
		};
		if (actionType === 'training' && actionHeroId != null && actionStatKey != null) {
			body.actionHeroId = actionHeroId;
			body.actionStatKey = actionStatKey;
		}
		const res = await fetch('/api/incremental/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ message: res.statusText }));
			toaster.error({ title: 'Action tick failed', description: err.message ?? String(res.status) });
			return;
		}
		const data = await res.json();
		essence = data.essence ?? essence;
		progress = data.progress ?? 0;
		lastTickAt = data.lastTickAt ?? now;
		actionType = data.actionType === ACTION_TYPE_TRAINING ? 'training' : 'mining';
		actionHeroId = data.actionHeroId ?? null;
		actionStatKey = data.actionStatKey ?? null;
		if (actionType === 'training') await fetchTraining();
	}

	async function startTraining(heroId: number, statKey: TrainingStatKey) {
		actionType = 'training';
		actionHeroId = heroId;
		actionStatKey = statKey;
		progress = 0;
		lastTickAt = Date.now();
		const res = await fetch('/api/incremental/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				saveId,
				lastTickAt,
				progress: 0,
				actionType: ACTION_TYPE_TRAINING,
				actionHeroId: heroId,
				actionStatKey: statKey
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			toaster.error({ title: 'Start training failed', description: err.message ?? res.statusText });
			return;
		}
		const data = await res.json();
		progress = data.progress ?? 0;
		lastTickAt = data.lastTickAt ?? Date.now();
		await fetchTraining();
	}

	function switchToMining() {
		actionType = 'mining';
		actionHeroId = null;
		actionStatKey = null;
		const body = {
			saveId,
			lastTickAt,
			progress,
			actionType: 'mining'
		};
		fetch('/api/incremental/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}).then(async (res) => {
			if (res.ok) {
				const data = await res.json();
				progress = data.progress ?? 0;
				lastTickAt = data.lastTickAt ?? Date.now();
			}
		});
	}

	const effectiveDurationSec = $derived(getDurationSec(actionType));

	async function clientTick() {
		if (!miningActive) return;
		const now = Date.now();
		const elapsedSec = (now - lastTickAt) / 1000;
		const deltaProgress = elapsedSec / effectiveDurationSec;
		progress = Math.min(1, progress + deltaProgress);
		lastTickAt = now;
		if (progress >= 1) {
			await tickAction();
		}
	}

	function toggleMining() {
		miningActive = !miningActive;
		if (miningActive) {
			displayTime = Date.now();
			if (!tickInterval) tickInterval = setInterval(clientTick, TICK_MS);
			if (!displayInterval) displayInterval = setInterval(() => { displayTime = Date.now(); }, DISPLAY_MS);
		} else {
			if (tickInterval) {
				clearInterval(tickInterval);
				tickInterval = null;
			}
			if (displayInterval) {
				clearInterval(displayInterval);
				displayInterval = null;
			}
		}
	}

	/** Smooth 0–1 progress for the bar (interpolates between logic ticks) */
	const displayProgress = $derived.by(() => {
		if (!miningActive) return progress;
		const elapsedSec = (displayTime - lastTickAt) / 1000;
		return Math.min(1, Math.max(0, progress + elapsedSec / effectiveDurationSec));
	});

	const nextStrikeIn = $derived(
		displayProgress >= 1 ? 0 : Math.max(0, (1 - displayProgress) * effectiveDurationSec)
	);

	const actionBarLabel = $derived.by(() => {
		if (actionType === 'mining') return 'Mining';
		if (actionHeroId != null && actionStatKey != null) {
			return `Training ${heroName(actionHeroId, '')} – ${statLabel(actionStatKey)}`;
		}
		return 'Training';
	});

	onMount(() => {
		(async () => {
			await fetchWallet();
			await fetchRoster();
			await fetchTraining();
		})();
		displayTime = Date.now();
		if (miningActive) {
			tickInterval = setInterval(clientTick, TICK_MS);
			displayInterval = setInterval(() => { displayTime = Date.now(); }, DISPLAY_MS);
		}
	});

	onDestroy(() => {
		if (tickInterval) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
		if (displayInterval) {
			clearInterval(displayInterval);
			displayInterval = null;
		}
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Training & Mining</h1>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={() => { fetchWallet(); fetchRoster(); fetchTraining(); }}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<!-- Wallet -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Essence</h2>
		<p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{essence}</p>
	</section>

	<!-- Idle action: Mining or Training -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<div class="flex items-center justify-between gap-2 flex-wrap">
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
				{actionBarLabel}
			</h2>
			<div class="flex gap-2">
				{#if actionType === 'training'}
					<button
						class="rounded px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						onclick={switchToMining}
					>
						Switch to mining
					</button>
				{/if}
				<button
					class="rounded px-3 py-1.5 text-sm font-medium {miningActive
						? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
						: 'bg-primary text-primary-foreground hover:opacity-90'}"
					onclick={toggleMining}
				>
					{miningActive ? 'Stop' : 'Start'}
				</button>
			</div>
		</div>
		<div class="mt-2 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
			<div
				class="h-full bg-primary transition-[width] duration-75 ease-linear"
				style="width: {Math.min(100, displayProgress * 100)}%"
			></div>
		</div>
		<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
			{#if miningActive}
				{nextStrikeIn > 0 ? `Next in ${nextStrikeIn.toFixed(1)}s` : 'Completing...'}
				·
				{#if actionType === 'mining'}
					+{MINING_ESSENCE_PER_STRIKE} Essence per strike
				{:else}
					+1 {actionStatKey ? statLabel(actionStatKey) : 'stat'} per tick
				{/if}
			{:else}
				Paused
			{/if}
		</p>
	</section>

	<!-- Training grounds -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
			Training grounds
		</h2>
		<p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
			Send a roster hero to a building to train that stat. One action at a time (same bar above).
		</p>
		{#if rosterHeroIds.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Recruit heroes in <a href="/incremental/tavern" class="text-primary hover:underline">Hero Tavern</a> to train them.
			</p>
		{:else}
			<div class="grid gap-2 sm:grid-cols-2">
				{#each TRAINING_STAT_KEYS as statKey}
					{@const building = TRAINING_BUILDINGS[statKey]}
					{@const isActive = actionType === 'training' && actionStatKey === statKey}
					<div
						class="rounded border p-3 {isActive
							? 'border-primary bg-primary/5 dark:bg-primary/10'
							: 'border-gray-200 dark:border-gray-600'}"
					>
						<p class="font-medium text-gray-900 dark:text-gray-100">{building.name}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">{building.description}</p>
						{#if isActive && actionHeroId != null}
							<p class="mt-1 text-xs text-primary">
								Training: {heroName(actionHeroId, '')} +{formatStat(trainingValues[actionHeroId]?.[statKey] ?? 0)}
							</p>
						{:else}
							<p class="mt-1 text-xs text-gray-400">Idle</p>
						{/if}
						<select
							class="mt-2 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
							disabled={isActive}
							onchange={(e) => {
								const v = (e.currentTarget as HTMLSelectElement).value;
								if (v) startTraining(parseInt(v, 10), statKey);
								(e.currentTarget as HTMLSelectElement).value = '';
							}}
						>
							<option value="">— Send hero here —</option>
							{#each rosterHeroIds as hid}
								<option value={hid}>{heroName(hid, '')}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<p class="text-sm text-gray-500 dark:text-gray-400">
		Recruit heroes and manage training in <a href="/incremental/tavern" class="text-primary hover:underline">Hero Tavern</a>.
	</p>
</div>
