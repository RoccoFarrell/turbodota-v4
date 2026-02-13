<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { toaster } from '$lib/toaster';
	import {
		formatStat,
		getDurationSec,
		TRAINING_BUILDINGS,
		TRAINING_STAT_KEYS,
		MINING_ESSENCE_PER_STRIKE,
		type TrainingStatKey
	} from '$lib/incremental/actions';
	import ActionSlotBar from '$lib/incremental/components/ActionSlotBar.svelte';
	import ActionCard from '$lib/incremental/components/ActionCard.svelte';
	import HeroRoster from '$lib/incremental/components/HeroRoster.svelte';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	/** Hero definitions from API (for roster display). */
	let heroesFromApi = $state<{ heroes: HeroDef[]; heroNames: Array<{ heroId: number; localizedName: string }>; abilityDefs: Record<string, AbilityDef> }>({
		heroes: [],
		heroNames: [],
		abilityDefs: {}
	});
	const heroById = $derived(new Map(heroesFromApi.heroes.map((h) => [h.heroId, h])));
	const heroNameById = $derived(new Map(heroesFromApi.heroNames.map((n) => [n.heroId, n.localizedName])));

	function heroName(heroId: number, fallback: string = 'Hero'): string {
		return heroNameById.get(heroId) ?? layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? fallback;
	}

	function getHeroDef(heroId: number): HeroDef | undefined {
		return heroById.get(heroId);
	}

	function getAbilityDef(abilityId: string): AbilityDef | undefined {
		return heroesFromApi.abilityDefs[abilityId];
	}

	function statLabel(statKey: TrainingStatKey): string {
		return TRAINING_BUILDINGS[statKey]?.name ?? statKey;
	}

	const BUILDING_ICONS: Record<TrainingStatKey, string> = {
		hp: '🏰',
		attack_damage: '⚔️',
		spell_power: '🔮',
		attack_speed: '⚡',
		spell_haste: '🌀',
		armor: '🛡️',
		magic_resist: '🧿'
	};

	// ---- Local state (page-specific) ----
	let saves = $state<Array<{ id: string; name: string | null; essence: number }>>([]);
	let rosterHeroIds = $state<number[]>([]);
	let trainingValues = $state<Record<number, Record<string, number>>>({});
	let buildingHeroSelections = $state<Record<TrainingStatKey, string>>({} as Record<TrainingStatKey, string>);

	// ---- Shared store bindings ----
	const saveId = $derived(actionStore.getSaveId());
	const essence = $derived(actionStore.getEssence());
	const maxSlots = $derived(actionStore.getMaxSlots());
	const slots = $derived(actionStore.getSlots());
	const isRunning = $derived(actionStore.getIsRunning());

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	// ---- Data fetching (page-specific) ----

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

	// ---- Actions ----

	function findFreeSlotIndex(): number | null {
		for (let i = 0; i < maxSlots; i++) {
			if (!slots.find((s) => s.slotIndex === i)) return i;
		}
		return null;
	}

	async function startMining() {
		const slotIndex = findFreeSlotIndex();
		const idx = slotIndex ?? 0;
		const ok = await actionStore.assignSlot(idx, 'mining');
		if (!ok) {
			toaster.error({ title: 'Failed to start mining' });
		}
	}

	async function startTraining(heroId: number, statKey: TrainingStatKey) {
		const slotIndex = findFreeSlotIndex();
		const idx = slotIndex ?? 0;
		const ok = await actionStore.assignSlot(idx, 'training', heroId, statKey);
		if (!ok) {
			toaster.error({ title: 'Failed to start training' });
		} else {
			await fetchTraining();
		}
	}

	async function handleClearSlot(slotIndex: number) {
		await actionStore.clearSlot(slotIndex);
	}

	// ---- Display helpers ----

	function slotDisplayProgress(slot: actionStore.SlotState): number {
		return actionStore.slotDisplayProgress(slot);
	}

	function slotNextIn(slot: actionStore.SlotState): number {
		return actionStore.slotNextIn(slot);
	}

	function slotActionLabel(slot: actionStore.SlotState): string {
		if (slot.actionType === 'mining') return 'Mining';
		if (slot.actionType === 'training' && slot.actionHeroId != null && slot.actionStatKey != null) {
			return `Training ${heroName(slot.actionHeroId)} \u2013 ${statLabel(slot.actionStatKey as TrainingStatKey)}`;
		}
		return 'Training';
	}

	function slotRateLabel(slot: actionStore.SlotState): string {
		if (slot.actionType === 'mining') return `+${MINING_ESSENCE_PER_STRIKE} Essence per strike`;
		if (slot.actionType === 'training' && slot.actionStatKey) {
			return `+1 ${statLabel(slot.actionStatKey as TrainingStatKey)} per tick`;
		}
		return '';
	}

	function isMiningActive(): boolean {
		return slots.some((s) => s.actionType === 'mining');
	}

	function miningSlotLabel(): string | undefined {
		const s = slots.find((s) => s.actionType === 'mining');
		if (!s) return undefined;
		return `Slot ${s.slotIndex + 1}`;
	}

	function isBuildingActive(statKey: TrainingStatKey): boolean {
		return slots.some((s) => s.actionType === 'training' && s.actionStatKey === statKey);
	}

	function buildingSlot(statKey: TrainingStatKey): actionStore.SlotState | undefined {
		return slots.find((s) => s.actionType === 'training' && s.actionStatKey === statKey);
	}

	// ---- Lifecycle ----
	// Tick loop is managed by the layout — we just fetch page-specific data here
	// and periodically refresh training values to pick up tick results

	let trainingRefreshInterval: ReturnType<typeof setInterval> | null = null;

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

	onMount(async () => {
		await Promise.all([fetchHeroes(), fetchRoster(), fetchTraining()]);
		// Refresh training values every 2s to reflect tick completions from the layout
		trainingRefreshInterval = setInterval(fetchTraining, 2000);
	});

	onDestroy(() => {
		if (trainingRefreshInterval) { clearInterval(trainingRefreshInterval); trainingRefreshInterval = null; }
	});
