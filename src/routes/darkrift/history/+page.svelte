<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions/constants';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero #${heroId}`;
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey.replace(/_/g, ' ');
	}

	interface HistorySession {
		id: string;
		slotIndex: number;
		actionType: string;
		actionHeroId: number | null;
		actionStatKey: string | null;
		completions: number;
		source: string;
		itemId: string | null;
		startedAt: string;
		endedAt: string | null;
	}

	interface TotalRow {
		actionType: string;
		actionHeroId: number | null;
		actionStatKey: string | null;
		totalCompletions: number;
		sessionCount: number;
	}

	let sessions = $state<HistorySession[]>([]);
	let totals = $state<TotalRow[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(true);
	let loadingMore = $state(false);
	let errorMsg = $state<string | null>(null);

	// Filter state
	let filterActionType = $state<string>('');
	let filterSource = $state<string>('');

	async function fetchHistory(cursor?: string) {
		const params = new URLSearchParams();
		const sid = actionStore.getSaveId();
		if (sid) params.set('saveId', sid);
		params.set('limit', '50');
		if (cursor) params.set('cursor', cursor);
		if (filterActionType) params.set('actionType', filterActionType);
		if (filterSource) params.set('source', filterSource);

		try {
			const res = await fetch(`/api/incremental/history?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				if (cursor) {
					sessions = [...sessions, ...data.sessions];
				} else {
					sessions = data.sessions;
					totals = data.totals;
				}
				nextCursor = data.nextCursor;
				errorMsg = null;
			} else {
				const data = await res.json().catch(() => ({}));
				errorMsg = data.message ?? `Error ${res.status}`;
			}
		} catch (e) {
			errorMsg = 'Failed to load history';
			console.error('[History] fetch error:', e);
		}
	}

	async function loadInitial() {
		loading = true;
		await fetchHistory();
		loading = false;
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;
		await fetchHistory(nextCursor);
		loadingMore = false;
	}

	async function applyFilters() {
		loading = true;
		nextCursor = null;
		await fetchHistory();
		loading = false;
	}

	// Display helpers
	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		if (seconds < 3600) {
			const m = Math.floor(seconds / 60);
			const s = Math.round(seconds % 60);
			return `${m}m ${s}s`;
		}
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h >= 24) {
			const d = Math.floor(h / 24);
			const rh = h % 24;
			return `${d}d ${rh}h ${m}m`;
		}
		return `${h}h ${m}m`;
	}

	function sessionDurationSec(s: HistorySession): number {
		const start = new Date(s.startedAt).getTime();
		const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
		return Math.max(0, (end - start) / 1000);
	}

	function formatDate(isoString: string): string {
		const d = new Date(isoString);
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function sessionLabel(s: HistorySession): string {
		if (s.actionType === 'mining') return 'Mining';
		if (s.actionType === 'training' && s.actionHeroId != null && s.actionStatKey) {
			return `${heroName(s.actionHeroId)} – ${statLabel(s.actionStatKey)}`;
		}
		return s.actionType;
	}

	function sourceLabel(source: string): string {
		if (source === 'idle') return 'Idle';
		if (source === 'item') return 'Item';
		return source;
	}

	function totalLabel(t: TotalRow): string {
		if (t.actionType === 'mining') return 'Mining (total)';
		if (t.actionType === 'training' && t.actionHeroId != null && t.actionStatKey) {
			return `${heroName(t.actionHeroId)} – ${statLabel(t.actionStatKey)}`;
		}
		if (t.actionType === 'training') return 'Training (total)';
		return t.actionType;
	}

	// Derived aggregate totals
	const totalMiningCompletions = $derived(
		totals.filter((t) => t.actionType === 'mining').reduce((s, t) => s + t.totalCompletions, 0)
	);
	const totalMiningSessions = $derived(
		totals.filter((t) => t.actionType === 'mining').reduce((s, t) => s + t.sessionCount, 0)
	);
	const totalTrainingCompletions = $derived(
		totals.filter((t) => t.actionType === 'training').reduce((s, t) => s + t.totalCompletions, 0)
	);
	const totalTrainingSessions = $derived(
		totals.filter((t) => t.actionType === 'training').reduce((s, t) => s + t.sessionCount, 0)
	);
	const trainingTotals = $derived(
		totals.filter((t) => t.actionType === 'training' && t.actionHeroId != null && t.actionStatKey)
	);

	onMount(async () => {
		await actionStore.ensureSave();
		await loadInitial();
	});
</script>

<div class="max-w-6xl mx-auto p-4 space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Action History</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
			Track all mining and training sessions. Each session represents a continuous stretch of activity.
		</p>
	</div>

	{#if loading && sessions.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-400 dark:text-gray-500 text-sm">Loading history...</p>
		</div>
	{:else if errorMsg}
		<div class="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 text-center">
			<p class="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
			<button
				type="button"
				class="mt-2 text-sm text-primary hover:underline"
				onclick={() => loadInitial()}
			>
				Retry
			</button>
		</div>
	{:else}
		<!-- Totals summary -->
		<section class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
				<h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Mining</h2>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalMiningCompletions.toLocaleString()}</span>
					<span class="text-sm text-gray-500 dark:text-gray-400">completions</span>
				</div>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
					{totalMiningSessions} session{totalMiningSessions !== 1 ? 's' : ''}
				</p>
			</div>
			<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
				<h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Training</h2>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTrainingCompletions.toLocaleString()}</span>
					<span class="text-sm text-gray-500 dark:text-gray-400">completions</span>
				</div>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
					{totalTrainingSessions} session{totalTrainingSessions !== 1 ? 's' : ''}
				</p>
			</div>
		</section>

		<!-- Per-hero training breakdown -->
		{#if trainingTotals.length > 0}
			<section>
				<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Training Breakdown</h2>
				<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each trainingTotals as t}
						<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{totalLabel(t)}</span>
							<div class="text-right shrink-0 ml-3">
								<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.totalCompletions.toLocaleString()}</span>
								<span class="text-xs text-gray-400 ml-1">({t.sessionCount} session{t.sessionCount !== 1 ? 's' : ''})</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Filters -->
		<section class="flex flex-wrap items-center gap-3">
			<select
				class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
				bind:value={filterActionType}
				onchange={() => applyFilters()}
			>
				<option value="">All actions</option>
				<option value="mining">Mining</option>
				<option value="training">Training</option>
			</select>
			<select
				class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
				bind:value={filterSource}
				onchange={() => applyFilters()}
			>
				<option value="">All sources</option>
				<option value="idle">Idle</option>
				<option value="item">Item</option>
			</select>
		</section>

		<!-- Session list -->
		<section>
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Sessions</h2>
			{#if sessions.length === 0}
				<div class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 p-6 text-center">
					<p class="text-gray-500 dark:text-gray-400 text-sm">No history sessions yet. Start mining or training to see activity here.</p>
				</div>
			{:else}
				<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
								<th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Started</th>
								<th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
								<th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
								<th class="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completions</th>
								<th class="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
								<th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each sessions as s (s.id)}
								<tr class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td class="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(s.startedAt)}</td>
									<td class="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">{sessionLabel(s)}</td>
									<td class="px-4 py-2">
										<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {s.source === 'item' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}">
											{sourceLabel(s.source)}
										</span>
										{#if s.itemId}
											<span class="text-xs text-gray-400 ml-1">({s.itemId})</span>
										{/if}
									</td>
									<td class="px-4 py-2 text-right text-gray-900 dark:text-gray-100 tabular-nums">{s.completions.toLocaleString()}</td>
									<td class="px-4 py-2 text-right text-gray-500 dark:text-gray-400 tabular-nums">{formatDuration(sessionDurationSec(s))}</td>
									<td class="px-4 py-2">
										{#if s.endedAt === null}
											<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
												Active
											</span>
										{:else}
											<span class="text-xs text-gray-400">
												Ended {formatDate(s.endedAt)}
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if nextCursor}
					<div class="text-center mt-4">
						<button
							type="button"
							class="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
							disabled={loadingMore}
							onclick={() => loadMore()}
						>
							{loadingMore ? 'Loading...' : 'Load more'}
						</button>
					</div>
				{/if}
			{/if}
		</section>
	{/if}
</div>
