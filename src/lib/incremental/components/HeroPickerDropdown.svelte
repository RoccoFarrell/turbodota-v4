<script lang="ts">
	import { getAffinityRateModifier, getStatAffinityAttr } from '$lib/incremental/actions/hero-affinity';
	import type { TrainingStatKey } from '$lib/incremental/actions/constants';
	import type { HeroDef } from '$lib/incremental/types';

	interface Props {
		rosterHeroIds: number[];
		getHeroDef: (id: number) => HeroDef | undefined;
		heroName: (id: number) => string;
		trainingValues: Record<number, Record<string, number>>;
		targetStatKey: TrainingStatKey | null;
		value: number | null;
		onSelect: (heroId: number | null) => void;
		busyHeroIds?: Set<number>;
	}

	let {
		rosterHeroIds,
		getHeroDef,
		heroName,
		trainingValues,
		targetStatKey,
		value,
		onSelect,
		busyHeroIds = new Set()
	}: Props = $props();

	let search = $state('');
	let attrFilter = $state<string>('all');

	const ATTR_LABELS: Record<string, string> = {
		all: 'All',
		str: 'STR',
		agi: 'AGI',
		int: 'INT',
		universal: 'UNI'
	};

	const ATTR_COLORS: Record<string, string> = {
		str: 'text-red-500',
		agi: 'text-green-500',
		int: 'text-blue-500',
		universal: 'text-purple-400'
	};

	function normaliseAttr(attr: string): string {
		return attr === 'all_attr' || attr === 'all' ? 'universal' : attr;
	}

	function heroTotal(heroId: number): number {
		const vals = trainingValues[heroId] ?? {};
		return Object.values(vals).reduce((a, b) => a + b, 0);
	}

	function rosterAvgTotal(): number {
		if (rosterHeroIds.length === 0) return 0;
		const sum = rosterHeroIds.reduce((acc, id) => acc + heroTotal(id), 0);
		return sum / rosterHeroIds.length;
	}

	const filteredHeroes = $derived(
		(() => {
			const avgTotal = rosterAvgTotal();
			const threshold = avgTotal * 0.75;
			const lowerSearch = search.toLowerCase();

			return rosterHeroIds
				.filter((id) => {
					if (search && !heroName(id).toLowerCase().includes(lowerSearch)) return false;
					if (attrFilter !== 'all') {
						const def = getHeroDef(id);
						if (!def) return false;
						if (normaliseAttr(def.primaryAttribute) !== attrFilter) return false;
					}
					return true;
				})
				.sort((a, b) => {
					const aNeedsTrain = heroTotal(a) < threshold;
					const bNeedsTrain = heroTotal(b) < threshold;
					if (aNeedsTrain && !bNeedsTrain) return -1;
					if (!aNeedsTrain && bNeedsTrain) return 1;
					const aStat = trainingValues[a]?.[targetStatKey ?? ''] ?? 0;
					const bStat = trainingValues[b]?.[targetStatKey ?? ''] ?? 0;
					return aStat - bStat;
				});
		})()
	);

	const affinityAttr = $derived(targetStatKey ? getStatAffinityAttr(targetStatKey) : null);

	function hasAffinity(heroId: number): boolean {
		if (!targetStatKey) return false;
		const def = getHeroDef(heroId);
		if (!def) return false;
		return getAffinityRateModifier(def.primaryAttribute, targetStatKey) > 1;
	}
</script>

<div class="space-y-2">
	<!-- Search + Attribute filter -->
	<div class="flex flex-wrap gap-2">
		<input
			type="text"
			placeholder="Search hero..."
			bind:value={search}
			class="flex-1 min-w-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
		/>
		<div class="flex gap-1">
			{#each ['all', 'str', 'agi', 'int', 'universal'] as attr}
				<button
					type="button"
					onclick={() => (attrFilter = attr)}
					class="rounded px-2 py-1 text-xs font-semibold transition-colors {attrFilter === attr
						? 'bg-primary text-primary-foreground'
						: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
				>
					{ATTR_LABELS[attr]}
				</button>
			{/each}
		</div>
	</div>

	{#if affinityAttr}
		<p class="text-xs text-amber-600 dark:text-amber-400">
			<span class="gi w-3.5 h-3.5 text-amber-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/lorc/power-lightning.svg)"></span> {ATTR_LABELS[affinityAttr] ?? affinityAttr.toUpperCase()} heroes train this stat +25% faster
		</p>
	{/if}

	<!-- Hero list -->
	<div class="max-h-72 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
		<button
			type="button"
			onclick={() => onSelect(null)}
			class="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 italic {value === null
				? 'bg-primary/10'
				: ''}"
		>
			— None —
		</button>
		{#each filteredHeroes as heroId}
			{@const def = getHeroDef(heroId)}
			{@const busy = busyHeroIds.has(heroId)}
			{@const affinity = hasAffinity(heroId)}
			{@const statVal = trainingValues[heroId]?.[targetStatKey ?? ''] ?? 0}
			{@const attr = def ? normaliseAttr(def.primaryAttribute) : ''}
			<button
				type="button"
				onclick={() => !busy && onSelect(heroId)}
				disabled={busy}
				class="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors
					{value === heroId ? 'bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
					{busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
			>
				<span class="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">
					{heroName(heroId)}
				</span>
				{#if affinity}
					<span class="gi w-3 h-3 text-amber-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/lorc/power-lightning.svg)" title="Affinity: trains this stat 25% faster"></span>
				{/if}
				{#if attr}
					<span
						class="text-xs font-bold {ATTR_COLORS[attr] ?? 'text-gray-400'}"
						title={attr}
					>
						{ATTR_LABELS[attr] ?? attr.toUpperCase()}
					</span>
				{/if}
				{#if targetStatKey}
					<span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">
						+{statVal.toFixed(0)}
					</span>
				{/if}
				{#if busy}
					<span class="text-xs text-gray-400 shrink-0">In use</span>
				{/if}
			</button>
		{/each}
		{#if filteredHeroes.length === 0}
			<div class="px-3 py-4 text-sm text-gray-400 text-center italic">No heroes match</div>
		{/if}
	</div>
</div>
