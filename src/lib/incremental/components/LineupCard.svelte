<!--
  Lineup display: same roster design in two contexts.
  - Lineups page: optional action bar; hero list with optional stat badges and equipped spells.
  - Run map page: hero list with drag-to-reorder and heal (battle order).
-->
<script lang="ts">
	import { getHeroDef as getHeroDefStub, getAbilityDef as getAbilityDefStub } from '$lib/incremental/constants';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { toaster } from '$lib/toaster';
	import { TRAINING_BUILDINGS, formatStat } from '$lib/incremental/actions/constants';
	import type { TrainingStatKey } from '$lib/incremental/actions/constants';

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

	export type ActiveRunSummary = {
		runId: string;
		status: string;
		currentNodeId: string;
		startedAt: number;
	};

	interface Props {
		/** Lineup name (e.g. for heading when showActions) */
		name: string;
		lineupId: string;
		heroIds: number[];
		getHeroName: (heroId: number) => string;
		/** 'lineups' = list page (optional actions, no reorder/heal). 'run' = map page (reorder + heal). */
		variant: 'lineups' | 'run';
		/** Only on lineups page: show Edit, Delete, Start/Cancel run at top */
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
		// --- run only (heal); lineups uses this for reorder with newHeroIds to avoid refetch) ---
		runId?: string;
		heroHp?: number[] | null;
		/** After reorder: called with new heroIds so parent can update local state (no refetch). After heal (run): called with no args. */
		onUpdate?: (newHeroIds?: number[]) => void;
		/** When provided, use DB-backed defs (from /api/incremental/heroes). Omit to use stub (no stats/abilities). */
		getHeroDef?: (heroId: number) => HeroDef | undefined;
		getAbilityDef?: (abilityId: string) => AbilityDef | undefined;
		/** When provided, show "Base X (+Y)" for stats modified by training (keyed by heroId). */
		trainingByHero?: Record<number, Record<string, number>>;
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
		trainingByHero = {}
	}: Props = $props();

	const getHeroDef = getHeroDefProp ?? getHeroDefStub;
	const getAbilityDef = getAbilityDefProp ?? getAbilityDefStub;

	const isRunMode = variant === 'run';
	/** Reorder is available on both lineups page and run map page */
	const canReorder = variant === 'run' || variant === 'lineups';

	// Reorder + (run-only) heal state
	let draggingIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);
	let reordering = $state(false);
	let healingIndex = $state<number | null>(null);
	/** Index of hero row being hovered (for detail popover). */
	let hoveredHeroIndex = $state<number | null>(null);

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	/** Format stat value with optional "+ X" training suffix for a given hero. */
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
			const len = heroIds.length;
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

