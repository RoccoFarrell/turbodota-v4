<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { toaster } from '$lib/toaster';
	import {
		MINING_BASE_DURATION_SEC,
		MINING_ESSENCE_PER_STRIKE,
		CONVERT_WIN_ESSENCE_COST
	} from '$lib/incremental/actions';

	/** Hero list from root layout (populated via getHeroes or Prisma fallback) */
	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number, fallback: string): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? fallback;
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
	let essence = $state(0);
	let progress = $state(0);
	let lastTickAt = $state(Date.now());
	let eligibleWins = $state<
		Array<{
			matchId: string;
			heroId: number;
			heroName: string;
			startTime: number;
			win: boolean;
			gameModeLabel?: string;
		}>
	>([]);
	let convertingMatchId = $state<string | null>(null);
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
		}
	}

	async function fetchEligibleWins() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster/eligible-wins${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			eligibleWins = data.eligibleWins ?? [];
		}
	}

	async function tickAction() {
		const now = Date.now();
		const res = await fetch('/api/incremental/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ saveId, lastTickAt, progress, actionType: 'mining' })
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ message: res.statusText }));
			toaster.error({ title: 'Mining tick failed', description: err.message ?? String(res.status) });
			return;
		}
		const data = await res.json();
		essence = data.essence ?? essence;
		progress = data.progress ?? 0;
		lastTickAt = data.lastTickAt ?? now;
	}

	async function clientTick() {
		if (!miningActive) return;
		const now = Date.now();
		const elapsedSec = (now - lastTickAt) / 1000;
		const deltaProgress = elapsedSec / MINING_BASE_DURATION_SEC;
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

	async function convertWin(matchId: string) {
		convertingMatchId = matchId;
		try {
			const res = await fetch('/api/incremental/roster/convert-win', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, matchId })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({
					title: 'Convert failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			essence = data.essence ?? essence;
			toaster.success({ title: 'Hero added to roster', description: 'You can use this hero in lineups.' });
			await fetchEligibleWins();
		} finally {
			convertingMatchId = null;
		}
	}

	/** Smooth 0–1 progress for the bar (interpolates between logic ticks) */
	const displayProgress = $derived.by(() => {
		if (!miningActive) return progress;
		const elapsedSec = (displayTime - lastTickAt) / 1000;
		return Math.min(1, Math.max(0, progress + elapsedSec / MINING_BASE_DURATION_SEC));
	});

	const nextStrikeIn = $derived(
		displayProgress >= 1 ? 0 : Math.max(0, (1 - displayProgress) * MINING_BASE_DURATION_SEC)
	);

	onMount(() => {
		(async () => {
			await fetchWallet();
			await fetchEligibleWins();
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
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Incremental</h1>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={() => { fetchWallet(); fetchEligibleWins(); }}
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

	<!-- Mining -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mining</h2>
			<button
				class="rounded px-3 py-1.5 text-sm font-medium {miningActive
					? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
					: 'bg-primary text-primary-foreground hover:opacity-90'}"
				onclick={toggleMining}
			>
				{miningActive ? 'Stop' : 'Start'}
			</button>
		</div>
		<div class="mt-2 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
			<div
				class="h-full bg-primary transition-[width] duration-75 ease-linear"
				style="width: {Math.min(100, displayProgress * 100)}%"
			></div>
		</div>
		<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
			{#if miningActive}
				{nextStrikeIn > 0 ? `Next strike in ${nextStrikeIn.toFixed(1)}s` : 'Striking...'}
				· +{MINING_ESSENCE_PER_STRIKE} Essence per strike
			{:else}
				Paused
			{/if}
		</p>
	</section>

	<!-- Convert win → roster -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Convert a win to roster
		</h2>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Spend {CONVERT_WIN_ESSENCE_COST} Essence to add one hero from a recent win to your roster.
		</p>
		{#if eligibleWins.length === 0}
			<p class="mt-3 text-sm text-gray-500 dark:text-gray-400">No eligible wins in your last 10 games.</p>
		{:else}
			<ul class="mt-3 space-y-2">
				{#each eligibleWins as win}
					<li
						class="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-600 p-3"
					>
						<div class="flex items-center gap-3 min-w-0 flex-1">
							<i
								class="d2mh hero-{win.heroId} shrink-0 scale-125"
								title={heroName(win.heroId, win.heroName)}
							></i>
							<div class="min-w-0">
								<span class="font-medium text-gray-900 dark:text-gray-100 block">
									{heroName(win.heroId, win.heroName)}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-400 block">
									{win.gameModeLabel ?? 'Other'}
									· {new Date(win.startTime * 1000).toLocaleString(undefined, {
										dateStyle: 'short',
										timeStyle: 'short'
									})}
								</span>
								<a
									href="https://dotabuff.com/matches/{win.matchId}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs text-primary hover:underline"
								>
									View on Dotabuff
								</a>
							</div>
						</div>
						<button
							class="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50 shrink-0"
							disabled={essence < CONVERT_WIN_ESSENCE_COST || convertingMatchId === win.matchId}
							onclick={() => convertWin(win.matchId)}
						>
							{convertingMatchId === win.matchId ? 'Converting...' : `Convert (${CONVERT_WIN_ESSENCE_COST})`}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
