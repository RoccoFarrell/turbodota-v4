<!--
  Reusable match history list. Shows hero, date, win/loss, and stats relevant to quests.
  Use statKeys to show only the stats that pertain to open quests (e.g. from QUEST_DEFINITIONS).
-->
<script lang="ts">
	import type { StatKey } from '$lib/incremental/quests/quest-definitions';

	export interface MatchHistoryRow {
		matchId: string;
		heroId: number;
		heroName: string;
		startTime: number;
		win: boolean;
		last_hits: number;
		denies: number;
		net_worth: number;
		hero_damage: number;
		tower_damage: number;
		hero_healing: number;
	}

	interface Props {
		/** List of matches (e.g. last 5 games). */
		matches: MatchHistoryRow[];
		/** Stat keys to display (e.g. from open quests). Omit to show all. */
		statKeys?: StatKey[];
		/** Optional class for the container. */
		class?: string;
	}

	let { matches, statKeys, class: className = '' }: Props = $props();

	const STAT_LABELS: Record<StatKey, string> = {
		last_hits: 'Last hits',
		denies: 'Denies',
		net_worth: 'Net worth',
		hero_damage: 'Hero dmg',
		tower_damage: 'Tower dmg',
		hero_healing: 'Healing'
	};

	const ALL_STAT_KEYS: StatKey[] = [
		'last_hits',
		'denies',
		'net_worth',
		'hero_damage',
		'tower_damage',
		'hero_healing'
	];

	const keysToShow = $derived(
		statKeys && statKeys.length > 0 ? statKeys : (ALL_STAT_KEYS as StatKey[])
	);

	function formatStatValue(key: StatKey, value: number): string {
		if (key === 'net_worth' || key === 'hero_damage' || key === 'tower_damage' || key === 'hero_healing') {
			if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
		}
		return value.toLocaleString();
	}

	function formatDate(unixSeconds: number): string {
		const d = new Date(unixSeconds * 1000);
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class={className}>
	<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent matches</h3>

	{#if matches.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">No qualifying matches yet. Play ranked or turbo to see history.</p>
	{:else}
		<ul class="space-y-2">
			{#each matches as match (match.matchId)}
				<li
					class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
				>
					<!-- Hero + meta row -->
					<div class="flex items-center gap-3 min-w-0 shrink-0">
					<!-- Hero icon (Dota 2 minimap sprite) -->
					<div class="shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
						<i class="d2mh hero-{match.heroId} scale-150" aria-hidden="true"></i>
					</div>

					<!-- Hero name + date + win/loss -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium text-gray-900 dark:text-gray-100 truncate">{match.heroName}</span>
							<span
								class="rounded px-1.5 py-0.5 text-xs font-medium {match.win
									? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
									: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}"
							>
								{match.win ? 'Win' : 'Loss'}
							</span>
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
							{formatDate(match.startTime)}
						</div>
					</div>
					</div>

					<!-- Quest-relevant stats: 2-column grid (label + value) so values don't overflow -->
					<div class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs min-w-0 w-full">
						{#each keysToShow as key}
							{@const val = match[key]}
							<div class="min-w-0 flex items-baseline justify-between gap-2">
								<span class="text-gray-500 dark:text-gray-400 shrink-0">{STAT_LABELS[key]}</span>
								<span class="font-medium text-amber-500 tabular-nums text-right">
									{val != null ? formatStatValue(key, val) : '—'}
								</span>
							</div>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