</script>

<div class="max-w-6xl mx-auto p-6">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Training</h1>
		<div class="flex items-center gap-3">
			<span class="text-sm font-medium text-gray-500 dark:text-gray-400">Essence:</span>
			<span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{essence}</span>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
		<div class="space-y-8 min-w-0">

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label class="text-sm font-medium text-gray-500 dark:text-gray-400" for="save-select">Save</label>
			<select
				id="save-select"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				value={saveId}
				onchange={(e) => {
					const v = (e.currentTarget as HTMLSelectElement).value;
					actionStore.setSaveId(v);
					actionStore.fetchBank();
					actionStore.fetchSlots();
					fetchRoster();
					fetchTraining();
				}}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'} ({s.essence} Essence)</option>
				{/each}
			</select>
		</section>
	{/if}

	<!-- Active Slots Panel -->
	<section class="space-y-2">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Active Slots ({slots.length}/{maxSlots})
		</h2>
		{#each { length: maxSlots } as _, i}
			{@const slot = slots.find((s) => s.slotIndex === i)}
			{#if slot}
				<ActionSlotBar
					slotLabel="Slot {i + 1}"
					actionLabel={slotActionLabel(slot)}
					progress={slotDisplayProgress(slot)}
					nextIn={slotNextIn(slot)}
					rateLabel={slotRateLabel(slot)}
					isActive={isRunning}
					onStop={() => handleClearSlot(i)}
				/>
			{:else if i < maxSlots}
				<ActionSlotBar
					slotLabel="Slot {i + 1}"
					actionLabel=""
					progress={0}
					nextIn={0}
					isActive={false}
					isEmpty={true}
				/>
			{/if}
		{/each}
		{#if maxSlots < 3}
			<ActionSlotBar
				slotLabel="Slot {maxSlots + 1}"
				actionLabel=""
				progress={0}
				nextIn={0}
				isActive={false}
				isLocked={true}
			/>
		{/if}
	</section>

	<!-- Resource Skills -->
	<section class="space-y-3">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Resource Collection
		</h2>
		<ActionCard
			icon="⛏️"
			name="Essence Mine"
			description="Extract essence from the earth. Essence is used to recruit heroes and purchase upgrades."
			rate="+{MINING_ESSENCE_PER_STRIKE} Essence per strike"
			duration="{getDurationSec('mining').toFixed(1)}s per strike"
			isActive={isMiningActive()}
			activeSlotLabel={miningSlotLabel()}
		>
			{#snippet actions()}
				<button
					class="rounded px-4 py-2 text-sm font-medium {isMiningActive()
						? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
						: 'bg-primary text-primary-foreground hover:opacity-90'}"
					disabled={isMiningActive()}
					onclick={startMining}
				>
					{isMiningActive() ? 'Mining...' : 'Start Mining'}
				</button>
			{/snippet}
		</ActionCard>
	</section>

	<!-- Training Buildings -->
	<section class="space-y-3">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
			Training Buildings
		</h2>
		{#if rosterHeroIds.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400 italic">
				Recruit heroes in <a href="/incremental/tavern" class="text-primary hover:underline">Hero Tavern</a> to start training.
			</p>
		{/if}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each TRAINING_STAT_KEYS as statKey}
				{@const building = TRAINING_BUILDINGS[statKey]}
				{@const active = isBuildingActive(statKey)}
				{@const activeSlot = buildingSlot(statKey)}
				<ActionCard
					icon={BUILDING_ICONS[statKey]}
					name={building.name}
					description={building.description}
					stat={statKey.replace(/_/g, ' ')}
					rate="+1 per tick"
					duration="{getDurationSec('training').toFixed(1)}s per tick"
					isActive={active}
					activeSlotLabel={activeSlot ? `Slot ${activeSlot.slotIndex + 1}` : undefined}
					activeDetail={activeSlot?.actionHeroId != null
						? `${heroName(activeSlot.actionHeroId)} +${formatStat(trainingValues[activeSlot.actionHeroId]?.[statKey] ?? 0)}`
						: undefined}
				>
					{#snippet actions()}
						{#if rosterHeroIds.length > 0}
							<div class="flex items-center gap-2">
								<select
									class="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
									bind:value={buildingHeroSelections[statKey]}
									disabled={active}
								>
									<option value="">— Select hero —</option>
									{#each rosterHeroIds as hid}
										<option value={String(hid)}>{heroName(hid)}</option>
									{/each}
								</select>
								<button
									class="shrink-0 rounded px-3 py-1.5 text-sm font-medium {active || !buildingHeroSelections[statKey]
										? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
										: 'bg-primary text-primary-foreground hover:opacity-90'}"
									disabled={active || !buildingHeroSelections[statKey]}
									onclick={() => {
										const hid = parseInt(buildingHeroSelections[statKey], 10);
										if (hid) {
											startTraining(hid, statKey);
											buildingHeroSelections[statKey] = '';
										}
									}}
								>
									Train
								</button>
							</div>
						{/if}
					{/snippet}
				</ActionCard>
			{/each}
		</div>
	</section>
		</div>

		<!-- Roster (same as Hero Tavern, with computed stats) -->
		<HeroRoster
			rosterHeroIds={rosterHeroIds}
			getHeroDef={getHeroDef}
			getAbilityDef={getAbilityDef}
			heroName={heroName}
			trainingValues={trainingValues}
			title="Your roster"
		/>
	</div>
</div>
