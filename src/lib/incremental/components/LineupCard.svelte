<!--
  Lineup display: same roster design in two contexts.
  - Lineups page: action bar, aggregate DPS strip, per-hero DPS rows, DPS bar.
  - Run map page: hero list with drag-to-reorder and heal (battle order).
-->
<script lang="ts">
	import { getHeroDef as getHeroDefStub, getAbilityDef as getAbilityDefStub } from '$lib/incremental/constants';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { toaster } from '$lib/toaster';
	import { TRAINING_BUILDINGS, formatStat } from '$lib/incremental/actions/constants';
	import type { TrainingStatKey } from '$lib/incremental/actions/constants';
	import { computeLineupStats, type HeroCombatStats } from '$lib/incremental/stats/lineup-stats';

	// Spell icon grid (9×6) for small spell badges – same hash as HeroCard
	const SPELL_ICONS: [number, number][] = [
		[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0],
		[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1],
		[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2],
		[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
		[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
		[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5]
	];
	const NUM_SPELL_ICONS = SPELL_ICONS.length;
	function spellIconStyle(abilityId: string): string {
		let h = 0;
		for (let i = 0; i < abilityId.length; i++) h = (h * 31 + abilityId.charCodeAt(i)) >>> 0;
		const [x, y] = SPELL_ICONS[h % NUM_SPELL_ICONS];
		return `--spell-x: ${x}; --spell-y: ${y};`;
	}
	function abilityDisplayName(ability: AbilityDef | undefined): string {
		if (!ability) return '';
		return ability.abilityName ?? ability.effect?.replace(/_/g, ' ') ?? ability.id.replace(/_/g, ' ');
	}

	const ATTR_COLORS: Record<string, string> = {
		str: 'bg-red-500/20 text-red-400',
		agi: 'bg-green-500/20 text-green-400',
		int: 'bg-blue-500/20 text-blue-400',
		universal: 'bg-purple-500/20 text-purple-400'
	};

	export type ActiveRunSummary = {
		runId: string;
		status: string;
		currentNodeId: string;
		startedAt: number;
	};

	interface Props {
		name: string;
		lineupId: string;
		heroIds: number[];
		getHeroName: (heroId: number) => string;
		variant: 'lineups' | 'run';
		showActions?: boolean;
		// --- lineups only ---
		activeRun?: ActiveRunSummary | null;
		onDelete?: () => void;
		onStartRun?: () => void;
		onCancelRun?: (runId: string) => void;
		startingRunId?: string | null;
		cancellingRunId?: string | null;
		deletingLineupId?: string | null;
		onConfirmDelete?: (lineupName: string) => boolean;
		// --- run only ---
		runId?: string;
		heroHp?: number[] | null;
		onUpdate?: (newHeroIds?: number[]) => void;
		// --- both variants ---
		getHeroDef?: (heroId: number) => HeroDef | undefined;
		getAbilityDef?: (abilityId: string) => AbilityDef | undefined;
		trainingByHero?: Record<number, Record<string, number>>;
		/** Full ability definitions map for DPS computation */
		abilityDefs?: Record<string, AbilityDef>;
	}

	let {
		name,
		lineupId,
		heroIds,
		getHeroName,
		variant,
		showActions = false,
		activeRun = null,
		onDelete,
		onStartRun,
		onCancelRun,
		startingRunId = null,
		cancellingRunId = null,
		deletingLineupId = null,
		onConfirmDelete,
		runId = '',
		heroHp = null,
		onUpdate,
		getHeroDef: getHeroDefProp,
		getAbilityDef: getAbilityDefProp,
		trainingByHero = {},
		abilityDefs = {}
	}: Props = $props();

	const getHeroDef = getHeroDefProp ?? getHeroDefStub;
	const getAbilityDef = getAbilityDefProp ?? getAbilityDefStub;

	const isRunMode = variant === 'run';
	const canReorder = variant === 'run' || variant === 'lineups';

	// --- Computed lineup stats ---
	const lineupStats = $derived(
		computeLineupStats(heroIds, getHeroDef, abilityDefs, trainingByHero)
	);

	function heroStatsFor(heroId: number): HeroCombatStats | undefined {
		return lineupStats.heroStats.find((h) => h.heroId === heroId);
	}

	// DPS bar proportions
	const autoPercent = $derived(
		lineupStats.totalDps > 0
			? (lineupStats.totalAutoDps / lineupStats.totalDps) * 100
			: 0
	);

	// Reorder + heal state
	let draggingIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);
	let reordering = $state(false);
	let healingIndex = $state<number | null>(null);
	let hoveredHeroIndex = $state<number | null>(null);

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	function statWithTraining(
		heroId: number,
		value: number | undefined,
		trainedKey: string | undefined,
		format: (v: number) => string = formatStat
	): string {
		if (value == null) return '—';
		const base = format(value);
		const tr = trainedKey != null ? trainingByHero?.[heroId]?.[trainedKey] : undefined;
		if (tr != null) return `${base} (+${format(tr)} from training)`;
		return base;
	}

	function currentHp(index: number): number {
		const def = getHeroDef(heroIds[index]);
		const max = def?.baseMaxHp ?? 100;
		if (heroHp == null) return max;
		const v = heroHp[index];
		return typeof v === 'number' && v >= 0 ? Math.min(v, max) : max;
	}

	function maxHp(index: number): number {
		return getHeroDef(heroIds[index])?.baseMaxHp ?? 100;
	}

	function hpPercent(index: number): number {
		const cur = currentHp(index);
		const max = maxHp(index);
		return max > 0 ? (cur / max) * 100 : 100;
	}

	function fmtDps(v: number): string {
		return v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1);
	}

	function fmtHp(v: number): string {
		return v.toLocaleString();
	}

	async function handleReorder(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;
		reordering = true;
		try {
			const next = [...heroIds];
			const [removed] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, removed);
			const res = await fetch(`/api/incremental/lineups/${lineupId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ heroIds: next })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: 'Reorder failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Order updated' });
			onUpdate?.(next);
		} catch (e) {
			toaster.error({ title: 'Reorder failed', description: e instanceof Error ? e.message : 'Unknown error' });
		} finally {
			reordering = false;
		}
	}

	async function handleHeal(index: number) {
		healingIndex = index;
		try {
			const max = maxHp(index);
			const current = heroHp ?? heroIds.map((_, i) => maxHp(i));
			const next = [...current];
			next[index] = max;
			const res = await fetch(`/api/incremental/runs/${runId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ heroHp: next })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: 'Heal failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Healed to full' });
			onUpdate?.();
		} catch (e) {
			toaster.error({ title: 'Heal failed', description: e instanceof Error ? e.message : 'Unknown error' });
		} finally {
			healingIndex = null;
		}
	}

	function onDragStart(e: DragEvent, index: number) {
		draggingIndex = index;
		e.dataTransfer?.setData('text/plain', String(index));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggingIndex === null) return;
		dropTargetIndex = index;
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function onDragLeave() {
		dropTargetIndex = null;
	}

	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		dropTargetIndex = null;
		const fromIndex = draggingIndex;
		draggingIndex = null;
		if (fromIndex == null || fromIndex === toIndex) return;
		handleReorder(fromIndex, toIndex);
	}

	function onDragEnd() {
		draggingIndex = null;
		dropTargetIndex = null;
	}

	function handleDeleteClick() {
		if (onConfirmDelete ? !onConfirmDelete(name) : !confirm(`Delete lineup "${name}"? This cannot be undone.`)) return;
		onDelete?.();
	}
