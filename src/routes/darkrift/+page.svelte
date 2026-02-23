<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import essenceIcon from '$lib/assets/essence.png';
	import {
		getDurationSec,
		TRAINING_BUILDINGS,
		MINING_ESSENCE_PER_STRIKE,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import { toaster } from '$lib/toaster';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import { gi } from '$lib/incremental/components/game-icons';
	import QuestIcon from '$lib/incremental/quests/QuestIcon.svelte';
	import MatchHistory from '$lib/incremental/components/MatchHistory.svelte';
	import type { MatchHistoryRow } from '$lib/incremental/components/MatchHistory.svelte';
	import type { StatKey } from '$lib/incremental/quests/quest-definitions';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	function heroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? 'Hero';
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	// ---- Store bindings ----
	const maxSlots = $derived(actionStore.getMaxSlots());
	const slots = $derived(actionStore.getSlots());

	// ---- Data state ----
	let loading = $state(true);
	let rosterCount = $state(0);
	let eligibleWinsCount = $state(0);

	// Runs data
	interface RunSummary { id: string; status: string; startedAt: string; level: number; }
	let runs = $state<RunSummary[]>([]);
	const activeRun = $derived(runs.find((r) => r.status === 'ACTIVE' || r.status === 'active') ?? null);
	const completedRuns = $derived(runs.filter((r) => r.status === 'WON' || r.status === 'won'));
	const highestLevelWon = $derived(
		completedRuns.length > 0 ? Math.max(...completedRuns.map((r) => r.level ?? 1)) : 0
	);

	// Quests data
	interface QuestData {
		id: string;
		type: 'recurring' | 'onboarding';
		label: string;
		description: string | null;
		iconId: string | null;
		statKey: string | null;
		current: number;
		threshold: number;
		completed: boolean;
		claimCount: number;
		canClaim: boolean;
		rewardDescription: string;
		order: number | null;
		locked: boolean;
		navLink: string | null;
	}
	let quests = $state<QuestData[]>([]);
	let claimingId = $state<string | null>(null);

	const onboardingQuests = $derived(quests.filter((q) => q.type === 'onboarding'));
	const recurringQuests = $derived(quests.filter((q) => q.type === 'recurring'));
	const journeyComplete = $derived(
		onboardingQuests.length > 0 && onboardingQuests.every((q) => q.claimCount > 0)
	);
	const claimableQuestCount = $derived(quests.filter((q) => q.canClaim).length);

	// Lineups data
	let lineupCount = $state(0);

	// Matches data
	let matches = $state<MatchHistoryRow[]>([]);
	let matchesOpen = $state(false);

	/** Stat keys from quests that are not yet complete (for match history). */
	const openQuestStatKeys = $derived(
		[
			...new Set(
				recurringQuests
					.filter((q) => !q.completed && q.statKey)
					.map((q) => q.statKey as StatKey)
			)
		] as StatKey[]
	);

	// Active slots summary
	const miningSlots = $derived(slots.filter((s) => s.actionType === 'mining'));
	const trainingSlots = $derived(slots.filter((s) => s.actionType === 'training'));

	// ---- Helpers ----

	function fmt(n: number): string {
		if (n >= 1_000_000)
			return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
		if (n >= 10_000)
			return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace(/\.?0+$/, '') + 'k';
		if (n >= 1_000) return n.toLocaleString();
		return String(n);
	}

	function progressPct(current: number, threshold: number): number {
		if (threshold <= 0) return 100;
		return Math.min(100, (current / threshold) * 100);
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
				toaster.success({ title: 'Reward claimed!' });
				await fetchQuests();
				actionStore.fetchBank();
			} else {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: data.message ?? 'Failed to claim' });
			}
		} finally {
			claimingId = null;
		}
	}

	// ---- Fetch functions ----

	async function fetchQuests() {
		const sid = actionStore.getSaveId();
		const param = sid ? `?saveId=${encodeURIComponent(sid)}` : '';
		try {
			const res = await fetch(`/api/incremental/quests${param}`);
			if (res.ok) {
				const data = await res.json();
				quests = data.quests ?? [];
			}
		} catch (e) {
			console.error('[Dashboard] quest fetch error:', e);
		}
	}

	async function fetchRuns() {
		try {
			const res = await fetch('/api/incremental/runs');
			if (res.ok) {
				const data = await res.json();
				runs = data.runs ?? [];
			}
		} catch (e) {
			console.error('[Dashboard] runs fetch error:', e);
		}
	}

	async function fetchRoster() {
		const sid = actionStore.getSaveId();
		if (!sid) return;
		const sp = `?saveId=${encodeURIComponent(sid)}`;
		try {
			const res = await fetch(`/api/incremental/roster${sp}`);
			if (res.ok) {
				const data = await res.json();
				rosterCount = (data.heroIds ?? []).length;
			}
		} catch (e) {
			console.error('[Dashboard] roster fetch error:', e);
		}
	}

	async function fetchEligibleWins() {
		const sid = actionStore.getSaveId();
		if (!sid) return;
		const sp = `?saveId=${encodeURIComponent(sid)}`;
		try {
			const res = await fetch(`/api/incremental/roster/eligible-wins${sp}`);
			if (res.ok) {
				const data = await res.json();
				eligibleWinsCount = (data.eligibleWins ?? []).length;
			}
		} catch (e) {
			console.error('[Dashboard] eligible-wins fetch error:', e);
		}
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

	async function fetchLineups() {
		const sid = actionStore.getSaveId();
		if (!sid) return;
		const sp = `?saveId=${encodeURIComponent(sid)}`;
		try {
			const res = await fetch(`/api/incremental/lineups${sp}`);
			if (res.ok) {
				const data = await res.json();
				lineupCount = (data.lineups ?? []).length;
			}
		} catch (e) {
			console.error('[Dashboard] lineups fetch error:', e);
		}
	}

	onMount(async () => {
		await actionStore.ensureSave();
		await Promise.all([
			fetchRuns(),
			fetchQuests(),
			fetchRoster(),
			fetchEligibleWins(),
			fetchLineups(),
			fetchMatches()
		]);
		loading = false;
	});
</script>

<div class="dashboard-page min-h-full">
	<div class="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

		<!-- ═══════════════════════════════════════════════════
		     DARK RIFT HERO BANNER
		     ═══════════════════════════════════════════════════ -->
		<section class="rift-banner">
			<div class="rift-banner-bg" aria-hidden="true"></div>
			<div class="relative z-10 flex items-center justify-between gap-4 p-5 sm:p-6">
				<div class="min-w-0">
					<h1 class="rift-title">The Dark Rift</h1>
					{#if activeRun}
						<div class="mt-2 flex items-center gap-2">
							<span class="rift-pulse"></span>
							<span class="text-sm text-emerald-300 font-medium">Active Run — Level {activeRun.level ?? 1}</span>
						</div>
					{:else if highestLevelWon > 0}
						<p class="mt-1 text-sm text-gray-400">
							Deepest cleared: <span class="text-violet-300 font-semibold">Level {highestLevelWon}</span>
						</p>
					{:else if !loading}
						<p class="mt-1 text-sm text-gray-500">Begin your descent into the void...</p>
					{/if}
				</div>

				<div class="shrink-0 flex flex-col items-end gap-2">
					{#if activeRun}
						<a href="/darkrift/dungeon/{activeRun.id}" class="rift-cta rift-cta--resume">
							Resume &rarr;
						</a>
					{:else}
						<a href="/darkrift/dungeon" class="rift-cta">
							Enter Rift &rarr;
						</a>
					{/if}
				</div>
			</div>

			<!-- Level depth bar -->
			{#if highestLevelWon > 0 || activeRun}
				<div class="px-5 sm:px-6 pb-4">
					<div class="flex gap-1">
						{#each Array(Math.min((highestLevelWon || 0) + 1, 10)) as _, i}
							{@const lvl = i + 1}
							{@const cleared = lvl <= highestLevelWon}
							<div
								class="h-1.5 flex-1 rounded-full transition-all duration-500 {cleared
									? 'bg-gradient-to-r from-violet-600 to-purple-400 shadow-[0_0_4px_rgba(139,92,246,0.4)]'
									: 'bg-violet-500/20 border border-violet-500/30'}"
								title="Level {lvl}"
							></div>
						{/each}
						{#if highestLevelWon >= 10}
							<span class="text-xs text-gray-600 self-center pl-1">+{highestLevelWon - 9}</span>
						{/if}
					</div>
				</div>
			{/if}
		</section>

		<!-- ═══════════════════════════════════════════════════
		     QUEST JOURNEY (onboarding steps)
		     ═══════════════════════════════════════════════════ -->
		{#if !loading && onboardingQuests.length > 0 && !journeyComplete}
			<section class="rift-panel p-5">
				<div class="section-heading">
					<span class="heading-label">Your Journey</span>
				</div>
				<p class="mt-3 text-sm text-gray-500">
					Follow these steps to unlock the power of the Dark Rift.
				</p>

				<div class="journey-steps mt-5">
					{#each onboardingQuests as quest, i (quest.id)}
						{@const claimed = quest.claimCount > 0}
						{@const isNext = quest.canClaim || (!claimed && !quest.locked && !quest.completed)}
						<div
							class="journey-step"
							class:journey-step--claimed={claimed}
							class:journey-step--active={isNext || quest.canClaim}
							class:journey-step--locked={quest.locked && !claimed}
						>
							<!-- Connecting line -->
							{#if i > 0}
								<div class="journey-connector" class:journey-connector--done={claimed}></div>
							{/if}

							<!-- Node -->
							<div
								class="journey-node"
								class:journey-node--claimed={claimed}
								class:journey-node--active={quest.canClaim}
								class:journey-node--locked={quest.locked}
							>
								{#if claimed}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
										<polyline points="20 6 9 17 4 12" />
									</svg>
								{:else}
									<QuestIcon iconId={quest.iconId} size={20} iconClass={quest.locked ? 'text-gray-700' : 'text-violet-300'} />
								{/if}
							</div>

							<!-- Content -->
							<div class="journey-content">
								<div class="flex items-center gap-2 flex-wrap">
									<h3 class="text-sm font-semibold {claimed ? 'text-gray-500 line-through' : quest.locked ? 'text-gray-600' : 'text-gray-100'}">
										{quest.label}
									</h3>
									{#if claimed}
										<span class="text-xs uppercase tracking-wider text-violet-400 font-semibold">Done</span>
									{/if}
								</div>
								{#if quest.description && !claimed}
									<p class="text-xs mt-0.5 {quest.locked ? 'text-gray-700' : 'text-gray-500'}">
										{quest.description}
									</p>
								{/if}

								{#if !claimed}
									<div class="mt-2 flex items-center gap-3">
										<span class="reward-badge">
											<img src={essenceIcon} alt="Essence" class="w-3.5 h-3.5 object-contain inline" />
											{quest.rewardDescription}
										</span>

										{#if quest.canClaim}
											<button
												type="button"
												class="claim-btn claim-btn--glow"
												disabled={claimingId === quest.id}
												onclick={() => claimQuest(quest.id)}
											>
												{claimingId === quest.id ? 'Claiming...' : 'Claim'}
											</button>
										{:else if !quest.locked && !quest.completed && quest.navLink}
											<a href={quest.navLink} class="go-btn">Go &rarr;</a>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ═══════════════════════════════════════════════════
		     FEATURE CARDS (at a glance)
		     ═══════════════════════════════════════════════════ -->
		{#if !loading}
			<section class="space-y-3">
				<div class="section-heading">
					<span class="heading-label">Command Center</span>
				</div>

				<div class="feature-grid">
					<!-- SCAVENGING -->
					<a href="/darkrift/scavenging" class="feature-card">
						<div class="feature-icon-wrap feature-icon--violet">
							<span class="gi w-6 h-6 text-violet-400" style="--gi: url({gi('lorc', 'mining')})"></span>
						</div>
						<div class="feature-body">
							<h3 class="feature-title">Scavenging</h3>
							{#if miningSlots.length > 0}
								<p class="feature-stat text-violet-400">
									{miningSlots.length} active {miningSlots.length === 1 ? 'slot' : 'slots'}
								</p>
							{:else}
								<p class="feature-hint">Mine Essence</p>
							{/if}
						</div>
						<span class="feature-arrow">&rarr;</span>
					</a>

					<!-- TAVERN -->
					<a href="/darkrift/tavern" class="feature-card">
						<div class="feature-icon-wrap feature-icon--purple">
							<span class="gi w-6 h-6 text-purple-400" style="--gi: url({gi('delapouite', 'tavern-sign')})"></span>
						</div>
						<div class="feature-body">
							<h3 class="feature-title">Tavern</h3>
							<p class="feature-stat">
								{rosterCount} {rosterCount === 1 ? 'hero' : 'heroes'}
								{#if eligibleWinsCount > 0}
									<span class="text-emerald-400"> &middot; {eligibleWinsCount} to recruit</span>
								{/if}
							</p>
						</div>
						<span class="feature-arrow">&rarr;</span>
					</a>

					<!-- BARRACKS -->
					<a href="/darkrift/barracks" class="feature-card">
						<div class="feature-icon-wrap feature-icon--indigo">
							<span class="gi w-6 h-6 text-indigo-400" style="--gi: url({gi('delapouite', 'medieval-barracks')})"></span>
						</div>
						<div class="feature-body">
							<h3 class="feature-title">Barracks</h3>
							{#if trainingSlots.length > 0}
								<p class="feature-stat text-indigo-400">
									{trainingSlots.length} training
								</p>
							{:else}
								<p class="feature-hint">Train heroes</p>
							{/if}
						</div>
						<span class="feature-arrow">&rarr;</span>
					</a>

					<!-- LINEUPS -->
					<a href="/darkrift/lineup" class="feature-card">
						<div class="feature-icon-wrap feature-icon--emerald">
							<span class="gi w-6 h-6 text-emerald-400" style="--gi: url({gi('lorc', 'crossed-swords')})"></span>
						</div>
						<div class="feature-body">
							<h3 class="feature-title">Lineups</h3>
							<p class="feature-stat">
								{lineupCount} {lineupCount === 1 ? 'lineup' : 'lineups'}
							</p>
						</div>
						<span class="feature-arrow">&rarr;</span>
					</a>

					<!-- TALENTS (coming soon) -->
					<div class="feature-card feature-card--locked">
						<div class="feature-icon-wrap feature-icon--locked">
							<span class="gi w-6 h-6 text-gray-700" style="--gi: url({gi('delapouite', 'skills')})"></span>
						</div>
						<div class="feature-body">
							<h3 class="feature-title text-gray-700">Talents</h3>
							<p class="feature-hint">Coming soon</p>
						</div>
						<span class="coming-soon-badge">Soon</span>
					</div>
				</div>
			</section>
		{/if}

		<!-- ═══════════════════════════════════════════════════
		     BOUNTY BOARD (recurring quests)
		     ═══════════════════════════════════════════════════ -->
		{#if !loading && recurringQuests.length > 0}
			<section>
				<div class="section-heading mb-4">
					<span class="heading-label">
						Bounty Board
						{#if claimableQuestCount > 0}
							<span class="claim-count">{claimableQuestCount}</span>
						{/if}
					</span>
				</div>

				<div class="space-y-2.5">
					{#each recurringQuests as quest (quest.id)}
						{@const pct = progressPct(quest.current, quest.threshold)}
						<div class="bounty-row" class:bounty-row--claimable={quest.canClaim}>
							<!-- Icon -->
							<div class="bounty-icon" class:bounty-icon--pulse={quest.canClaim}>
								<QuestIcon iconId={quest.iconId} size={24} iconClass="text-violet-400" />
							</div>

							<!-- Details -->
							<div class="bounty-body">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-gray-200">{quest.label}</span>
									{#if quest.canClaim}
										<span class="text-xs uppercase tracking-wider text-violet-400 font-bold animate-pulse">Ready!</span>
									{/if}
									{#if quest.claimCount > 0}
										<span class="text-xs text-gray-600">{quest.claimCount}x claimed</span>
									{/if}
								</div>
								<!-- Progress -->
								<div class="bounty-progress mt-1.5">
									<div
										class="bounty-progress-fill"
										class:bounty-progress-fill--done={quest.canClaim}
										style="width: {pct}%"
									></div>
									<div class="bounty-progress-text">
										<span>{fmt(Math.min(quest.current, quest.threshold))}</span>
										<span class="text-gray-600">/</span>
										<span>{fmt(quest.threshold)}</span>
									</div>
								</div>
							</div>

							<!-- Right: reward + claim -->
							<div class="bounty-right">
								<span class="reward-badge text-xs">
									<img src={essenceIcon} alt="" class="w-3 h-3 object-contain inline" />
									{quest.rewardDescription}
								</span>
								{#if quest.canClaim}
									<button
										type="button"
										class="claim-btn claim-btn--sm"
										disabled={claimingId === quest.id}
										onclick={() => claimQuest(quest.id)}
									>
										{claimingId === quest.id ? '...' : 'Claim'}
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<a href="/darkrift/quests" class="block mt-3 text-center text-xs text-gray-500 hover:text-violet-400/80 transition-colors">
					View all quests &rarr;
				</a>
			</section>
		{/if}

		<!-- ═══════════════════════════════════════════════════
		     RECENT MATCHES (collapsible)
		     ═══════════════════════════════════════════════════ -->
		{#if !loading && matches.length > 0}
			<section class="rift-panel">
				<button
					type="button"
					class="w-full flex items-center justify-between p-4 text-left"
					onclick={() => (matchesOpen = !matchesOpen)}
				>
					<span class="text-xs font-semibold uppercase tracking-widest text-gray-500">
						Recent Matches
					</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-4 h-4 text-gray-600 transition-transform {matchesOpen ? 'rotate-180' : ''}"
					>
						<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
					</svg>
				</button>
				{#if matchesOpen}
					<div class="px-4 pb-4">
						<MatchHistory
							matches={matches}
							statKeys={openQuestStatKeys.length > 0 ? openQuestStatKeys : undefined}
						/>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ═══════════════════════════════════════════════════
		     QUICK LINKS (deprioritized)
		     ═══════════════════════════════════════════════════ -->
		{#if !loading}
			<div class="flex items-center justify-center gap-4 pt-2 pb-4">
				<a href="/darkrift/atlas" class="subtle-link">
					<span class="gi w-3.5 h-3.5 text-gray-600" style="--gi: url({gi('delapouite', 'atlas')})"></span>
					Atlas
				</a>
				<span class="text-gray-800">&middot;</span>
				<a href="/darkrift/inventory" class="subtle-link">
					<span class="gi w-3.5 h-3.5 text-gray-600" style="--gi: url({gi('delapouite', 'backpack')})"></span>
					Inventory
				</a>
				<span class="text-gray-800">&middot;</span>
				<a href="/darkrift/history" class="subtle-link">
					<span class="gi w-3.5 h-3.5 text-gray-600" style="--gi: url({gi('lorc', 'scroll-unfurled')})"></span>
					History
				</a>
			</div>
		{/if}

		<!-- Loading state -->
		{#if loading}
			<div class="text-center py-16">
				<div class="loading-spinner"></div>
				<p class="text-gray-500 text-sm mt-3">Entering the rift...</p>
			</div>
		{/if}
	</div>
</div>

<style>
	/* ═══ Page atmosphere — Dark Rift palette ═══ */
	.dashboard-page {
		background:
			radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
			radial-gradient(ellipse at 50% 100%, rgba(88, 28, 135, 0.05) 0%, transparent 40%),
			#030712;
	}

	/* ═══ Dark Rift Banner ═══ */
	.rift-banner {
		position: relative;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid rgba(139, 92, 246, 0.2);
	}

	.rift-banner-bg {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
			radial-gradient(ellipse at 80% 80%, rgba(88, 28, 135, 0.08) 0%, transparent 50%),
			linear-gradient(160deg, rgba(15, 10, 30, 0.95), rgba(10, 10, 20, 0.9));
	}

	.rift-title {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, #e2e8f0, #c4b5fd, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.rift-pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgb(52, 211, 153);
		animation: pulse-dot 2s ease-in-out infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(52, 211, 153, 0.4); }
		50% { opacity: 0.5; box-shadow: 0 0 12px rgba(52, 211, 153, 0.6); }
	}

	.rift-cta {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 14px;
		border-radius: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.15));
		border: 1px solid rgba(139, 92, 246, 0.3);
		color: rgb(196, 181, 253);
		transition: all 0.15s ease;
		text-decoration: none;
	}
	.rift-cta:hover {
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(139, 92, 246, 0.25));
		border-color: rgba(139, 92, 246, 0.5);
		color: rgb(221, 214, 254);
	}
	.rift-cta--resume {
		background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1));
		border-color: rgba(52, 211, 153, 0.3);
		color: rgb(110, 231, 183);
	}
	.rift-cta--resume:hover {
		background: linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(52, 211, 153, 0.2));
		border-color: rgba(52, 211, 153, 0.5);
	}

	/* ═══ Rift panels ═══ */
	.rift-panel {
		background: rgba(15, 10, 30, 0.6);
		border: 1px solid rgba(139, 92, 246, 0.12);
		border-radius: 0.75rem;
	}

	/* ═══ Section headings ═══ */
	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.section-heading::before,
	.section-heading::after {
		content: '';
		flex: 1;
		height: 1px;
	}
	.section-heading::before {
		background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25));
	}
	.section-heading::after {
		background: linear-gradient(90deg, rgba(139, 92, 246, 0.25), transparent);
	}

	.heading-label {
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(167, 139, 250, 0.7);
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.claim-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: rgb(139, 92, 246);
		color: white;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 800;
		animation: pulse-dot-violet 2s ease-in-out infinite;
	}

	@keyframes pulse-dot-violet {
		0%, 100% { box-shadow: 0 0 4px rgba(139, 92, 246, 0.3); }
		50% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.6); }
	}

	/* ═══ Journey (onboarding) ═══ */
	.journey-steps {
		display: flex;
		flex-direction: column;
	}

	.journey-step {
		display: grid;
		grid-template-columns: 40px 1fr;
		position: relative;
	}

	.journey-connector {
		position: absolute;
		left: 19px;
		top: -2px;
		width: 2px;
		height: 14px;
		background: rgba(139, 92, 246, 0.15);
	}
	.journey-connector--done {
		background: rgba(139, 92, 246, 0.5);
	}

	.journey-node {
		grid-column: 1;
		grid-row: 1;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(139, 92, 246, 0.2);
		background: rgba(15, 10, 30, 0.9);
		transition: all 0.2s ease;
	}
	.journey-node--claimed {
		background: linear-gradient(135deg, #8b5cf6, #7c3aed);
		border-color: rgb(139, 92, 246);
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
	}
	.journey-node--active {
		border-color: rgb(139, 92, 246);
		box-shadow: 0 0 14px rgba(139, 92, 246, 0.25);
		animation: node-glow 2s ease-in-out infinite;
	}
	.journey-node--locked {
		border-color: rgba(75, 85, 99, 0.2);
		background: rgba(10, 10, 20, 0.8);
	}
	@keyframes node-glow {
		0%, 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.15); }
		50% { box-shadow: 0 0 18px rgba(139, 92, 246, 0.4); }
	}

	.journey-content {
		grid-column: 2;
		grid-row: 1;
		padding: 6px 0 18px 12px;
	}

	/* ═══ Feature cards grid ═══ */
	.feature-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	@media (max-width: 480px) {
		.feature-grid {
			grid-template-columns: 1fr;
		}
	}

	.feature-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		border-radius: 0.75rem;
		background: rgba(15, 10, 30, 0.5);
		border: 1px solid rgba(139, 92, 246, 0.1);
		text-decoration: none;
		transition: all 0.15s ease;
	}
	.feature-card:hover:not(.feature-card--locked) {
		border-color: rgba(139, 92, 246, 0.3);
		background: rgba(25, 18, 45, 0.7);
		transform: translateY(-1px);
	}

	.feature-card--locked {
		opacity: 0.4;
		cursor: default;
	}

	.feature-icon-wrap {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.feature-icon--violet { background: rgba(139, 92, 246, 0.1); }
	.feature-icon--purple { background: rgba(168, 85, 247, 0.1); }
	.feature-icon--indigo { background: rgba(99, 102, 241, 0.1); }
	.feature-icon--emerald { background: rgba(52, 211, 153, 0.1); }
	.feature-icon--locked { background: rgba(31, 41, 55, 0.5); }

	.feature-body {
		flex: 1;
		min-width: 0;
	}

	.feature-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(209, 213, 219);
	}

	.feature-stat {
		font-size: 0.75rem;
		color: rgb(156, 163, 175);
		margin-top: 1px;
	}

	.feature-hint {
		font-size: 0.75rem;
		color: rgb(107, 114, 128);
		margin-top: 1px;
	}

	.feature-arrow {
		font-size: 0.875rem;
		color: rgb(107, 114, 128);
		flex-shrink: 0;
		transition: color 0.15s ease;
	}
	.feature-card:hover:not(.feature-card--locked) .feature-arrow {
		color: rgb(167, 139, 250);
	}

	.coming-soon-badge {
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgb(75, 85, 99);
		border: 1px solid rgba(75, 85, 99, 0.3);
		border-radius: 0.25rem;
		padding: 2px 6px;
		flex-shrink: 0;
	}

	/* ═══ Bounty board (recurring quests) ═══ */
	.bounty-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 0.75rem;
		background: rgba(15, 10, 30, 0.5);
		border: 1px solid rgba(139, 92, 246, 0.08);
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
	}
	.bounty-row--claimable {
		border-color: rgba(139, 92, 246, 0.35);
		box-shadow: 0 0 16px rgba(139, 92, 246, 0.08);
	}

	.bounty-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid rgba(139, 92, 246, 0.2);
		background: rgba(139, 92, 246, 0.05);
		flex-shrink: 0;
	}
	.bounty-icon--pulse {
		border-color: rgba(139, 92, 246, 0.5);
		animation: icon-pulse 2s ease-in-out infinite;
	}
	@keyframes icon-pulse {
		0%, 100% { box-shadow: 0 0 4px rgba(139, 92, 246, 0.1); }
		50% { box-shadow: 0 0 14px rgba(139, 92, 246, 0.3); }
	}

	.bounty-body {
		flex: 1;
		min-width: 0;
	}

	.bounty-progress {
		position: relative;
		height: 18px;
		border-radius: 9999px;
		background: rgba(17, 12, 35, 0.8);
		overflow: hidden;
	}

	.bounty-progress-fill {
		position: absolute;
		inset: 0;
		right: auto;
		border-radius: 9999px;
		background: linear-gradient(90deg, rgba(139, 92, 246, 0.45), rgba(167, 139, 250, 0.55));
		transition: width 0.3s ease-out;
	}
	.bounty-progress-fill--done {
		background: linear-gradient(90deg, rgba(139, 92, 246, 0.7), rgba(167, 139, 250, 0.85));
	}

	.bounty-progress-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 700;
		color: rgb(221, 214, 254);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		font-variant-numeric: tabular-nums;
	}

	.bounty-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		flex-shrink: 0;
	}

	/* ═══ Reward badge ═══ */
	.reward-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 600;
		color: rgb(196, 181, 253);
		background: rgba(139, 92, 246, 0.08);
		border: 1px solid rgba(139, 92, 246, 0.15);
		border-radius: 0.375rem;
		padding: 2px 8px;
	}

	/* ═══ Buttons ═══ */
	.claim-btn {
		border-radius: 0.375rem;
		background: rgb(139, 92, 246);
		padding: 5px 12px;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 700;
		color: white;
		transition: background 0.15s ease;
		box-shadow: 0 1px 3px rgba(88, 28, 135, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.claim-btn:hover:not(:disabled) {
		background: rgb(167, 139, 250);
	}
	.claim-btn:disabled {
		opacity: 0.5;
	}
	.claim-btn--glow {
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.3), 0 1px 3px rgba(88, 28, 135, 0.4);
	}
	.claim-btn--sm {
		padding: 3px 10px;
		font-size: 0.75rem; /* text-xs minimum */
	}

	.go-btn {
		display: inline-flex;
		align-items: center;
		border-radius: 0.375rem;
		border: 1px solid rgba(139, 92, 246, 0.25);
		background: rgba(139, 92, 246, 0.08);
		padding: 3px 10px;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 600;
		color: rgb(196, 181, 253);
		transition: all 0.15s ease;
		text-decoration: none;
	}
	.go-btn:hover {
		background: rgba(139, 92, 246, 0.15);
		border-color: rgba(139, 92, 246, 0.4);
		color: rgb(221, 214, 254);
	}

	/* ═══ Subtle links ═══ */
	.subtle-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		color: rgb(107, 114, 128);
		text-decoration: none;
		transition: color 0.15s ease;
	}
	.subtle-link:hover {
		color: rgb(167, 139, 250);
	}

	/* ═══ Loading spinner ═══ */
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(139, 92, 246, 0.2);
		border-top-color: rgb(139, 92, 246);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		margin: 0 auto;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
