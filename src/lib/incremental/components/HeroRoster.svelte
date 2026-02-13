<!--
  Detailed hero roster: list of heroes with computed stats (roster variant).
  Used on Hero Tavern and Training tab. Pass roster data from parent.
-->
<script lang="ts">
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import HeroCard from '$lib/incremental/components/HeroCard.svelte';

	interface Props {
		/** Ordered hero ids to display. */
		rosterHeroIds: number[];
		/** Resolve hero definition by id. */
		getHeroDef: (heroId: number) => HeroDef | undefined;
		/** Resolve ability definition by id. */
		getAbilityDef: (abilityId: string) => AbilityDef | undefined;
		/** Display name for a hero id. */
		heroName: (heroId: number, fallback: string) => string;
		/** Per-hero training values: heroId -> { statKey: value }. */
		trainingValues: Record<number, Record<string, number>>;
		/** Optional section title (e.g. "Your roster"). */
		title?: string;
	}

	let { rosterHeroIds, getHeroDef, getAbilityDef, heroName, trainingValues, title }: Props = $props();
</script>

<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 min-w-0">
	{#if title}
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
			{title}
		</h2>
	{/if}
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
					variant="roster"
					iconScale="scale-150"
				/>
			{/each}
		</div>
	{/if}
</section>