</script>

{#if isRunMode}
	<!-- ===== RUN VARIANT (unchanged) ===== -->
	<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
		<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Roster (battle order)</h3>
		<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Drag to reorder; order matters in battle.</p>
		<ul class="space-y-1.5" role="list">
			{#each heroIds as heroId, index}
				{@const def = getHeroDef(heroId)}
				<li
					draggable={!reordering}
					class="relative flex items-center gap-2 rounded-lg border p-2 transition-colors
						{dropTargetIndex === index ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-600'}
						{draggingIndex === index ? 'opacity-60' : ''}"
					ondragstart={(e) => onDragStart(e, index)}
					ondragover={(e) => onDragOver(e, index)}
					ondragleave={onDragLeave}
					ondrop={(e) => onDrop(e, index)}
					ondragend={onDragEnd}
				>
					<span class="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 shrink-0 touch-none" aria-label="Drag to reorder">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
						</svg>
					</span>
					<span class="d2mh hero-{heroId} shrink-0 w-8 h-8 rounded bg-gray-700" aria-hidden="true"></span>
					<span class="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{getHeroName(heroId)}</span>
					<div class="flex-1 min-w-0 flex items-center gap-2">
						<div class="flex-1 min-w-0 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
							<div
								class="h-full rounded-full transition-all {hpPercent(index) >= 100 ? 'bg-green-500' : 'bg-amber-500'}"
								style="width: {hpPercent(index)}%"
							></div>
						</div>
						<span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">{currentHp(index)}/{maxHp(index)}</span>
					</div>
					<button
						type="button"
						class="shrink-0 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
						disabled={healingIndex !== null || currentHp(index) >= maxHp(index)}
						onclick={() => handleHeal(index)}
					>
						{healingIndex === index ? '…' : 'Heal'}
					</button>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<!-- ===== LINEUPS VARIANT — Dark Gaming HUD ===== -->
	<div class="rounded-xl border border-gray-700/80 bg-gray-900/90 shadow-lg overflow-hidden
		{activeRun ? 'border-t-2 border-t-amber-500' : ''}">

		<!-- Header -->
		<div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-700/60">
			<div class="flex items-center gap-2 min-w-0">
				<h3 class="text-sm font-bold text-gray-100 truncate">{name}</h3>
				{#if activeRun}
					<span class="relative flex h-2 w-2 shrink-0">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
					</span>
					<span class="text-[11px] font-medium text-amber-400">Active run</span>
				{/if}
			</div>
			{#if showActions}
				<div class="flex flex-wrap items-center gap-1.5">
					{#if activeRun}
						{@const ar = activeRun}
						<a
							href="/incremental/run/{ar.runId}"
							class="rounded-md border border-gray-600 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
						>
							View run
						</a>
						<a
							href="/incremental/lineup/{lineupId}"
							class="rounded-md border border-gray-600 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
						>
							Edit
						</a>
						{#if onCancelRun}
							<button
								type="button"
								class="rounded-md bg-amber-600/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
								disabled={cancellingRunId === ar.runId}
								onclick={() => onCancelRun(ar.runId)}
							>
								{cancellingRunId === ar.runId ? 'Cancelling…' : 'Cancel run'}
							</button>
						{/if}
					{:else}
						<a
							href="/incremental/lineup/{lineupId}"
							class="rounded-md border border-gray-600 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
						>
							Edit
						</a>
						{#if onStartRun}
							<button
								type="button"
								class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
								disabled={startingRunId !== null}
								onclick={onStartRun}
							>
								{startingRunId === lineupId ? 'Starting…' : 'Start run'}
							</button>
						{/if}
						{#if onDelete}
							<button
								type="button"
								class="rounded-md border border-red-800/60 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 transition-colors"
								disabled={deletingLineupId !== null}
								onclick={handleDeleteClick}
							>
								{deletingLineupId === lineupId ? 'Deleting…' : 'Delete'}
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Aggregate Stats Strip -->
		{#if lineupStats.heroStats.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-700/40">
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-amber-400 text-[11px] font-semibold uppercase tracking-wide">Auto</span>
					<span class="text-sm font-bold text-amber-300">{fmtDps(lineupStats.totalAutoDps)}</span>
				</div>
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-blue-400 text-[11px] font-semibold uppercase tracking-wide">Spell</span>
					<span class="text-sm font-bold text-blue-300">{fmtDps(lineupStats.totalSpellDps)}</span>
				</div>
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-white/60 text-[11px] font-semibold uppercase tracking-wide">Total</span>
					<span class="text-sm font-bold text-white">{fmtDps(lineupStats.totalDps)} DPS</span>
				</div>
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-green-400 text-[11px] font-semibold uppercase tracking-wide">HP</span>
					<span class="text-sm font-bold text-green-300">{fmtHp(lineupStats.totalHp)}</span>
				</div>
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-gray-400 text-[11px] font-semibold uppercase tracking-wide">Armor</span>
					<span class="text-sm font-bold text-gray-300">{lineupStats.avgArmor.toFixed(1)}</span>
				</div>
				<div class="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80">
					<span class="text-cyan-400 text-[11px] font-semibold uppercase tracking-wide">MR</span>
					<span class="text-sm font-bold text-cyan-300">{Math.round(lineupStats.avgMagicResist * 100)}%</span>
				</div>
			</div>
		{/if}

		<!-- Hero Rows -->
		<ul class="divide-y divide-gray-800/80" role="list">
			{#each heroIds as heroId, index}
				{@const def = getHeroDef(heroId)}
				{@const hs = heroStatsFor(heroId)}
				<li
					draggable={canReorder && !reordering}
					class="relative group/row transition-colors
						{canReorder && dropTargetIndex === index ? 'bg-primary/10' : 'hover:bg-gray-800/60'}
						{canReorder && draggingIndex === index ? 'opacity-50' : ''}"
					ondragstart={canReorder ? (e) => onDragStart(e, index) : undefined}
					ondragover={canReorder ? (e) => onDragOver(e, index) : undefined}
					ondragleave={canReorder ? onDragLeave : undefined}
					ondrop={canReorder ? (e) => onDrop(e, index) : undefined}
					ondragend={canReorder ? onDragEnd : undefined}
				>
					<div
						class="flex items-center gap-2.5 px-3 py-2"
						onmouseenter={() => (hoveredHeroIndex = index)}
						onmouseleave={() => (hoveredHeroIndex = null)}
					>
						<!-- Drag handle + position -->
						{#if canReorder}
							<span class="cursor-grab active:cursor-grabbing text-gray-600 shrink-0 touch-none select-none" aria-label="Drag to reorder">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
								</svg>
							</span>
						{/if}
						<span class="text-[11px] font-mono text-gray-500 w-3 text-center shrink-0">{index + 1}</span>

						<!-- Hero icon -->
						<span class="d2mh hero-{heroId} shrink-0 w-8 h-8 rounded bg-gray-700" aria-hidden="true"></span>

						<!-- Name + attribute + spells -->
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="truncate text-sm font-medium text-gray-100">{getHeroName(heroId)}</span>
								{#if def}
									<span class="text-[9px] font-bold uppercase px-1 py-0.5 rounded {ATTR_COLORS[def.primaryAttribute] ?? 'bg-gray-600 text-gray-300'}">
										{def.primaryAttribute}
									</span>
								{/if}
							</div>
							{#if def && (def.abilityIds?.length ?? 0) > 0}
								<div class="flex items-center gap-1 mt-0.5">
									{#each def.abilityIds as abilityId}
										{@const ability = getAbilityDef(abilityId)}
										<span
											class="spell-icon spell-icon--sm shrink-0"
											style={spellIconStyle(abilityId)}
											title={abilityDisplayName(ability)}
											aria-label={abilityDisplayName(ability) || abilityId}
										></span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Per-hero DPS stats (right-aligned) -->
						{#if hs}
							<div class="hidden sm:flex items-center gap-3 shrink-0 text-xs tabular-nums">
								<span class="text-amber-400" title="Auto DPS">{fmtDps(hs.autoDps)}</span>
								<span class="text-blue-400" title="Spell DPS">{fmtDps(hs.spellDps)}</span>
								<span class="text-green-400 w-12 text-right" title="Max HP">{fmtHp(hs.maxHp)}</span>
							</div>
						{/if}

						<!-- Hover popover -->
						{#if hoveredHeroIndex === index}
							<div
								class="absolute left-full top-0 z-50 ml-2 w-[min(340px,90vw)] rounded-xl border border-gray-600 bg-gray-900 shadow-xl p-4"
								role="tooltip"
							>
								<div class="flex items-center gap-2 border-b border-gray-700 pb-2 mb-3">
									<span class="d2mh hero-{heroId} shrink-0 w-10 h-10 rounded bg-gray-700" aria-hidden="true"></span>
									<div>
										<p class="font-semibold text-gray-100">{getHeroName(heroId)}</p>
										{#if def}
											<span class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded {ATTR_COLORS[def.primaryAttribute] ?? 'bg-gray-600 text-gray-300'}">
												{def.primaryAttribute}
											</span>
										{/if}
									</div>
								</div>
								{#if def}
									<!-- DPS breakdown -->
									{#if hs}
										<p class="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 tracking-wider">DPS Breakdown</p>
										<div class="grid grid-cols-3 gap-2 mb-3">
											<div class="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-center">
												<p class="text-[10px] text-amber-400/80 uppercase">Auto</p>
												<p class="text-sm font-bold text-amber-300">{fmtDps(hs.autoDps)}</p>
											</div>
											<div class="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 text-center">
												<p class="text-[10px] text-blue-400/80 uppercase">Spell</p>
												<p class="text-sm font-bold text-blue-300">{fmtDps(hs.spellDps)}</p>
											</div>
											<div class="rounded bg-white/5 border border-white/10 px-2 py-1.5 text-center">
												<p class="text-[10px] text-gray-400 uppercase">Total</p>
												<p class="text-sm font-bold text-white">{fmtDps(hs.totalDps)}</p>
											</div>
										</div>
									{/if}

									<p class="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 tracking-wider">Stats</p>
									<dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm mb-4">
										<span class="text-gray-500">Max HP</span>
										<span class="text-gray-100">{statWithTraining(heroId, def.baseMaxHp, 'hp', (v) => String(Math.round(v)))}</span>
										<span class="text-gray-500">Attack damage</span>
										<span class="text-gray-100">{statWithTraining(heroId, def.baseAttackDamage, 'attack_damage')}</span>
										<span class="text-gray-500">Armor</span>
										<span class="text-gray-100">{statWithTraining(heroId, def.baseArmor, 'armor')}</span>
										<span class="text-gray-500">Magic resist</span>
										<span class="text-gray-100">{statWithTraining(heroId, def.baseMagicResist, 'magic_resist', (v) => (v * 100).toFixed(1) + '%')}</span>
										<span class="text-gray-500">Attack interval</span>
										<span class="text-gray-100">{def.baseAttackInterval}s{#if trainingByHero[heroId]?.attack_speed != null} <span class="text-amber-400">+{formatStat(trainingByHero[heroId].attack_speed)} speed</span>{/if}</span>
										{#if def.baseSpellInterval != null}
											<span class="text-gray-500">Spell interval</span>
											<span class="text-gray-100">{def.baseSpellInterval}s{#if trainingByHero[heroId]?.spell_haste != null} <span class="text-blue-400">+{formatStat(trainingByHero[heroId].spell_haste)} haste</span>{/if}</span>
										{/if}
									</dl>
									{#if (def.abilityIds?.length ?? 0) > 0}
										<p class="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 tracking-wider">Abilities</p>
										<div class="space-y-2">
											{#each def.abilityIds as abilityId}
												{@const ability = getAbilityDef(abilityId)}
												<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-2.5">
													<p class="text-sm font-semibold text-gray-100">{abilityDisplayName(ability)}</p>
													{#if ability?.description}
														<p class="text-xs text-gray-400 mt-1">{ability.description}</p>
													{/if}
													<dl class="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 text-xs text-gray-400">
														{#if ability}
															<span><strong class="text-gray-500">Type</strong> {ability.type}</span>
															<span><strong class="text-gray-500">Trigger</strong> {ability.trigger}</span>
															{#if ability.effect != null}<span><strong class="text-gray-500">Effect</strong> {ability.effect}</span>{/if}
															{#if ability.target != null}<span><strong class="text-gray-500">Target</strong> {ability.target}</span>{/if}
															{#if ability.damageType != null}<span><strong class="text-gray-500">Dmg type</strong> {ability.damageType}</span>{/if}
															{#if ability.baseDamage != null}<span><strong class="text-gray-500">Base dmg</strong> {ability.baseDamage}</span>{/if}
															{#if ability.returnDamageRatio != null}<span><strong class="text-gray-500">Return</strong> {ability.returnDamageRatio}</span>{/if}
															{#if ability.statusEffectOnHit != null}<span class="col-span-2"><strong class="text-gray-500">On hit</strong> {ability.statusEffectOnHit.statusEffectId} {ability.statusEffectOnHit.duration}s</span>{/if}
														{:else}
															<span class="col-span-2 text-gray-500">—</span>
														{/if}
													</dl>
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-xs text-gray-500 italic">No abilities.</p>
									{/if}
								{:else}
									<p class="text-sm text-gray-400">Stats not loaded.</p>
								{/if}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<!-- DPS Bar -->
		{#if lineupStats.totalDps > 0}
			<div class="px-3 py-2 border-t border-gray-700/60 flex items-center gap-3">
				<div class="flex-1 h-2.5 rounded-full bg-gray-800 overflow-hidden flex">
					{#if autoPercent > 0}
						<div
							class="h-full bg-amber-500/80 transition-all"
							style="width: {autoPercent}%"
							title="Auto DPS: {fmtDps(lineupStats.totalAutoDps)}"
						></div>
					{/if}
					{#if autoPercent < 100}
						<div
							class="h-full bg-blue-500/80 transition-all"
							style="width: {100 - autoPercent}%"
							title="Spell DPS: {fmtDps(lineupStats.totalSpellDps)}"
						></div>
					{/if}
				</div>
				<span class="text-xs font-bold text-gray-300 shrink-0 tabular-nums">{fmtDps(lineupStats.totalDps)} DPS</span>
			</div>
		{/if}
	</div>
{/if}
