<script lang="ts">
	import { onMount } from 'svelte';
	import HeroCard from '$lib/incremental/components/HeroCard.svelte';
	import type { HeroCardAbility } from '$lib/incremental/components/HeroCard.svelte';
	import type { HeroDef, DamageType } from '$lib/incremental/types';

	type AbilityInfo = {
		id: string;
		abilityName: string;
		description: string | null;
		type: string;
		trigger: string;
		effect: string;
		target: string;
		damageType: string | null;
		baseDamage: number | null;
		returnDamageRatio: number | null;
	};

	type AtlasHero = {
		heroId: number;
		localizedName: string;
		primaryAttribute: string;
		baseAttackInterval: number;
		baseAttackDamage: number;
		baseMaxHp: number;
		baseArmor: number;
		baseMagicResist: number;
		baseSpellInterval: number | null;
		ability1: AbilityInfo | null;
		ability2: AbilityInfo | null;
	};

	let heroes = $state<AtlasHero[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchAtlas() {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/incremental/atlas');
			if (!res.ok) {
				error = res.status === 401 ? 'Sign in to view the Atlas.' : `Failed to load (${res.status})`;
				heroes = [];
				return;
			}
			const data = await res.json();
			heroes = data.heroes ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load Atlas.';
			heroes = [];
		} finally {
			loading = false;
		}
	}

	function atlasHeroToDef(h: AtlasHero): HeroDef {
		return {
			heroId: h.heroId,
			primaryAttribute: h.primaryAttribute as HeroDef['primaryAttribute'],
			baseAttackInterval: h.baseAttackInterval,
			baseAttackDamage: h.baseAttackDamage,
			baseMaxHp: h.baseMaxHp,
			baseArmor: h.baseArmor,
			baseMagicResist: h.baseMagicResist,
			baseSpellInterval: h.baseSpellInterval,
			abilityIds: [h.ability1?.id, h.ability2?.id].filter(Boolean) as string[]
		};
	}

	function atlasAbilityToCard(a: AbilityInfo | null): HeroCardAbility | null {
		if (!a) return null;
		return {
			id: a.id,
			abilityName: a.abilityName,
			description: a.description,
			type: a.type as 'active' | 'passive',
			trigger: a.trigger,
			effect: a.effect,
			target: a.target,
			damageType: (a.damageType as DamageType) ?? undefined,
			baseDamage: a.baseDamage ?? undefined,
			returnDamageRatio: a.returnDamageRatio ?? undefined
		};
	}

	onMount(() => {
		fetchAtlas();
	});
</script>

<div class="max-w-6xl mx-auto p-6 space-y-6">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Atlas</h1>
	<p class="text-sm text-gray-600 dark:text-gray-400">
		Every hero, base stats, and full ability details for balancing. Data is loaded from the database (seed from
		<code class="rounded bg-gray-200 dark:bg-gray-700 px-1">data/heroes_base_stats.csv</code>
		and
		<code class="rounded bg-gray-200 dark:bg-gray-700 px-1">data/hero_abilities.csv</code>).
	</p>

	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading…</p>
	{:else if error}
		<p class="text-red-600 dark:text-red-400">{error}</p>
	{:else if heroes.length === 0}
		<p class="text-gray-500 dark:text-gray-400">
			No hero data in the database. Run
			<code class="rounded bg-gray-200 dark:bg-gray-700 px-1">npx prisma db seed</code>
			(after migrating) to upload base stats and abilities from the CSVs.
		</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			{#each heroes as h}
				<HeroCard
					heroId={h.heroId}
					displayName={h.localizedName}
					def={atlasHeroToDef(h)}
					abilities={[atlasAbilityToCard(h.ability1), atlasAbilityToCard(h.ability2)]}
					variant="full"
				/>
			{/each}
		</div>
	{/if}
</div>
