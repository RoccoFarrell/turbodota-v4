<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { dev } from '$app/environment';
	import { toaster } from '$lib/toaster';
	import {
		formatStat,
		CONVERT_WIN_ESSENCE_COST,
		ACTION_TYPE_TRAINING,
		TRAINING_BUILDINGS,
		TRAINING_STAT_KEYS,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import HeroCard from '$lib/incremental/components/HeroCard.svelte';

	/** Hero list from root layout (OpenDota names for any hero id) */
	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	/** DB-backed heroes (from GET /api/incremental/heroes?saveId=...) with effective stats */
	let heroesFromApi = $state<{ heroes: HeroDef[]; heroNames: Array<{ heroId: number; localizedName: string }>; abilityDefs: Record<string, AbilityDef> }>({
		heroes: [],
		heroNames: [],
		abilityDefs: {}
	});

	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));

	function heroName(heroId: number, fallback: string): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? fallback;
	}

	function statLabel(statKey: TrainingStatKey): string {
		return TRAINING_BUILDINGS[statKey]?.name ?? statKey;
	}

	function getHeroDef(hid: number): HeroDef | undefined {
		return heroById.get(hid);
	}

	function getAbilityDef(aid: string): AbilityDef | undefined {
		return heroesFromApi.abilityDefs[aid];
	}

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null; essence: number; createdAt: string }>>([]);
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
	let trainingHeroId = $state<string>('');
	let trainingStatKey = $state<string>('');
	let sendingToTrain = $state(false);
	// Debug: recruit any hero
	let debugRecruitHeroId = $state<string>('');
	let debugRecruiting = $state(false);

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
				map[t.heroId][t.statKey] = t.value;
			}
			trainingValues = map;
		}
	}

	/** Fetch hero definitions from DB (base stats only; roster display adds training from fetchTraining). */
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

	async function fetchEligibleWins() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/roster/eligible-wins${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			recentMatches = data.recentMatches ?? [];
			eligibleWins = data.eligibleWins ?? [];
		}
	}

	function matchFaded(m: RecentMatch): boolean {
		return !m.win || m.alreadyRecruited || m.isDuplicateHero;
	}

	function matchReason(m: RecentMatch): string {
		if (!m.win) return 'Loss';
		if (m.alreadyRecruited) return 'Already recruited';
		if (m.isDuplicateHero) return 'Hero already on roster';
		return '';
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
			toaster.success({ title: 'Hero recruited', description: 'They have joined your roster.' });
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
			toaster.success({ title: 'Hero recruited (debug)', description: 'They have joined your roster.' });
			debugRecruitHeroId = '';
			await fetchRoster();
			await fetchEligibleWins();
		} finally {
			debugRecruiting = false;
		}
	}

	async function sendToTrain() {
		const heroId = trainingHeroId ? parseInt(trainingHeroId, 10) : null;
		const statKey = trainingStatKey && (TRAINING_STAT_KEYS as readonly string[]).includes(trainingStatKey) ? trainingStatKey as TrainingStatKey : null;
		if (heroId == null || statKey == null || !saveId) return;
		sendingToTrain = true;
		try {
			const res = await fetch('/api/incremental/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					saveId,
					lastTickAt: Date.now(),
					progress: 0,
					actionType: ACTION_TYPE_TRAINING,
					actionHeroId: heroId,
					actionStatKey: statKey
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({
					title: 'Start training failed',
					description: data.message ?? data.error ?? res.statusText
				});
				return;
			}
			toaster.success({
				title: 'Training started',
				description: `${heroName(heroId, '')} is now training ${statLabel(statKey)}. Use the main Incremental page to watch progress.`
			});
			trainingHeroId = '';
			trainingStatKey = '';
		} finally {
			sendingToTrain = false;
		}
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

<div class="max-w-2xl lg:max-w-6xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Hero Tavern</h1>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label for="tavern-save" class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				id="tavern-save"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={() => { fetchBank(); fetchHeroes(); fetchEligibleWins(); fetchRoster(); fetchTraining(); }}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<!-- Recruit a Hero + Your roster: side-by-side on wide screens -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
		<!-- 1) Recruit a Hero -->
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 min-w-0">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Recruit a Hero
		</h2>
		<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
			Spend <strong>{CONVERT_WIN_ESSENCE_COST} Essence</strong> to add a won hero to your roster for lineups and training.
		</p>
		<div class="mt-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
			<strong class="text-primary">Win on heroes you want to recruit.</strong>
			Win a game with a hero in <strong>Ranked or Turbo</strong> to see them here; losses and already-recruited games are shown faded below.
		</div>
		{#if recentMatches.length === 0}
			<p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
				No recent games found. Play Ranked or Turbo and they’ll appear here.
			</p>
		{:else}
			<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">Last 10 games (most recent first)</p>
			<ul class="mt-1.5 space-y-1.5">
				{#each recentMatches as m}
					<li
						class="flex items-center justify-between gap-2 rounded border border-gray-200 dark:border-gray-600 p-2 transition-opacity {matchFaded(m)
							? 'opacity-50'
							: ''}"
					>
						<div class="flex items-center gap-2 min-w-0 flex-1">
							<i
								class="d2mh hero-{m.heroId} shrink-0 scale-110"
								title={heroName(m.heroId, m.heroName)}
							></i>
							<div class="min-w-0">
								<span class="font-medium text-gray-900 dark:text-gray-100 text-sm block truncate">
									{heroName(m.heroId, m.heroName)}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
									<span>{m.gameModeLabel}</span>
									<span>·</span>
									<time datetime={new Date(m.startTime * 1000).toISOString()}>
										{new Date(m.startTime * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
									</time>
									{#if matchFaded(m)}
										<span class="text-gray-400 dark:text-gray-500">· {matchReason(m)}</span>
									{/if}
								</span>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							{#if m.eligible}
								<a
									href="https://dotabuff.com/matches/{m.matchId}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs text-primary hover:underline hidden sm:inline"
								>
									Dotabuff
								</a>
								<button
									class="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
									disabled={essence < CONVERT_WIN_ESSENCE_COST || convertingMatchId === m.matchId}
									onclick={() => recruitHero(m.matchId)}
								>
									{convertingMatchId === m.matchId ? '…' : `Recruit (${CONVERT_WIN_ESSENCE_COST})`}
								</button>
							{:else}
								<span class="text-xs text-gray-400 dark:text-gray-500">{matchReason(m)}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		{#if dev}
			<div class="mt-4 rounded border border-amber-500/50 bg-amber-500/10 p-3">
				<p class="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Debug: Recruit any hero</p>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Add any hero to your roster without a match (no essence cost).</p>
				<div class="mt-2 flex flex-wrap items-end gap-2">
					<div class="min-w-48">
						<label for="debug-recruit-hero" class="sr-only">Hero</label>
						<select
							id="debug-recruit-hero"
							class="block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
							bind:value={debugRecruitHeroId}
						>
							<option value="">— Select hero —</option>
							{#each layoutHeroes as h}
								<option value={h.id} disabled={rosterHeroIds.includes(h.id)}>
									{h.localized_name}{rosterHeroIds.includes(h.id) ? ' (on roster)' : ''}
								</option>
							{/each}
						</select>
					</div>
					<button
						class="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
						disabled={!debugRecruitHeroId || debugRecruiting}
						onclick={recruitHeroDebug}
					>
						{debugRecruiting ? '…' : 'Recruit (debug)'}
					</button>
				</div>
			</div>
		{/if}
		</section>

		<!-- 2) Your roster -->
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 min-w-0">
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
				Your roster
			</h2>
			{#if rosterHeroIds.length === 0}
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Recruit heroes from recent wins to see their details and train them.
				</p>
			{:else}
				<div class="space-y-4">
					{#each rosterHeroIds as hid}
						{@const def = getHeroDef(hid)}
						{@const trained = trainingValues[hid] ?? {}}
						<HeroCard
							heroId={hid}
							displayName={heroName(hid, '')}
							def={def ?? null}
							training={trained}
							abilities={def?.abilityIds?.map((id) => getAbilityDef(id) ?? null) ?? []}
							variant="short"
							iconScale="scale-150"
						/>
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<!-- 3) Training assignment + building/skill tree requirements -->
	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
			Send hero to train
		</h2>
		<p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
			Choose a hero and a stat. Training runs on the main Incremental page (one action at a time).
		</p>
		{#if rosterHeroIds.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">Recruit at least one hero to assign training.</p>
		{:else}
			<div class="space-y-3">
				<div class="flex flex-wrap gap-3 items-end">
					<div>
						<label for="train-hero" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hero</label>
						<select
							id="train-hero"
							class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
							bind:value={trainingHeroId}
						>
							<option value="">— Select —</option>
							{#each rosterHeroIds as hid}
								<option value={hid}>{heroName(hid, '')}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="train-stat" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Stat</label>
						<select
							id="train-stat"
							class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
							bind:value={trainingStatKey}
						>
							<option value="">— Select —</option>
							{#each TRAINING_STAT_KEYS as sk}
								<option value={sk}>{statLabel(sk)}</option>
							{/each}
						</select>
					</div>
					<button
						class="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
						disabled={!trainingHeroId || !trainingStatKey || sendingToTrain}
						onclick={sendToTrain}
					>
						{sendingToTrain ? 'Starting...' : 'Start training'}
					</button>
				</div>
				{#if trainingStatKey && (TRAINING_STAT_KEYS as readonly string[]).includes(trainingStatKey)}
					{@const building = TRAINING_BUILDINGS[trainingStatKey as TrainingStatKey]}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						<strong>{building.name}</strong> — {building.description}. This building is required to train {building.name.toLowerCase()} (no talent unlock required).
					</p>
				{/if}
			</div>
		{/if}
	</section>
</div>
