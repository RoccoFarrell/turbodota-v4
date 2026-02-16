<script lang="ts">
	import { onMount } from 'svelte';
	import { toaster } from '$lib/toaster';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import QuestIcon from '$lib/incremental/quests/QuestIcon.svelte';
	import MatchHistory from '$lib/incremental/components/MatchHistory.svelte';
	import type { MatchHistoryRow } from '$lib/incremental/components/MatchHistory.svelte';
	import type { StatKey } from '$lib/incremental/quests/quest-definitions';

	interface QuestData {
		id: string;
		label: string;
		iconId: string | null;
		statKey: StatKey;
		current: number;
		threshold: number;
		completed: boolean;
		claimCount: number;
		canClaim: boolean;
		lastActivityAt: number | null;
		rewardDescription: string;
		startedAt: string;
		turboMatchesSinceStart: number;
		rankedMatchesSinceStart: number;
	}

	let quests = $state<QuestData[]>([]);
	let matches = $state<MatchHistoryRow[]>([]);
	let loading = $state(true);
	let errorMsg = $state<string | null>(null);
	let claimingId = $state<string | null>(null);

	/** Stat keys from quests that are not yet complete (for match history). */
	const openQuestStatKeys = $derived(
		[...new Set(quests.filter((q) => !q.completed).map((q) => q.statKey))] as StatKey[]
	);

	/** Format large numbers compactly: 150000 → "150k", 1234567 → "1.23M". */
	function fmt(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
		if (n >= 10_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace(/\.?0+$/, '') + 'k';
		if (n >= 1_000) return n.toLocaleString();
		return String(n);
	}

	function formatLastActivity(unixSeconds: number): string {
		const d = new Date(unixSeconds * 1000);
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatQuestStartDate(isoString: string): string {
		const d = new Date(isoString);
		return d.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function fetchQuests() {
		const sid = actionStore.getSaveId();
		const param = sid ? `?saveId=${encodeURIComponent(sid)}` : '';
		try {
			const res = await fetch(`/api/incremental/quests${param}`);
			if (res.ok) {
				const data = await res.json();
				quests = data.quests ?? [];
				errorMsg = null;
			} else {
				const data = await res.json().catch(() => ({}));
				errorMsg = data.message ?? `Error ${res.status}`;
				console.error('[Quests] fetch failed:', res.status, data);
			}
		} catch (e) {
			errorMsg = 'Failed to load quests';
			console.error('[Quests] fetch error:', e);
		}
		loading = false;
	}

	async function fetchMatches() {
		const sid = actionStore.getSaveId();
		const param = sid ? `?saveId=${encodeURIComponent(sid)}&limit=5` : '?limit=5';
		try {
			const res = await fetch(`/api/incremental/quests/matches${param}`);
			if (res.ok) {
				const data = await res.json();
				matches = data.matches ?? [];
			}
		} catch {
			matches = [];
		}
	}

	async function claimQuest(questId: string) {
		claimingId = questId;
		try {
			const sid = actionStore.getSaveId();
			const res = await fetch('/api/incremental/quests/claim', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId: sid, questId })
			});
			if (res.ok) {
				toaster.success({ title: 'Quest reward claimed!' });
				await fetchQuests();
				actionStore.fetchBank();
			} else {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: data.message ?? 'Failed to claim quest' });
			}
		} finally {
			claimingId = null;
		}
	}

	function progressPct(current: number, threshold: number): number {
		if (threshold <= 0) return 100;
		return Math.min(100, (current / threshold) * 100);
	}

	onMount(async () => {
		await actionStore.ensureSave();
		await Promise.all([fetchQuests(), fetchMatches()]);
	});
</script>

<div class="max-w-[90rem] mx-auto p-4 space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Quests</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
			Track your Dota 2 stats across ranked and turbo games. Complete quests to earn rewards. Quests reset after claiming!
		</p>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-gray-400 dark:text-gray-500 text-sm">Loading quests...</p>
		</div>
	{:else if errorMsg}
		<div class="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 text-center">
			<p class="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
			<button
				type="button"
				class="mt-2 text-sm text-primary hover:underline"
				onclick={() => { loading = true; fetchQuests(); }}
			>
				Retry
			</button>
		</div>
	{:else}
		<div class="flex flex-col lg:flex-row lg:items-start gap-6">
			<div class="flex-1 min-w-0 space-y-4">
			{#each quests as quest (quest.id)}
				{@const pct = progressPct(quest.current, quest.threshold)}
				<div
					class="rounded-xl border bg-white dark:bg-gray-900 flex overflow-hidden {quest.canClaim
						? 'border-primary/50 dark:border-primary/40'
						: 'border-gray-200 dark:border-gray-700'}"
				>
					<!-- Full-height icon column with drop shadow -->
					{#if quest.iconId}
						<div
							class="shrink-0 w-14 flex flex-col bg-gray-100 dark:bg-gray-800/80 rounded-l-xl drop-shadow-md"
							aria-hidden="true"
						>
							<div class="flex-1 flex items-center justify-center min-h-0 py-3 text-amber-500">
								<QuestIcon iconId={quest.iconId} size={40} iconClass="text-amber-500" />
							</div>
						</div>
					{/if}
					<div class="flex-1 min-w-0 p-4">
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2 flex-wrap">
							{#if !quest.iconId}
								<QuestIcon iconId={quest.iconId} size={22} />
							{/if}
							<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
								{quest.label}
							</h3>
							{#if quest.canClaim}
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
									Complete!
								</span>
							{/if}
							{#if quest.claimCount > 0}
								<span class="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
									Claimed {quest.claimCount}x
								</span>
							{/if}
						</div>
						<span class="text-xs text-gray-500 dark:text-gray-400">
							Reward: {quest.rewardDescription}
						</span>
					</div>

					<p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
						Started: {quest.startedAt ? formatQuestStartDate(quest.startedAt) : '—'}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
						Matches since start — Turbo: <span class="font-medium text-gray-700 dark:text-gray-300">{quest.turboMatchesSinceStart ?? 0}</span>
						 · Ranked: <span class="font-medium text-gray-700 dark:text-gray-300">{quest.rankedMatchesSinceStart ?? 0}</span>
						{#if quest.lastActivityAt != null}
							<span class="ml-2">· Last activity: {formatLastActivity(quest.lastActivityAt)}</span>
						{/if}
					</p>

					<!-- Progress bar -->
					<div class="relative h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
						<div
							class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out bg-primary"
							style="width: {pct}%"
						></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-sm font-bold drop-shadow-primary-800 text-amber-500">
								{fmt(Math.min(quest.current, quest.threshold))} / {fmt(quest.threshold)}
							</span>
						</div>
					</div>

					<!-- Claim button -->
					{#if quest.canClaim}
						<div class="mt-3 flex justify-end">
							<button
								type="button"
								class="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
								disabled={claimingId === quest.id}
								onclick={() => claimQuest(quest.id)}
							>
								{claimingId === quest.id ? 'Claiming...' : 'Claim Reward'}
							</button>
						</div>
					{/if}
					</div>
				</div>
			{/each}
			</div>

			<!-- Match history: right side on large screens (wider so stats don't overflow) -->
			<div class="lg:w-[32rem] lg:min-w-[32rem] shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
				<MatchHistory matches={matches} statKeys={openQuestStatKeys.length > 0 ? openQuestStatKeys : undefined} />
			</div>
		</div>
	{/if}
</div>
