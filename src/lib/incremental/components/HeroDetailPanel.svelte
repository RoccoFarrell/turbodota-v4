<!--
  Reusable hero detail panel — shows stats, DPS breakdown, and abilities.
  Used by the Tavern (theme='tavern') and LineupCard popover (theme='default').
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { formatStat } from '$lib/incremental/actions';
	import { attackInterval, spellInterval } from '$lib/incremental/stats/formulas';
	import { computeHeroCombatStats } from '$lib/incremental/stats/lineup-stats';
	import SpellDetails from './SpellDetails.svelte';

	interface Props {
		heroDef: HeroDef;
		heroName: string;
		training: Record<string, number>;
		abilityDefs: Record<string, AbilityDef>;
		getAbilityDef: (id: string) => AbilityDef | undefined;
		theme?: 'default' | 'tavern';
		showCloseButton?: boolean;
		onClose?: () => void;
		children?: Snippet;
	}

	const {
		heroDef,
		heroName,
		training,
		abilityDefs,
		getAbilityDef,
		theme = 'default',
		showCloseButton = false,
		onClose,
		children
	}: Props = $props();

	const isTavern = $derived(theme === 'tavern');

	// Computed combat stats
	const combatStats = $derived(computeHeroCombatStats(heroDef, abilityDefs, training));

	// Derived stat values
	const t = $derived(training);
	const finalHp = $derived(Math.round(heroDef.baseMaxHp + (t.hp ?? 0)));
	const finalAtk = $derived(heroDef.baseAttackDamage + (t.attack_damage ?? 0));
	const finalArmor = $derived(heroDef.baseArmor + (t.armor ?? 0));
	const baseMrPct = $derived(heroDef.baseMagicResist * 100);
	const finalMrPct = $derived(Math.max(0, Math.min(100, baseMrPct + (t.magic_resist ?? 0))));
	const finalAtkInterval = $derived(
		attackInterval(heroDef.baseAttackInterval, t.attack_speed ?? 0)
	);
	const finalSpellInterval = $derived(
		heroDef.baseSpellInterval != null
			? spellInterval(heroDef.baseSpellInterval, t.spell_haste ?? 0)
			: null
	);
	const spellPower = $derived(t.spell_power ?? 0);

	const ATTR_COLORS: Record<string, string> = {
		str: 'bg-red-500/20 text-red-400',
		agi: 'bg-green-500/20 text-green-400',
		int: 'bg-blue-500/20 text-blue-400',
		universal: 'bg-purple-500/20 text-purple-400'
	};

	// Abilities resolved
	const abilities = $derived(heroDef.abilityIds?.map((aid) => getAbilityDef(aid)) ?? []);
</script>

