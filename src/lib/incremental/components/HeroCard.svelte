<!--
  Shared hero card used everywhere we show a hero's stats/abilities.
  - Atlas: variant="full" — base stats + full ability details (2 slots with spell icons).
  - Tavern → Your roster: variant="short" — base stats + training breakdown + ability list.
  - Lineup list & edit: variant="compact" — icon + name only (optionally attribute if def present).
  - Roster (tavern/training): variant="roster" — final computed stats, trained stats in green, hover shows base + training.
-->
<script lang="ts">
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { formatStat } from '$lib/incremental/actions/constants';
	import type { TrainingStatKey } from '$lib/incremental/actions/constants';
	import { TRAINING_BUILDINGS } from '$lib/incremental/actions/constants';
	import { attackInterval, spellInterval } from '$lib/incremental/stats/formulas';

	/** Ability info for display: AbilityDef plus optional DB fields (name, description). */
	export type HeroCardAbility = AbilityDef & {
		abilityName?: string;
		description?: string | null;
	};

	export type HeroCardVariant = 'full' | 'short' | 'compact' | 'roster';

	interface Props {
		heroId: number;
		displayName: string;
		/** Base or effective stats. Null = hero not in DB (show fallback). */
		def: HeroDef | null;
		/** When provided, show base stats plus "+ X" training breakdown (use when def is base-only). Omit or empty when def is already effective. */
		training?: Record<string, number>;
		/** Ordered ability slots (2 for full/short). Can be sparse [ability1, ability2]. */
		abilities?: (HeroCardAbility | null)[];
		variant?: HeroCardVariant;
		/** Optional scale for hero icon (e.g. scale-125, scale-150). Default varies by variant. */
		iconScale?: string;
		/** When set, highlight matching substring in display name (e.g. for Atlas search). */
		highlightQuery?: string;
	}

	let {
		heroId,
		displayName,
		def,
		training = {},
		abilities = [],
		variant = 'full',
		iconScale,
		highlightQuery
	}: Props = $props();

	/** Safe HTML with query matches wrapped in <mark>. Used when highlightQuery is set (e.g. Atlas search). */
	function highlightMatch(text: string, query: string): string {
		if (!query.trim()) {
			return escapeHtml(text);
		}
		const re = new RegExp(
			query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
			'gi'
		);
		let result = '';
		let lastEnd = 0;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			result += escapeHtml(text.slice(lastEnd, m.index));
			result += '<mark class="bg-amber-200 dark:bg-amber-600/50 rounded px-0.5">' + escapeHtml(m[0]) + '</mark>';
			lastEnd = re.lastIndex;
		}
		result += escapeHtml(text.slice(lastEnd));
		return result;
	}
	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	const highlightedNameHtml = $derived(
		highlightQuery ? highlightMatch(displayName, highlightQuery) : null
	);

	const scale = $derived(iconScale ?? (variant === 'compact' ? 'scale-75' : variant === 'short' || variant === 'roster' ? 'scale-150' : ''));

	// Spell icon position from Atlas (9×6 grid, 45 valid icons)
	import { abilityIconPath } from './game-icons';

	function getAbilityIcon(ability: HeroCardAbility): string {
		return abilityIconPath(ability.id, ability.effect);
	}

	function formatStatDisplay(value: number | null | undefined): string {
		if (value == null) return '—';
		if (Number.isInteger(value)) return String(value);
		return value.toFixed(2);
	}

	function abilityDisplayName(ability: HeroCardAbility): string {
		return ability.abilityName ?? ability.effect?.replace(/_/g, ' ') ?? ability.id.replace(/_/g, ' ');
	}

	function statLabel(statKey: string): string {
		return TRAINING_BUILDINGS[statKey as TrainingStatKey]?.name ?? statKey;
	}

	/** Value with optional "+ X" training suffix. */
	function withTraining(
		value: number | undefined,
		trainedKey: string | undefined,
		format: (v: number) => string = formatStat
	): string {
		if (value == null) return '—';
		const base = format(value);
		const tr = trainedKey != null ? training?.[trainedKey] : undefined;
		if (tr != null) return `${base} +${format(tr)}`;
		return base;
	}

	/** Roster variant: final computed value and whether it was modified by training (for green + tooltip). */
	function rosterStat(
		label: string,
		finalValue: string,
		baseValue: string,
		trainedAmount: number | undefined
	): { finalValue: string; isTrained: boolean; tooltip: string } {
		const isTrained = trainedAmount != null && trainedAmount !== 0;
		const tooltip = isTrained ? `${label}: Base ${baseValue}, Training +${formatStat(trainedAmount)}` : '';
		return { finalValue, isTrained, tooltip };
	}

	const abilitySlots = $derived(variant === 'full' ? [0, 1] : []);
