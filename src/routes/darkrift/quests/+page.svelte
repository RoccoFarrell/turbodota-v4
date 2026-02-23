<script lang="ts">
	import { onMount } from 'svelte';
	import essenceIcon from '$lib/assets/essence.png';
	import { toaster } from '$lib/toaster';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import QuestIcon from '$lib/incremental/quests/QuestIcon.svelte';
	import MatchHistory from '$lib/incremental/components/MatchHistory.svelte';
	import type { MatchHistoryRow } from '$lib/incremental/components/MatchHistory.svelte';
	import type { StatKey } from '$lib/incremental/quests/quest-definitions';

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
		lastActivityAt: number | null;
		rewardDescription: string;
		startedAt: string | null;
		turboMatchesSinceStart: number | null;
		rankedMatchesSinceStart: number | null;
		order: number | null;
		locked: boolean;
		navLink: string | null;
	}

	let quests = $state<QuestData[]>([]);
	let matches = $state<MatchHistoryRow[]>([]);
	let loading = $state(true);
	let errorMsg = $state<string | null>(null);
	let claimingId = $state<string | null>(null);
	let matchesOpen = $state(false);

	const onboardingQuests = $derived(quests.filter((q) => q.type === 'onboarding'));
	const recurringQuests = $derived(quests.filter((q) => q.type === 'recurring'));

	/** Whether the entire onboarding journey is done (all claimed). */
	const journeyComplete = $derived(
		onboardingQuests.length > 0 && onboardingQuests.every((q) => q.claimCount > 0)
	);

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

	/** Format large numbers compactly: 150000 -> "150k", 1234567 -> "1.23M". */
	function fmt(n: number): string {
		if (n >= 1_000_000)
			return (
				(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M'
			);
		if (n >= 10_000)
			return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace(/\.?0+$/, '') + 'k';
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

	function progressPct(current: number, threshold: number): number {
		if (threshold <= 0) return 100;
		return Math.min(100, (current / threshold) * 100);
	}

	onMount(async () => {
		await actionStore.ensureSave();
		await Promise.all([fetchQuests(), fetchMatches()]);
	});
</script>

<div class="quests-page min-h-full">
	<div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
		<!-- ═══ HEADER ═══ -->
		<header>
			<h1 class="text-3xl font-bold tracking-tight text-amber-100">Quests</h1>
			<p class="mt-1 text-sm text-stone-500 italic">
				Complete bounties and forge your legend...
			</p>
		</header>

		{#if loading}
			<div class="text-center py-16">
				<div class="loading-spinner"></div>
				<p class="text-stone-500 text-sm mt-3">Loading quests...</p>
			</div>
		{:else if errorMsg}
			<div class="tavern-panel p-6 text-center border-red-900/30">
				<p class="text-red-400 text-sm">{errorMsg}</p>
				<button
					type="button"
					class="mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
					onclick={() => {
						loading = true;
						fetchQuests();
					}}
				>
					Retry
				</button>
			</div>
		{:else}
			<!-- ═══ JOURNEY SECTION (onboarding) ═══ -->
			{#if onboardingQuests.length > 0 && !journeyComplete}
				<section class="tavern-panel p-5 sm:p-6">
					<div class="tavern-heading">
						<span class="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
							>Journey</span
						>
					</div>
					<p class="mt-3 text-sm text-stone-500">
						Follow the path to unlock the power of the Dark Rift.
					</p>

					<!-- Vertical step path -->
					<div class="journey-path mt-6">
						{#each onboardingQuests as quest, i (quest.id)}
							{@const claimed = quest.claimCount > 0}
							{@const isNext = quest.canClaim || (!claimed && !quest.locked && !quest.completed)}
							<div class="journey-step" class:journey-step--claimed={claimed} class:journey-step--active={isNext || quest.canClaim} class:journey-step--locked={quest.locked && !claimed}>
								<!-- Connecting line (not on first) -->
								{#if i > 0}
									<div class="journey-line" class:journey-line--done={claimed}></div>
								{/if}

								<!-- Step node -->
								<div class="journey-node" class:journey-node--claimed={claimed} class:journey-node--active={quest.canClaim} class:journey-node--locked={quest.locked}>
									{#if claimed}
										<!-- Checkmark -->
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-amber-900">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									{:else}
										<QuestIcon iconId={quest.iconId} size={22} iconClass={quest.locked ? 'text-stone-600' : 'text-amber-300'} />
									{/if}
								</div>

								<!-- Step content -->
								<div class="journey-content">
									<div class="flex items-center gap-2 flex-wrap">
										<h3 class="text-sm font-semibold {claimed ? 'text-stone-500 line-through' : quest.locked ? 'text-stone-600' : 'text-stone-100'}">
											{quest.label}
										</h3>
										{#if claimed}
											<span class="text-xs uppercase tracking-wider text-amber-600 font-semibold">Claimed</span>
										{/if}
									</div>
									{#if quest.description}
										<p class="text-xs mt-0.5 {quest.locked ? 'text-stone-700' : 'text-stone-500'}">
											{quest.description}
										</p>
									{/if}

									<!-- Reward preview -->
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
													{claimingId === quest.id ? 'Claiming...' : 'Claim Reward'}
												</button>
											{:else if !quest.locked && !quest.completed && quest.navLink}
												<a
													href={quest.navLink}
													class="go-btn"
												>
													Go &rarr;
												</a>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- ═══ BOUNTY BOARD SECTION (recurring quests) ═══ -->
			{#if recurringQuests.length > 0}
				<section>
					<div class="tavern-heading mb-5">
						<span class="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
							>Bounty Board</span
						>
					</div>

					<div class="space-y-3">
						{#each recurringQuests as quest (quest.id)}
							{@const pct = progressPct(quest.current, quest.threshold)}
							<div
								class="bounty-card"
								class:bounty-card--claimable={quest.canClaim}
							>
								<!-- Left: Loot reward display -->
								<div class="bounty-loot">
									<div class="loot-ring" class:loot-ring--pulse={quest.canClaim}>
										<QuestIcon iconId={quest.iconId} size={32} iconClass="text-amber-400" />
									</div>
									<span class="loot-label">{quest.rewardDescription}</span>
								</div>

								<!-- Right: Quest details + progress -->
								<div class="bounty-details">
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2 flex-wrap">
											<h3 class="text-sm font-semibold text-stone-100">
												{quest.label}
											</h3>
											{#if quest.canClaim}
												<span class="text-xs uppercase tracking-wider text-amber-400 font-bold animate-pulse">
													Complete!
												</span>
											{/if}
											{#if quest.claimCount > 0}
												<span class="text-xs text-stone-600">
													Claimed {quest.claimCount}x
												</span>
											{/if}
										</div>
									</div>

									<!-- Metadata row -->
									<div class="flex items-center gap-3 mt-1 text-xs text-stone-600 flex-wrap">
										{#if quest.startedAt}
											<span>Since {formatQuestStartDate(quest.startedAt)}</span>
										{/if}
										{#if quest.turboMatchesSinceStart != null}
											<span>
												Turbo: <span class="text-stone-400">{quest.turboMatchesSinceStart}</span>
											</span>
										{/if}
										{#if quest.rankedMatchesSinceStart != null}
											<span>
												Ranked: <span class="text-stone-400">{quest.rankedMatchesSinceStart}</span>
											</span>
										{/if}
										{#if quest.lastActivityAt != null}
											<span>Last: {formatLastActivity(quest.lastActivityAt)}</span>
										{/if}
									</div>

									<!-- Progress bar -->
									<div class="bounty-progress mt-2">
										<div
											class="bounty-progress-fill"
											class:bounty-progress-fill--done={quest.canClaim}
											style="width: {pct}%"
										></div>
										<div class="bounty-progress-text">
											<span>{fmt(Math.min(quest.current, quest.threshold))}</span>
											<span class="text-stone-600">/</span>
											<span>{fmt(quest.threshold)}</span>
										</div>
									</div>

									<!-- Claim button -->
									{#if quest.canClaim}
										<div class="mt-2.5 flex justify-end">
											<button
												type="button"
												class="claim-btn claim-btn--glow"
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
				</section>
			{/if}

			<!-- ═══ RECENT MATCHES (collapsible) ═══ -->
			{#if matches.length > 0}
				<section class="tavern-panel">
					<button
						type="button"
						class="w-full flex items-center justify-between p-4 text-left"
						onclick={() => (matchesOpen = !matchesOpen)}
					>
						<span class="text-xs font-semibold uppercase tracking-widest text-stone-500">
							Recent Matches
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-4 h-4 text-stone-600 transition-transform {matchesOpen ? 'rotate-180' : ''}"
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
		{/if}
	</div>
</div>

<style>
	/* ── Page atmosphere (matches tavern) ── */
	.quests-page {
		background:
			radial-gradient(ellipse at 50% 0%, rgba(180, 120, 40, 0.06) 0%, transparent 50%),
			#1a1410;
	}

	/* ── Shared tavern panels ── */
	.tavern-panel {
		background: rgba(30, 24, 18, 0.8);
		border: 1px solid rgba(120, 80, 30, 0.15);
		border-radius: 0.75rem;
	}

	.tavern-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.tavern-heading::before,
	.tavern-heading::after {
		content: '';
		flex: 1;
		height: 1px;
	}
	.tavern-heading::before {
		background: linear-gradient(90deg, transparent, rgba(180, 120, 40, 0.3));
	}
	.tavern-heading::after {
		background: linear-gradient(90deg, rgba(180, 120, 40, 0.3), transparent);
	}

	/* ── Loading spinner ── */
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(180, 120, 40, 0.2);
		border-top-color: rgb(217, 119, 6);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		margin: 0 auto;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ── Journey (onboarding) ── */
	.journey-path {
		display: flex;
		flex-direction: column;
	}

	.journey-step {
		display: grid;
		grid-template-columns: 44px 1fr;
		grid-template-rows: auto;
		position: relative;
	}

	.journey-line {
		position: absolute;
		left: 21px;
		top: -2px;
		width: 2px;
		height: 16px;
		background: rgba(120, 80, 30, 0.2);
	}
	.journey-line--done {
		background: rgba(217, 119, 6, 0.5);
	}

	.journey-node {
		grid-column: 1;
		grid-row: 1;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(120, 80, 30, 0.25);
		background: rgba(30, 24, 18, 0.9);
		transition: all 0.2s ease;
	}
	.journey-node--claimed {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-color: rgb(245, 158, 11);
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
	}
	.journey-node--active {
		border-color: rgb(217, 119, 6);
		box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
		animation: node-pulse 2s ease-in-out infinite;
	}
	.journey-node--locked {
		border-color: rgba(80, 60, 40, 0.2);
		background: rgba(20, 16, 12, 0.8);
	}
	@keyframes node-pulse {
		0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.2); }
		50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
	}

	.journey-content {
		grid-column: 2;
		grid-row: 1;
		padding: 8px 0 20px 12px;
	}

	/* ── Reward badge ── */
	.reward-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 600;
		color: rgb(217, 161, 81);
		background: rgba(217, 119, 6, 0.08);
		border: 1px solid rgba(217, 119, 6, 0.15);
		border-radius: 0.375rem;
		padding: 2px 8px;
	}

	/* ── Bounty card (recurring quest) ── */
	.bounty-card {
		display: flex;
		gap: 0;
		border-radius: 0.75rem;
		border: 1px solid rgba(120, 80, 30, 0.15);
		background: rgba(30, 24, 18, 0.8);
		overflow: hidden;
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
	}
	.bounty-card--claimable {
		border-color: rgba(217, 119, 6, 0.4);
		box-shadow: 0 0 20px rgba(217, 119, 6, 0.08);
		animation: bounty-glow 2.5s ease-in-out infinite;
	}
	@keyframes bounty-glow {
		0%, 100% { box-shadow: 0 0 12px rgba(217, 119, 6, 0.06); }
		50% { box-shadow: 0 0 24px rgba(217, 119, 6, 0.12); }
	}

	/* Left: loot reward area */
	.bounty-loot {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 16px 14px;
		min-width: 90px;
		background: rgba(20, 16, 12, 0.5);
		border-right: 1px solid rgba(120, 80, 30, 0.1);
	}

	.loot-ring {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid rgba(217, 119, 6, 0.3);
		background: rgba(217, 119, 6, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	.loot-ring--pulse {
		border-color: rgba(245, 158, 11, 0.6);
		box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
		animation: loot-pulse 2s ease-in-out infinite;
	}
	@keyframes loot-pulse {
		0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
		50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.35); }
	}

	.loot-label {
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 600;
		color: rgb(168, 130, 80);
		text-align: center;
		line-height: 1.2;
		max-width: 80px;
	}

	/* Right: quest details */
	.bounty-details {
		flex: 1;
		min-width: 0;
		padding: 14px 16px;
	}

	/* Progress bar */
	.bounty-progress {
		position: relative;
		height: 22px;
		border-radius: 9999px;
		background: rgba(42, 33, 24, 0.8);
		overflow: hidden;
	}

	.bounty-progress-fill {
		position: absolute;
		inset: 0;
		right: auto;
		border-radius: 9999px;
		background: linear-gradient(90deg, rgba(217, 119, 6, 0.6), rgba(245, 158, 11, 0.7));
		transition: width 0.3s ease-out;
	}
	.bounty-progress-fill--done {
		background: linear-gradient(90deg, rgba(217, 119, 6, 0.8), rgba(245, 158, 11, 0.9));
	}

	.bounty-progress-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 12px;
		font-weight: 700;
		color: rgb(245, 208, 140);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		font-variant-numeric: tabular-nums;
	}

	/* ── Buttons ── */
	.claim-btn {
		border-radius: 0.375rem;
		background: rgb(217, 119, 6);
		padding: 6px 14px;
		font-size: 12px;
		font-weight: 700;
		color: rgb(69, 26, 3);
		transition: background 0.15s ease;
		box-shadow: 0 1px 3px rgba(120, 53, 0, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.claim-btn:hover:not(:disabled) {
		background: rgb(245, 158, 11);
	}
	.claim-btn:disabled {
		opacity: 0.5;
	}
	.claim-btn--glow {
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.3), 0 1px 3px rgba(120, 53, 0, 0.3);
	}

	.go-btn {
		display: inline-flex;
		align-items: center;
		border-radius: 0.375rem;
		border: 1px solid rgba(120, 80, 30, 0.3);
		background: rgba(217, 119, 6, 0.08);
		padding: 4px 12px;
		font-size: 12px;
		font-weight: 600;
		color: rgb(217, 161, 81);
		transition: all 0.15s ease;
		text-decoration: none;
	}
	.go-btn:hover {
		background: rgba(217, 119, 6, 0.15);
		border-color: rgba(217, 119, 6, 0.4);
		color: rgb(245, 190, 100);
	}
</style>