<div class="hero-detail-panel" class:hero-detail-panel--tavern={isTavern}>
	<!-- Header row -->
	<div class="flex items-center gap-3">
		<span
			class="d2mh hero-{heroDef.heroId} shrink-0"
			class:scale-150={isTavern}
			title={heroName}
			aria-hidden="true"
		></span>
		<div class="min-w-0 flex-1">
			<h3 class="text-lg font-bold" class:text-amber-100={isTavern} class:text-gray-100={!isTavern}>
				{heroName}
			</h3>
			<span
				class="inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded mt-0.5 {ATTR_COLORS[heroDef.primaryAttribute] ?? 'bg-gray-600 text-gray-300'}"
			>
				{heroDef.primaryAttribute}
			</span>
		</div>
		{#if showCloseButton && onClose}
			<button
				class="rounded-md p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
				onclick={onClose}
				aria-label="Close"
			>
				<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Stats grid -->
	<div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
		<div class="flex justify-between">
			<span class="hdp-stat-label">HP</span>
			<span
				class={t.hp ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
				title={t.hp ? `Base ${Math.round(heroDef.baseMaxHp)} + Training ${Math.round(t.hp)}` : ''}
			>
				{finalHp}
			</span>
		</div>
		<div class="flex justify-between">
			<span class="hdp-stat-label">ATK</span>
			<span
				class={t.attack_damage ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
				title={t.attack_damage ? `Base ${formatStat(heroDef.baseAttackDamage)} + Training ${formatStat(t.attack_damage)}` : ''}
			>
				{Number.isInteger(finalAtk) ? finalAtk : formatStat(finalAtk)}
			</span>
		</div>
		<div class="flex justify-between">
			<span class="hdp-stat-label">Armor</span>
			<span
				class={t.armor ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
				title={t.armor ? `Base ${formatStat(heroDef.baseArmor)} + Training ${formatStat(t.armor)}` : ''}
			>
				{Number.isInteger(finalArmor) ? finalArmor : formatStat(finalArmor)}
			</span>
		</div>
		<div class="flex justify-between">
			<span class="hdp-stat-label">MR</span>
			<span
				class={t.magic_resist ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
				title={t.magic_resist ? `Base ${baseMrPct.toFixed(1)}% + Training ${formatStat(t.magic_resist)}` : ''}
			>
				{finalMrPct.toFixed(1)}%
			</span>
		</div>
		<div class="flex justify-between">
			<span class="hdp-stat-label">Atk Spd</span>
			<span
				class={t.attack_speed ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
				title={t.attack_speed ? `Base ${heroDef.baseAttackInterval.toFixed(2)}s + Speed ${formatStat(t.attack_speed)}` : ''}
			>
				{finalAtkInterval.toFixed(2)}s
			</span>
		</div>
		{#if heroDef.baseSpellInterval != null}
			<div class="flex justify-between">
				<span class="hdp-stat-label">Spell</span>
				<span
					class={t.spell_haste ? 'text-emerald-400 font-medium' : isTavern ? 'text-stone-200' : 'text-gray-100'}
					title={t.spell_haste ? `Base ${heroDef.baseSpellInterval.toFixed(2)}s + Haste ${formatStat(t.spell_haste)}` : ''}
				>
					{(finalSpellInterval ?? 0).toFixed(2)}s
				</span>
			</div>
		{/if}
		{#if spellPower > 0}
			<div class="flex justify-between">
				<span class="hdp-stat-label">SP</span>
				<span class="text-emerald-400 font-medium">{formatStat(spellPower)}</span>
			</div>
		{/if}
	</div>

	<!-- DPS strip -->
	<div class="mt-3 pt-3 hdp-divider">
		<div class="flex items-center gap-4">
			<div class="hdp-dps-cell">
				<span class="hdp-dps-label">Auto</span>
				<span class="hdp-dps-value text-amber-400">{combatStats.autoDps.toFixed(1)}</span>
			</div>
			{#if combatStats.spellDps > 0}
				<div class="hdp-dps-cell">
					<span class="hdp-dps-label">Spell</span>
					<span class="hdp-dps-value text-sky-400">{combatStats.spellDps.toFixed(1)}</span>
				</div>
			{/if}
			<div class="hdp-dps-cell">
				<span class="hdp-dps-label">Total DPS</span>
				<span class="hdp-dps-value font-bold" class:text-stone-100={isTavern} class:text-white={!isTavern}>{combatStats.totalDps.toFixed(1)}</span>
			</div>
		</div>
		<!-- DPS proportion bar -->
		{#if combatStats.totalDps > 0}
			{@const autoPct = (combatStats.autoDps / combatStats.totalDps) * 100}
			<div class="mt-1.5 h-1.5 rounded-full overflow-hidden bg-stone-800 flex">
				<div class="bg-amber-500/70 transition-all" style="width:{autoPct}%"></div>
				<div class="bg-sky-500/70 flex-1"></div>
			</div>
		{/if}
	</div>

	<!-- Abilities -->
	{#if heroDef.abilityIds?.length}
		<div class="mt-3 pt-3 hdp-divider">
			<p class="text-xs uppercase tracking-wide mb-2" class:text-stone-600={isTavern} class:text-gray-500={!isTavern}>
				Abilities
			</p>
			<SpellDetails {abilities} {theme} />
		</div>
	{/if}

	<!-- Snippet slot for extra content (e.g., Tavern training history) -->
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	/* ── Panel wrapper ── */
	.hero-detail-panel {
		border-radius: 0.5rem;
		border: 1px solid rgba(75, 85, 99, 0.4);
		background: rgba(31, 41, 55, 0.8);
		padding: 1rem;
	}
	.hero-detail-panel--tavern {
		border-color: rgba(120, 80, 30, 0.2);
		background: #1e1812;
	}

	/* ── Stat labels ── */
	.hdp-stat-label {
		color: #a8a29e; /* stone-400 fallback */
	}
	.hero-detail-panel:not(.hero-detail-panel--tavern) .hdp-stat-label {
		color: #9ca3af; /* gray-400 */
	}

	/* ── Section dividers ── */
	.hdp-divider {
		border-top: 1px solid rgba(75, 85, 99, 0.4);
	}
	.hero-detail-panel--tavern .hdp-divider {
		border-top-color: rgba(120, 80, 30, 0.2);
	}

	/* ── DPS display cells ── */
	.hdp-dps-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}
	.hdp-dps-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(168, 162, 158, 0.6);
	}
	.hdp-dps-value {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
</style>