</script>

<!-- Single cohesive card: same border, bg, shadow; layout/size varies by variant -->
<article
	class="hero-card rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm flex flex-col"
	class:hero-card--compact={variant === 'compact'}
	class:rounded-lg={variant === 'compact'}
	class:inline-flex={variant === 'compact'}
	class:flex-row={variant === 'compact'}
	class:items-center={variant === 'compact'}
	class:gap-2={variant === 'compact'}
	class:px-3={variant === 'compact'}
	class:py-2={variant === 'compact'}
>
	<!-- Header: icon + name + attribute (same structure in all variants) -->
	<header
		class="hero-card__header px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700"
		class:hero-card__header--compact={variant === 'compact'}
		class:border-b-0={variant === 'compact'}
		class:p-0={variant === 'compact'}
		class:bg-transparent={variant === 'compact'}
	>
		<div class="flex items-center gap-3">
			<span
				class="d2mh hero-{heroId} shrink-0 {scale}"
				title={displayName}
				aria-hidden="true"
			></span>
			<div class="min-w-0 flex-1">
				<h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
					{#if highlightedNameHtml != null}
						{@html highlightedNameHtml}
					{:else}
						{displayName}
					{/if}
				</h2>
				{#if def}
					<span
						class="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
					>
						{def.primaryAttribute}
					</span>
				{/if}
			</div>
		</div>

		{#if variant === 'full' && def}
			<!-- Offensive: Dmg, BAI, Spell CD -->
			<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				<span class="text-gray-500 dark:text-gray-500 font-medium">Off:</span>
				<span>Dmg {withTraining(def.baseAttackDamage, 'attack_damage')}</span>
				<span class="mx-1.5">·</span>
				<span>BAI {formatStatDisplay(def.baseAttackInterval)}</span>
				{#if training?.attack_speed != null}
					<span class="text-primary"> +{formatStat(training.attack_speed)} speed</span>
				{/if}
				<span class="mx-1.5">·</span>
				<span>CD {def.baseSpellInterval != null ? formatStatDisplay(def.baseSpellInterval) : '—'}</span>
				{#if training?.spell_haste != null}
					<span class="text-primary"> +{formatStat(training.spell_haste)} haste</span>
				{/if}
			</div>
			<!-- Defensive: HP, Armor, MR -->
			<div class="mt-1 text-sm text-gray-600 dark:text-gray-400">
				<span class="text-gray-500 dark:text-gray-500 font-medium">Def:</span>
				<span>HP {withTraining(def.baseMaxHp, 'hp', (v) => String(Math.round(v)))}</span>
				<span class="mx-1.5">·</span>
				<span>Armor {withTraining(def.baseArmor, 'armor')}</span>
				<span class="mx-1.5">·</span>
				<span>MR {withTraining(def.baseMagicResist, 'magic_resist')}</span>
			</div>
		{/if}
	</header>

	{#if variant === 'short' && def}
		<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
			<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
				<span class="text-gray-500 dark:text-gray-400">HP</span>
				<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseMaxHp)}{#if training?.hp != null} <span class="text-primary">+{formatStat(training.hp)}</span>{/if}</span>
				<span class="text-gray-500 dark:text-gray-400">Attack damage</span>
				<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseAttackDamage)}{#if training?.attack_damage != null} <span class="text-primary">+{formatStat(training.attack_damage)}</span>{/if}</span>
				<span class="text-gray-500 dark:text-gray-400">Armor</span>
				<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseArmor)}{#if training?.armor != null} <span class="text-primary">+{formatStat(training.armor)}</span>{/if}</span>
				<span class="text-gray-500 dark:text-gray-400">Magic resist</span>
				<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseMagicResist * 100)}%{#if training?.magic_resist != null} <span class="text-primary">+{formatStat(training.magic_resist)}</span>{/if}</span>
				<span class="text-gray-500 dark:text-gray-400">Attack interval</span>
				<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseAttackInterval)}s{#if training?.attack_speed != null} <span class="text-primary">+{formatStat(training.attack_speed)} speed</span>{/if}</span>
				{#if def.baseSpellInterval != null}
					<span class="text-gray-500 dark:text-gray-400">Spell interval</span>
					<span class="text-gray-900 dark:text-gray-100">{formatStat(def.baseSpellInterval)}s{#if training?.spell_haste != null} <span class="text-primary">+{formatStat(training.spell_haste)} haste</span>{/if}</span>
				{/if}
			</div>
		</div>
	{/if}

	{#if variant === 'roster' && def}
		{@const finalHp = Math.round(def.baseMaxHp + (training?.hp ?? 0))}
		{@const finalAttackDamage = def.baseAttackDamage + (training?.attack_damage ?? 0)}
		{@const finalArmor = def.baseArmor + (training?.armor ?? 0)}
		{@const baseMrPct = def.baseMagicResist * 100}
		{@const finalMrPct = Math.max(0, Math.min(100, baseMrPct + (training?.magic_resist ?? 0)))}
		{@const finalAttackIntervalSec = attackInterval(def.baseAttackInterval, training?.attack_speed ?? 0)}
		{@const finalSpellIntervalSec = def.baseSpellInterval != null ? spellInterval(def.baseSpellInterval, training?.spell_haste ?? 0) : null}
		{@const finalSpellPower = training?.spell_power ?? 0}
		<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
			<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
				<span class="text-gray-500 dark:text-gray-400">HP</span>
				<span
					class={rosterStat('HP', String(finalHp), String(Math.round(def.baseMaxHp)), training?.hp).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('HP', String(finalHp), String(Math.round(def.baseMaxHp)), training?.hp).tooltip}
				>{finalHp}</span>
				<span class="text-gray-500 dark:text-gray-400">Attack damage</span>
				<span
					class={rosterStat('Attack damage', formatStat(finalAttackDamage), formatStat(def.baseAttackDamage), training?.attack_damage).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('Attack damage', formatStat(finalAttackDamage), formatStat(def.baseAttackDamage), training?.attack_damage).tooltip}
				>{Number.isInteger(finalAttackDamage) ? finalAttackDamage : formatStat(finalAttackDamage)}</span>
				<span class="text-gray-500 dark:text-gray-400">Armor</span>
				<span
					class={rosterStat('Armor', formatStat(finalArmor), formatStat(def.baseArmor), training?.armor).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('Armor', formatStat(finalArmor), formatStat(def.baseArmor), training?.armor).tooltip}
				>{Number.isInteger(finalArmor) ? finalArmor : formatStat(finalArmor)}</span>
				<span class="text-gray-500 dark:text-gray-400">Magic resist</span>
				<span
					class={rosterStat('Magic resist', `${finalMrPct.toFixed(1)}%`, `${(baseMrPct).toFixed(1)}%`, training?.magic_resist).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('Magic resist', `${finalMrPct.toFixed(1)}%`, `${(baseMrPct).toFixed(1)}%`, training?.magic_resist).tooltip}
				>{finalMrPct.toFixed(1)}%</span>
				<span class="text-gray-500 dark:text-gray-400">Attack interval</span>
				<span
					class={rosterStat('Attack interval', `${finalAttackIntervalSec.toFixed(2)}s`, `${def.baseAttackInterval.toFixed(2)}s`, training?.attack_speed).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('Attack interval', `${finalAttackIntervalSec.toFixed(2)}s`, `${def.baseAttackInterval.toFixed(2)}s`, training?.attack_speed).tooltip}
				>{finalAttackIntervalSec.toFixed(2)}s</span>
				{#if def.baseSpellInterval != null}
					<span class="text-gray-500 dark:text-gray-400">Spell interval</span>
					<span
						class={rosterStat('Spell interval', `${(finalSpellIntervalSec ?? 0).toFixed(2)}s`, `${def.baseSpellInterval.toFixed(2)}s`, training?.spell_haste).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
						title={rosterStat('Spell interval', `${(finalSpellIntervalSec ?? 0).toFixed(2)}s`, `${def.baseSpellInterval.toFixed(2)}s`, training?.spell_haste).tooltip}
					>{(finalSpellIntervalSec ?? 0).toFixed(2)}s</span>
				{/if}
				<span class="text-gray-500 dark:text-gray-400">Spell power</span>
				<span
					class={rosterStat('Spell power', formatStat(finalSpellPower), '0', training?.spell_power).isTrained ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
					title={rosterStat('Spell power', formatStat(finalSpellPower), '0', training?.spell_power).tooltip}
				>{finalSpellPower === 0 ? '0' : formatStat(finalSpellPower)}</span>
			</div>
		</div>
	{/if}

	{#if !def && variant !== 'compact'}
		<div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
			Base stats and abilities not yet in the database.
			{#if Object.keys(training ?? {}).length > 0}
				<p class="mt-2 text-gray-700 dark:text-gray-300">
					Training: {Object.entries(training ?? {}).map(([k, v]) => `${statLabel(k)} +${formatStat(v)}`).join(', ')}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Abilities -->
	{#if variant !== 'compact' && ((def?.abilityIds?.length ?? 0) > 0 || (abilities?.length ?? 0) > 0)}
		<div class="p-4 grid grid-cols-2 gap-3 flex-1 min-h-0" class:grid-cols-1={variant === 'short' || variant === 'roster'}>
			{#if variant === 'full'}
				{#each abilitySlots as i}
					{@const ability = abilities?.[i] ?? null}
					{#if ability}
						<div
							class="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-3 flex gap-3 min-w-0"
						>
							<span
								class="gi w-8 h-8 shrink-0 rounded-md border border-gray-200 dark:border-gray-600 p-0.5 text-blue-300"
								style="--gi: url({getAbilityIcon(ability)})"
								title={abilityDisplayName(ability)}
								aria-hidden="true"
							></span>
							<div class="min-w-0 flex-1">
								<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{abilityDisplayName(ability)}
								</h3>
								{#if ability.description}
									<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
										{ability.description}
									</p>
								{:else}
									<p class="text-xs text-gray-500 dark:text-gray-500 italic mt-1">No description.</p>
								{/if}
								<dl class="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 text-xs text-gray-600 dark:text-gray-400">
									<span><strong class="text-gray-500 dark:text-gray-500">Type</strong> {ability.type}</span>
									<span><strong class="text-gray-500 dark:text-gray-500">Trigger</strong> {ability.trigger}</span>
									<span><strong class="text-gray-500 dark:text-gray-500">Effect</strong> {ability.effect ?? '—'}</span>
									<span><strong class="text-gray-500 dark:text-gray-500">Target</strong> {ability.target ?? '—'}</span>
									{#if ability.damageType}
										<span><strong class="text-gray-500 dark:text-gray-500">Dmg type</strong> {ability.damageType}</span>
									{/if}
									{#if ability.baseDamage != null}
										<span><strong class="text-gray-500 dark:text-gray-500">Base dmg</strong> {ability.baseDamage}</span>
									{/if}
									{#if ability.returnDamageRatio != null}
										<span><strong class="text-gray-500 dark:text-gray-500">Return</strong> {formatStatDisplay(ability.returnDamageRatio)}</span>
									{/if}
								</dl>
							</div>
						</div>
					{:else}
						<div
							class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500"
						>
							—
						</div>
					{/if}
				{/each}
			{:else if (variant === 'short' || variant === 'roster') && def}
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mt-0 mb-1">Abilities</p>
				<ul class="text-sm text-gray-700 dark:text-gray-300 space-y-0.5 col-span-1">
					{#each def.abilityIds ?? [] as aid}
						{@const ability = abilities?.find((a) => a?.id === aid) ?? null}
						<li>
							{ability ? abilityDisplayName(ability) : aid.replace(/_/g, ' ')}
							{#if ability}
								<span class="text-gray-500 dark:text-gray-400"> — {ability.type}, {ability.trigger}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</article>
