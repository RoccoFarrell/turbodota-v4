<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatLevelMultiplier, levelMultiplier } from '$lib/incremental/run/level-scaling';

	interface RunSummary {
		id: string;
		status: string;
		startedAt: string;
		level: number;
	}

	let loading = $state(true);
	let runs = $state<RunSummary[]>([]);
	let error = $state<string | null>(null);

	const activeRuns = $derived(runs.filter((r) => r.status === 'ACTIVE' || r.status === 'active'));
	const completedRuns = $derived(runs.filter((r) => r.status === 'WON' || r.status === 'won'));
	const deadRuns = $derived(runs.filter((r) => r.status === 'DEAD' || r.status === 'dead'));
	const highestLevelWon = $derived(
		completedRuns.length > 0 ? Math.max(...completedRuns.map((r) => r.level ?? 1)) : 0
	);
	const nextLevel = $derived(highestLevelWon + 1);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function statusBadge(status: string): { label: string; classes: string } {
		const s = status.toUpperCase();
		if (s === 'ACTIVE') return { label: 'Active', classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
		if (s === 'WON') return { label: 'Cleared', classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
		return { label: 'Dead', classes: 'bg-red-500/20 text-red-400 border-red-500/40' };
	}

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
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load runs';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-full relative">
	<!-- Atmospheric background -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
		<div class="absolute inset-0 bg-gradient-to-b from-gray-950 via-violet-950/30 to-gray-950"></div>
		<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-800/5 rounded-full blur-[80px]"></div>
	</div>

	<div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
		<!-- Header -->
		<header class="text-center space-y-3">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium tracking-wider uppercase">
				<span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
				The Void Awaits
			</div>
			<h1 class="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-violet-200 to-violet-400">
				The Dark Rift
			</h1>
			<p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
				Lead your trained lineup through a gauntlet of enemies. Each level doubles the challenge. How deep can you go?
			</p>
		</header>

		{#if loading}
			<div class="flex justify-center py-12">
				<div class="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-center space-y-3">
				<p class="text-red-300">{error}</p>
				<a href="/darkrift/lineup" class="inline-block text-sm text-violet-400 hover:text-violet-300 transition-colors">
					&larr; Back to Lineups
				</a>
			</div>
		{:else}
			<!-- Level progress display -->
			<div class="rounded-xl border border-violet-500/20 bg-gray-900/60 backdrop-blur-sm p-6 space-y-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<h2 class="text-lg font-bold text-gray-100">Rift Depth</h2>
						<p class="text-sm text-gray-400">
							{#if highestLevelWon > 0}
								Deepest cleared: <span class="text-amber-400 font-semibold">Level {highestLevelWon}</span>
								<span class="text-gray-500">({formatLevelMultiplier(highestLevelWon)} difficulty)</span>
							{:else}
								No levels cleared yet
							{/if}
						</p>
					</div>
					<div class="text-right">
						<div class="text-3xl font-black text-violet-300">{nextLevel}</div>
						<div class="text-xs text-gray-500 uppercase tracking-wide">Next Level</div>
					</div>
				</div>

				<!-- Level bar visualization -->
				<div class="space-y-2">
					<div class="flex gap-1">
						{#each Array(Math.min(nextLevel, 10)) as _, i}
							{@const lvl = i + 1}
							{@const cleared = lvl <= highestLevelWon}
							<div
								class="h-2 flex-1 rounded-full transition-all duration-500 {cleared
									? 'bg-gradient-to-r from-violet-500 to-amber-500 shadow-[0_0_6px_rgba(139,92,246,0.4)]'
									: lvl === nextLevel
										? 'bg-violet-500/30 border border-violet-500/40'
										: 'bg-gray-800'}"
								title="Level {lvl} — {formatLevelMultiplier(lvl)}"
							></div>
						{/each}
						{#if nextLevel > 10}
							<div class="text-xs text-gray-500 self-center pl-1">+{nextLevel - 10}</div>
						{/if}
					</div>
					<div class="flex justify-between text-xs text-gray-600 uppercase tracking-wider">
						<span>Level 1</span>
						<span>{formatLevelMultiplier(nextLevel)} next</span>
					</div>
				</div>
			</div>

			<!-- Active runs -->
			{#if activeRuns.length > 0}
				<section class="space-y-3">
					<h2 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
						Active Runs
					</h2>
					{#each activeRuns as run}
						<button
							type="button"
							class="w-full text-left rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/50 transition-all p-4 flex items-center gap-4 group cursor-pointer"
							onclick={() => goto(`/darkrift/dungeon/${run.id}`)}
						>
							<div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
								{run.level ?? 1}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="font-semibold text-gray-100">Level {run.level ?? 1}</span>
									<span class="text-xs text-gray-500">{formatLevelMultiplier(run.level ?? 1)} difficulty</span>
								</div>
								<div class="text-xs text-gray-500 mt-0.5">{formatDate(run.startedAt)}</div>
							</div>
							<div class="text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors font-medium">
								Resume &rarr;
							</div>
						</button>
					{/each}
				</section>
			{/if}

			<!-- Start new run CTA -->
			{#if activeRuns.length === 0}
				<div class="rounded-xl border border-dashed border-violet-500/30 bg-violet-950/10 p-8 text-center space-y-4">
					<div class="text-4xl">&#x1F30C;</div>
					<div>
						<p class="text-gray-300 font-medium">Ready to descend?</p>
						<p class="text-sm text-gray-500 mt-1">Start a run from one of your lineups to enter the rift.</p>
					</div>
					<a
						href="/darkrift/lineup"
						class="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
					>
						Choose Lineup &rarr;
					</a>
				</div>
			{/if}

			<!-- Past runs -->
			{#if completedRuns.length > 0 || deadRuns.length > 0}
				<section class="space-y-3">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Run History</h2>
					<div class="space-y-2">
						{#each [...completedRuns, ...deadRuns].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()) as run}
							{@const badge = statusBadge(run.status)}
							<div class="rounded-lg border border-gray-800 bg-gray-900/40 p-3 flex items-center gap-3">
								<div class="w-8 h-8 rounded-md bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">
									{run.level ?? 1}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium text-gray-300">Level {run.level ?? 1}</span>
										<span class="text-xs px-1.5 py-0.5 rounded border {badge.classes}">{badge.label}</span>
									</div>
									<div class="text-xs text-gray-600 mt-0.5">{formatDate(run.startedAt)}</div>
								</div>
								<div class="text-xs text-gray-600">{formatLevelMultiplier(run.level ?? 1)}</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>