<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
	{#if showActions}
		<!-- Action bar: only on lineups page -->
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-600 pb-3">
			<h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</h3>
			<div class="flex flex-wrap gap-2">
				{#if activeRun}
					{@const ar = activeRun}
					<span class="text-xs font-medium text-amber-600 dark:text-amber-400">Run in progress</span>
					<span class="text-xs text-gray-500 dark:text-gray-400">
						Started {new Date(ar.startedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
					</span>
					<a
						href="/incremental/lineup/{lineupId}"
						class="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Edit
					</a>
					<a
						href="/incremental/run/{ar.runId}"
						class="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						View run
					</a>
					{#if onCancelRun}
						<button
							type="button"
							class="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
							disabled={cancellingRunId === ar.runId}
							onclick={() => onCancelRun(ar.runId)}
						>
							{cancellingRunId === ar.runId ? 'Cancelling…' : 'Cancel run'}
						</button>
					{/if}
				{:else}
					<a
						href="/incremental/lineup/{lineupId}"
						class="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Edit
					</a>
					{#if onStartRun}
						<button
							type="button"
							class="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
							disabled={startingRunId !== null}
							onclick={onStartRun}
						>
							{startingRunId === lineupId ? 'Starting…' : 'Start run'}
						</button>
					{/if}
					{#if onDelete}
						<button
							type="button"
							class="rounded border border-red-300 dark:border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
							disabled={deletingLineupId !== null}
							onclick={handleDeleteClick}
						>
							{deletingLineupId === lineupId ? 'Deleting…' : 'Delete'}
						</button>
					{/if}
				{/if}
			</div>
		</div>
	{:else if isRunMode}
		<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Roster (battle order)</h3>
		<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Drag to reorder; order matters in battle.</p>
	{:else if canReorder}
		<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Drag to reorder.</p>
	{/if}

	<ul class="space-y-1.5" role="list">
		{#each heroIds as heroId, index}
			{@const def = getHeroDef(heroId)}
			<li
				draggable={canReorder && !reordering}
				class="relative flex items-center gap-2 rounded-lg border p-2 transition-colors
					{canReorder && dropTargetIndex === index ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-600'}
					{canReorder && draggingIndex === index ? 'opacity-60' : ''}"
				ondragstart={canReorder ? (e) => onDragStart(e, index) : undefined}
				ondragover={canReorder ? (e) => onDragOver(e, index) : undefined}
				ondragleave={canReorder ? onDragLeave : undefined}
				ondrop={canReorder ? (e) => onDrop(e, index) : undefined}
				ondragend={canReorder ? onDragEnd : undefined}
			>
				<div
					class="contents group/row"
					onmouseenter={() => (hoveredHeroIndex = index)}
					onmouseleave={() => (hoveredHeroIndex = null)}
				>
				{#if canReorder}
					<span
						class="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 shrink-0 touch-none"
						aria-label="Drag to reorder"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
						</svg>
					</span>
				{/if}
				<span class="d2mh hero-{heroId} shrink-0 w-8 h-8 rounded bg-gray-700" aria-hidden="true"></span>
				<div class="min-w-0 flex-1 flex flex-col gap-1">
					<span class="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{getHeroName(heroId)}</span>
					{#if variant === 'lineups'}
						{#if def}
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="inline-flex items-center rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300" title="Max HP">HP {def.baseMaxHp}</span>
								<span class="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300" title="Attack damage">DMG {def.baseAttackDamage}</span>
								<span class="inline-flex items-center rounded bg-gray-500/15 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:text-gray-300" title="Armor">Arm {def.baseArmor}</span>
								<span class="inline-flex items-center rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300" title="Magic resist">MR {Math.round(def.baseMagicResist * 100)}%</span>
								{#if def.baseSpellInterval != null}
									<span class="inline-flex items-center rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300" title="Spell cooldown (s)">CD {def.baseSpellInterval}s</span>
								{/if}
							</div>
							{#if (def.abilityIds?.length ?? 0) > 0}
								<div class="flex flex-wrap items-center gap-1">
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
						{/if}
					{/if}
				</div>
				{#if isRunMode}
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
				{/if}

				<!-- Hover popover: full hero details -->
				{#if hoveredHeroIndex === index}
					<div
						class="absolute left-full top-0 z-50 ml-2 w-[min(340px,90vw)] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg p-4"
						role="tooltip"
					>
						<div class="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
							<span class="d2mh hero-{heroId} shrink-0 w-10 h-10 rounded bg-gray-700" aria-hidden="true"></span>
							<div>
								<p class="font-semibold text-gray-900 dark:text-gray-100">{getHeroName(heroId)}</p>
								{#if def}
									<span class="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
										{def.primaryAttribute}
									</span>
								{/if}
							</div>
						</div>
						{#if def}
							<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">Base stats</p>
							<dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm mb-4">
								<span class="text-gray-500 dark:text-gray-400">Max HP</span>
								<span class="text-gray-900 dark:text-gray-100">{statWithTraining(heroId, def.baseMaxHp, 'hp', (v) => String(Math.round(v)))}</span>
								<span class="text-gray-500 dark:text-gray-400">Attack damage</span>
								<span class="text-gray-900 dark:text-gray-100">{statWithTraining(heroId, def.baseAttackDamage, 'attack_damage')}</span>
								<span class="text-gray-500 dark:text-gray-400">Armor</span>
								<span class="text-gray-900 dark:text-gray-100">{statWithTraining(heroId, def.baseArmor, 'armor')}</span>
								<span class="text-gray-500 dark:text-gray-400">Magic resist</span>
								<span class="text-gray-900 dark:text-gray-100">{statWithTraining(heroId, def.baseMagicResist, 'magic_resist', (v) => (v * 100).toFixed(1) + '%')}</span>
								<span class="text-gray-500 dark:text-gray-400">Attack interval</span>
								<span class="text-gray-900 dark:text-gray-100">{def.baseAttackInterval}s{#if trainingByHero[heroId]?.attack_speed != null} <span class="text-primary">+{formatStat(trainingByHero[heroId].attack_speed)} speed</span>{/if}</span>
								{#if def.baseSpellInterval != null}
									<span class="text-gray-500 dark:text-gray-400">Spell interval</span>
									<span class="text-gray-900 dark:text-gray-100">{def.baseSpellInterval}s{#if trainingByHero[heroId]?.spell_haste != null} <span class="text-primary">+{formatStat(trainingByHero[heroId].spell_haste)} haste</span>{/if}</span>
								{/if}
							</dl>
							{#if (def.abilityIds?.length ?? 0) > 0}
								<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">Equipped spells</p>
								<div class="space-y-3">
									{#each def.abilityIds as abilityId}
										{@const ability = getAbilityDef(abilityId)}
										<div class="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-2.5">
											<p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{abilityDisplayName(ability)}</p>
											{#if ability?.description}
												<p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{ability.description}</p>
											{/if}
											<dl class="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
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
								<p class="text-xs text-gray-500 dark:text-gray-400 italic">No abilities.</p>
							{/if}
						{:else}
							<p class="text-sm text-gray-500 dark:text-gray-400">Base stats and abilities not loaded.</p>
						{/if}
					</div>
				{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>
