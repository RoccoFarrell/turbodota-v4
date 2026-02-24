<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { dev } from '$app/environment';
	import essenceIcon from '$lib/assets/essence.png';
	import { toaster } from '$lib/toaster';
	import {
		formatStat,
		getRecruitCost,
		TRAINING_BUILDINGS,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { formatDuration, timeAgo } from '$lib/incremental/stats/format-helpers';
	import HeroDetailPanel from '$lib/incremental/components/HeroDetailPanel.svelte';

	const layoutHeroes =
		getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	let heroesFromApi = $state<{
		heroes: HeroDef[];
		heroNames: Array<{ heroId: number; localizedName: string }>;
		abilityDefs: Record<string, AbilityDef>;
	}>({
		heroes: [],
		heroNames: [],
		abilityDefs: {}
	});

	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(
		new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName]))
	);

	function heroName(heroId: number, fallback: string): string {
		return (
			heroNameById.get(heroId) ??
			layoutHeroes.find((h) => h.id === heroId)?.localized_name ??
			fallback
		);
	}

	function getHeroDef(hid: number): HeroDef | undefined {
		return heroById.get(hid);
	}

	function getAbilityDef(aid: string): AbilityDef | undefined {
		return heroesFromApi.abilityDefs[aid];
	}

	let saveId = $state<string | null>(null);
	let saves = $state<
		Array<{ id: string; name: string | null; essence: number; createdAt: string }>
	>([]);
	let essence = $state(0);
	let rosterHeroIds = $state<number[]>([]);
	let trainingValues = $state<Record<number, Record<string, number>>>({});

	type RecentMatch = {
		matchId: string;
		heroId: number;
		heroName: string;
		startTime: number;
		gameModeLabel: string;
		win: boolean;
		alreadyRecruited: boolean;
		isDuplicateHero: boolean;
		eligible: boolean;
	};

	let recentMatches = $state<RecentMatch[]>([]);
	let eligibleWins = $state<RecentMatch[]>([]);
	let convertingMatchId = $state<string | null>(null);

	// Debug recruit
	let debugRecruitHeroId = $state<string>('');
	let debugRecruiting = $state(false);

	// Roster filters + selection
	let searchQuery = $state('');
	let attrFilter = $state<string | null>(null);
	let selectedHeroId = $state<number | null>(null);

	const filteredRoster = $derived(
		(() => {
			let heroes = rosterHeroIds;
			if (attrFilter) {
				heroes = heroes.filter((hid) => {
					const def = getHeroDef(hid);
					return def?.primaryAttribute === attrFilter;
				});
			}
			if (searchQuery.trim()) {
				const q = searchQuery.trim().toLowerCase();
				heroes = heroes.filter((hid) => heroName(hid, '').toLowerCase().includes(q));
			}
			return heroes;
		})()
	);

	const selectedDef = $derived(selectedHeroId != null ? getHeroDef(selectedHeroId) : null);
	const selectedTraining = $derived(
		selectedHeroId != null ? (trainingValues[selectedHeroId] ?? {}) : {}
	);

	// Training history for selected hero
	type TrainingSession = {
		statKey: string;
		completions: number;
		startedAt: string;
		endedAt: string;
	};
	let trainingHistory = $state<TrainingSession[]>([]);
	let trainingHistoryLoading = $state(false);
	let trainingHistoryHeroId = $state<number | null>(null);

	const ATTR_CHIPS: Array<{
		key: string;
		label: string;
		activeClasses: string;
	}> = [
		{ key: 'str', label: 'STR', activeClasses: 'bg-red-500/20 border-red-500/40 text-red-400' },
		{
			key: 'agi',
			label: 'AGI',
			activeClasses: 'bg-green-500/20 border-green-500/40 text-green-400'
		},
		{
			key: 'int',
			label: 'INT',
			activeClasses: 'bg-blue-500/20 border-blue-500/40 text-blue-400'
		},
		{
			key: 'universal',
			label: 'UNI',
			activeClasses: 'bg-purple-500/20 border-purple-500/40 text-purple-400'
		}
	];

	function toggleAttrFilter(key: string) {
		attrFilter = attrFilter === key ? null : key;
	}

	function selectHero(hid: number) {
		selectedHeroId = selectedHeroId === hid ? null : hid;
		if (selectedHeroId != null) {
			fetchTrainingHistory(selectedHeroId);
		}
	}

	function attrOf(hid: number): string {
		return getHeroDef(hid)?.primaryAttribute ?? 'universal';
	}

	const recruitCost = $derived(getRecruitCost(rosterHeroIds.length));

	function matchFaded(m: RecentMatch): boolean {
		return !m.win || m.alreadyRecruited || m.isDuplicateHero;
	}

	function matchReason(m: RecentMatch): string {
		if (!m.win) return 'Loss';
		if (m.alreadyRecruited) return 'Already recruited';
		if (m.isDuplicateHero) return 'Hero on roster';
		return '';
	}

	// ── Fetch functions ──

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
			const w = await fetch('/api/incremental/bank');
			if (w.ok) {
				const data = await w.json();
				saveId = data.saveId ?? null;
				essence = data.essence ?? 0;
			}
		}
	}

	async function fetchBank() {
		await ensureSave();
		const res = await fetch(`/api/incremental/bank${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			essence = data.essence ?? 0;
			if (data.saveId) saveId = data.saveId;
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
				map[t.heroId][t.statKey] = t.effectiveStat;
			}
			trainingValues = map;
		}
	}

	async function fetchHeroes() {
		const res = await fetch('/api/incremental/heroes');
		if (res.ok) {
			const data = await res.json();
			heroesFromApi = {
				heroes: data.heroes ?? [],
				heroNames: data.heroNames ?? [],
				abilityDefs: data.abilityDefs ?? {}
			};
		}
	}

	async function fetchTrainingHistory(heroId: number) {
		if (!saveId) return;
		trainingHistoryLoading = true;
		trainingHistoryHeroId = heroId;
		try {
			const params = new URLSearchParams({ heroId: String(heroId) });
			if (saveId) params.set('saveId', saveId);
			const res = await fetch(`/api/incremental/training/history?${params}`);
			if (res.ok && trainingHistoryHeroId === heroId) {
				const data = await res.json();
				trainingHistory = data.sessions ?? [];
			}
		} finally {
			if (trainingHistoryHeroId === heroId) trainingHistoryLoading = false;
		}
	}

	async function fetchEligibleWins() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster/eligible-wins${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			recentMatches = data.recentMatches ?? [];
			eligibleWins = data.eligibleWins ?? [];
		}
	}

	async function recruitHero(matchId: string) {
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
					title: 'Recruit failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			essence = data.essence ?? essence;
			toaster.success({
				title: 'Hero recruited',
				description: 'They have joined your company.'
			});
			await fetchEligibleWins();
			await fetchRoster();
		} finally {
			convertingMatchId = null;
		}
	}

	async function recruitHeroDebug() {
		const heroId = debugRecruitHeroId ? parseInt(debugRecruitHeroId, 10) : null;
		if (heroId == null || !saveId) return;
		debugRecruiting = true;
		try {
			const res = await fetch('/api/incremental/roster/recruit-debug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, heroId })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({
					title: 'Debug recruit failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			toaster.success({
				title: 'Hero recruited (debug)',
				description: 'They have joined your company.'
			});
			debugRecruitHeroId = '';
			await fetchRoster();
			await fetchEligibleWins();
		} finally {
			debugRecruiting = false;
		}
	}

	function reloadAll() {
		fetchBank();
		fetchHeroes();
		fetchEligibleWins();
		fetchRoster();
		fetchTraining();
	}

	onMount(() => {
		(async () => {
			await fetchBank();
			await fetchHeroes();
			await fetchEligibleWins();
			await fetchRoster();
			await fetchTraining();
		})();
	});
</script>

<div class="tavern-page min-h-full">
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
		<!-- ═══ HEADER ═══ -->
		<header class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-amber-100">The Tavern</h1>
				<p class="mt-1 text-sm text-stone-500 italic">
					Heroes gather between adventures, seeking glory and gold...
				</p>
			</div>
			<div
				class="flex items-center gap-2.5 rounded-lg bg-amber-900/20 border border-amber-700/30 px-3.5 py-2 shrink-0"
			>
				<img src={essenceIcon} alt="Essence" class="w-5 h-5 object-contain" />
				<span class="text-lg font-bold text-amber-300 tabular-nums">{essence}</span>
			</div>
		</header>

		<!-- Save selector (multiple saves) -->
		{#if saves.length > 1}
			<div class="tavern-panel p-3">
				<label for="tavern-save" class="text-sm font-medium text-stone-400">Save</label>
				<select
					id="tavern-save"
					class="mt-1 block w-full rounded border border-amber-900/30 bg-stone-900 px-3 py-2 text-stone-100"
					bind:value={saveId}
					onchange={reloadAll}
				>
					{#each saves as s}
						<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
					{/each}
				</select>
			</div>
		{/if}

		<!-- ═══ MAIN CONTENT: 2-col ═══ -->
		<div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
			<!-- ─── LEFT: THE BOARD ─── -->
			<section class="tavern-panel p-5">
				<h2 class="tavern-heading">
					<span
						class="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
						>The Board</span
					>
				</h2>

				<p class="mt-3 text-sm text-stone-400">
					Win on a hero in
					<span class="text-amber-300 font-medium">Ranked</span>
					or
					<span class="text-amber-300 font-medium">Turbo</span>, then spend
					{#if recruitCost === 0}
						<span class="text-emerald-400 font-medium">free</span>
					{:else}
						<span class="text-amber-300 font-medium"
							>{recruitCost.toLocaleString()} Essence</span
						>
					{/if}
					to recruit them.
				</p>

				{#if recentMatches.length === 0}
					<div
						class="mt-4 rounded-lg border border-dashed border-amber-900/30 p-6 text-center"
					>
						<p class="text-sm text-stone-500">The board is bare.</p>
						<p class="text-xs text-stone-600 mt-1">
							Play Ranked or Turbo to see heroes appear.
						</p>
					</div>
				{:else}
					<p class="mt-4 text-xs uppercase tracking-wide text-stone-600">
						Recent games
					</p>
					<ul class="mt-2 space-y-1.5">
						{#each recentMatches as m}
							<li
								class="match-posting flex items-center gap-2 rounded-lg p-2.5
									{m.eligible ? 'match-posting--eligible' : ''}
									{matchFaded(m) ? 'match-posting--faded' : ''}"
							>
								<i
									class="d2mh hero-{m.heroId} shrink-0 scale-110"
									title={heroName(m.heroId, m.heroName)}
								></i>
								<div class="min-w-0 flex-1">
									<span
										class="font-medium text-stone-100 text-sm block truncate"
									>
										{heroName(m.heroId, m.heroName)}
									</span>
									<span
										class="text-xs text-stone-500 flex items-center gap-1.5 flex-wrap"
									>
										<span
											class={m.gameModeLabel === 'Ranked'
												? 'text-amber-400/70'
												: m.gameModeLabel === 'Turbo'
													? 'text-cyan-400/70'
													: 'text-stone-500'}
										>
											{m.gameModeLabel}
										</span>
										<span class="text-stone-700">&middot;</span>
										<time
											datetime={new Date(
												m.startTime * 1000
											).toISOString()}
										>
											{new Date(m.startTime * 1000).toLocaleString(
												undefined,
												{ dateStyle: 'short', timeStyle: 'short' }
											)}
										</time>
										{#if matchFaded(m)}
											<span class="text-stone-600"
												>&middot; {matchReason(m)}</span
											>
										{/if}
									</span>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									{#if m.eligible}
										<button
											class="recruit-btn"
											disabled={essence < recruitCost ||
												convertingMatchId === m.matchId}
											onclick={() => recruitHero(m.matchId)}
										>
											{convertingMatchId === m.matchId
												? '...'
												: recruitCost === 0
													? 'Recruit (Free)'
													: `Recruit (${recruitCost.toLocaleString()})`}
										</button>
									{:else}
										<span class="text-xs text-stone-600"
											>{matchReason(m)}</span
										>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Debug recruit (dev only) -->
				{#if dev}
					<div class="mt-5 rounded-lg border border-amber-600/30 bg-amber-900/10 p-3">
						<p
							class="text-xs font-semibold uppercase tracking-wide text-amber-500"
						>
							Debug Recruit
						</p>
						<div class="mt-2 flex flex-wrap items-end gap-2">
							<select
								class="flex-1 min-w-40 rounded border border-amber-900/30 bg-stone-900 px-2 py-1.5 text-sm text-stone-100"
								bind:value={debugRecruitHeroId}
							>
								<option value="">-- Select hero --</option>
								{#each layoutHeroes as h}
									<option
										value={h.id}
										disabled={rosterHeroIds.includes(h.id)}
									>
										{h.localized_name}{rosterHeroIds.includes(h.id)
											? ' (rostered)'
											: ''}
									</option>
								{/each}
							</select>
							<button
								class="rounded bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-600 disabled:opacity-50 transition-colors"
								disabled={!debugRecruitHeroId || debugRecruiting}
								onclick={recruitHeroDebug}
							>
								{debugRecruiting ? '...' : 'Recruit'}
							</button>
						</div>
					</div>
				{/if}
			</section>

			<!-- ─── RIGHT: YOUR COMPANY ─── -->
			<section class="tavern-panel p-5">
				<h2 class="tavern-heading">
					<span
						class="text-xs font-semibold uppercase tracking-widest text-amber-400/80"
						>Your Company</span
					>
					{#if rosterHeroIds.length > 0}
						<span class="text-xs text-stone-500 tabular-nums">
							{filteredRoster.length === rosterHeroIds.length
								? rosterHeroIds.length
								: `${filteredRoster.length} / ${rosterHeroIds.length}`}
						</span>
					{/if}
				</h2>

				<!-- Filters -->
				{#if rosterHeroIds.length > 0}
					<div class="mt-3 flex items-center gap-2 flex-wrap">
						{#each ATTR_CHIPS as chip}
							<button
								class="attr-chip {attrFilter === chip.key
									? chip.activeClasses
									: 'border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-400'}"
								onclick={() => toggleAttrFilter(chip.key)}
							>
								{chip.label}
							</button>
						{/each}
						<input
							type="text"
							placeholder="Search..."
							class="ml-auto rounded-md border border-stone-700 bg-stone-900/50 px-2.5 py-1 text-xs text-stone-200 placeholder:text-stone-600 focus:border-amber-700/50 focus:outline-none w-32"
							bind:value={searchQuery}
						/>
					</div>
				{/if}

				<!-- Hero grid -->
				{#if rosterHeroIds.length === 0}
					<div
						class="mt-4 rounded-lg border border-dashed border-amber-900/30 p-8 text-center"
					>
						<p class="text-sm text-stone-500">Your company is empty.</p>
						<p class="text-xs text-stone-600 mt-1">
							Recruit heroes from the board to build your roster.
						</p>
					</div>
				{:else if filteredRoster.length === 0}
					<div
						class="mt-4 rounded-lg border border-dashed border-stone-800 p-6 text-center"
					>
						<p class="text-sm text-stone-500">No heroes match your search.</p>
					</div>
				{:else}
					<div class="hero-grid mt-3">
						{#each filteredRoster as hid (hid)}
							{@const attr = attrOf(hid)}
							<button
								class="hero-tile hero-tile--{attr}"
								class:hero-tile--selected={selectedHeroId === hid}
								title={heroName(hid, '')}
								onclick={() => selectHero(hid)}
								aria-label={heroName(hid, 'Hero')}
							>
								<span class="d2mh hero-{hid}" aria-hidden="true"></span>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Selected hero detail -->
				{#if selectedHeroId != null && selectedDef}
					<div class="mt-4" transition:slide={{ duration: 200 }}>
						<HeroDetailPanel
							heroDef={selectedDef}
							heroName={heroName(selectedHeroId, 'Unknown')}
							training={selectedTraining}
							abilityDefs={heroesFromApi.abilityDefs}
							{getAbilityDef}
							theme="tavern"
							showCloseButton={true}
							onClose={() => (selectedHeroId = null)}
						>
							{#snippet children()}
								<!-- Training History (Tavern-specific) -->
								{@const trainedStats = Object.entries(selectedTraining).filter(([, v]) => v > 0)}
								{#if trainedStats.length > 0}
									<div class="mt-3 pt-3 border-t border-amber-900/20">
										<p class="text-xs uppercase tracking-wide text-stone-600 mb-2">
											Training History
										</p>

										<!-- Summary table -->
										<div class="space-y-1">
											{#each trainedStats as [statKey, value]}
												{@const building = TRAINING_BUILDINGS[statKey as TrainingStatKey]}
												{@const sessionsForStat = trainingHistory.filter((s) => s.statKey === statKey)}
												{@const totalTimeSec = sessionsForStat.reduce((sum, s) => {
													const start = new Date(s.startedAt).getTime();
													const end = new Date(s.endedAt).getTime();
													return sum + (end - start) / 1000;
												}, 0)}
												<div class="flex items-center gap-2 text-sm">
													{#if building}
														<span class="gi w-4 h-4 shrink-0 {building.color} opacity-70" style="--gi: url({building.icon})"></span>
													{/if}
													<span class="text-stone-400 flex-1 min-w-0 truncate">{building?.name ?? statKey}</span>
													<span class="text-emerald-400 font-medium tabular-nums">+{formatStat(value)}</span>
													{#if totalTimeSec > 0}
														<span class="text-stone-600 text-xs tabular-nums">{formatDuration(totalTimeSec)}</span>
													{/if}
												</div>
											{/each}
										</div>

										<!-- Recent sessions (collapsible) -->
										{#if trainingHistoryLoading}
											<p class="mt-2 text-xs text-stone-600">Loading sessions...</p>
										{:else if trainingHistory.length > 0}
											<details class="mt-2">
												<summary class="text-xs text-stone-500 cursor-pointer hover:text-stone-400 select-none">
													Recent sessions ({trainingHistory.length})
												</summary>
												<div class="mt-1.5 space-y-0.5">
													{#each trainingHistory as session}
														{@const building = TRAINING_BUILDINGS[session.statKey as TrainingStatKey]}
														{@const durSec = (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000}
														<div class="flex items-center gap-2 text-xs py-0.5">
															<span class="text-stone-600 w-20 shrink-0 tabular-nums">{timeAgo(session.endedAt)}</span>
															<span class="text-stone-400 flex-1 min-w-0 truncate">{building?.name ?? session.statKey}</span>
															<span class="text-emerald-400 tabular-nums">+{session.completions}</span>
															<span class="text-stone-600 tabular-nums">{formatDuration(durSec)}</span>
														</div>
													{/each}
												</div>
											</details>
										{/if}
									</div>
								{/if}
							{/snippet}
						</HeroDetailPanel>
					</div>
				{/if}
			</section>
		</div>
	</div>
</div>

<style>
	/* ── Tavern atmosphere ── */
	.tavern-page {
		background:
			radial-gradient(ellipse at 50% 0%, rgba(180, 120, 40, 0.07) 0%, transparent 50%),
			#1a1410;
	}

	.tavern-panel {
		background: rgba(30, 24, 18, 0.8);
		border: 1px solid rgba(120, 80, 30, 0.15);
		border-radius: 0.75rem;
	}

	/* ── Decorative section headers ── */
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

	/* ── Attribute filter chips ── */
	.attr-chip {
		border-radius: 0.375rem;
		border-width: 1px;
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem; /* text-xs minimum */
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.15s ease;
	}

	/* ── Hero portrait grid ── */
	.hero-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: 6px;
	}

	.hero-tile {
		position: relative;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: rgba(42, 33, 24, 0.6);
		border: 1px solid rgba(120, 90, 50, 0.2);
		cursor: pointer;
		transition: all 0.15s ease;
		overflow: hidden;
	}
	.hero-tile:hover {
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
		border-color: rgba(245, 158, 11, 0.4);
		transform: scale(1.1);
		z-index: 1;
	}
	.hero-tile--selected {
		box-shadow: 0 0 16px rgba(245, 158, 11, 0.45);
		border-color: rgb(245, 158, 11);
		transform: scale(1.1);
		z-index: 1;
	}

	/* Attribute color bar at bottom of each tile */
	.hero-tile::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 3px;
		right: 3px;
		height: 3px;
		border-radius: 0 0 3px 3px;
	}
	.hero-tile--str::after {
		background: rgb(239, 68, 68);
	}
	.hero-tile--agi::after {
		background: rgb(34, 197, 94);
	}
	.hero-tile--int::after {
		background: rgb(59, 130, 246);
	}
	.hero-tile--universal::after {
		background: rgb(168, 85, 247);
	}

	/* ── Match postings ── */
	.match-posting {
		border-left: 3px solid transparent;
		background: rgba(30, 24, 18, 0.4);
		transition: all 0.15s ease;
	}
	.match-posting--eligible {
		border-left-color: rgb(217, 119, 6);
		background: rgba(180, 120, 40, 0.08);
	}
	.match-posting--faded {
		opacity: 0.4;
	}

	/* ── Recruit button ── */
	.recruit-btn {
		border-radius: 0.375rem;
		background: rgb(217, 119, 6);
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: rgb(69, 26, 3);
		transition: background 0.15s ease;
		box-shadow: 0 1px 3px rgba(120, 53, 0, 0.3);
	}
	.recruit-btn:hover:not(:disabled) {
		background: rgb(245, 158, 11);
	}
	.recruit-btn:disabled {
		opacity: 0.5;
	}

</style>
