<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type {
		BattleState,
		HeroInstance,
		EnemyInstance,
		HeroDef,
		AbilityDef,
		CombatLogEntry,
		BattleDefsProvider
	} from '$lib/incremental/types';
	import { tick as battleTick } from '$lib/incremental/engine/battle-loop';
	import { getHeroDef, getEnemyDef, getAbilityDef } from '$lib/incremental/constants';
	import { getEnemySpriteConfig } from '$lib/incremental/constants/enemy-sprites';
	import { attackInterval, spellInterval } from '$lib/incremental/stats/formulas';
	import {
		HEAL_PERCENT_ON_WIN
	} from '$lib/incremental/constants';
	import BattleCard from '$lib/incremental/components/BattleCard.svelte';
	import StatusEffectBadge from '$lib/incremental/components/StatusEffectBadge.svelte';
	import type { SpellInfoAbility, SpellInfoActive } from '$lib/incremental/components/BattleCard.svelte';

	const runId = $derived($page.params.runId);
	/** When set, we entered from map without advancing; advance run only on win. */
	const nodeId = $derived($page.url.searchParams.get('nodeId'));
	const FOCUS_COOLDOWN_SEC = 2;
	const BASE_TICK_INTERVAL_MS = 150;
	const DELTA_TIME = 0.15;
	/** Fixed battle card widths */
	const HERO_CARD_W = 168;
	const ENEMY_CARD_W = 200;
	const BATTLE_LINEUP_GAP = 12;
	const BATTLE_LINEUP_WIDTH = 5 * Math.max(HERO_CARD_W, ENEMY_CARD_W) + 4 * BATTLE_LINEUP_GAP;

	let battle = $state<BattleState | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	/** Hero id -> localized name from DB */
	let heroNameById = $state<Map<number, string>>(new Map());
	/** Hero id -> def from API (for timer progress for all heroes) */
	let heroDefById = $state<Map<number, HeroDef>>(new Map());
	/** Ability id -> def from API (DB); fallback to constants in getSpellInfo */
	let abilityDefById = $state<Map<string, AbilityDef>>(new Map());
	/** Enemy sprite sheet metadata: enemyId -> metadata object */
	let enemySpriteMetadata = $state<Map<string, any>>(new Map());

	/** Battle controls: auto-rotate front liner (default off). */
	let autoRotateFrontLiner = $state(false);
	/** Tick speed multiplier: 0.25 (slow) to 4 (fast). 1 = default. */
	let tickSpeedMultiplier = $state(1);

	/** Combat log filters (default all enabled). */
	let logShowAutoAttacks = $state(true);
	let logShowSpells = $state(true);
	let logShowStatusEffects = $state(true);

	/** Defs provider for client-side tick() calls */
	const defsProvider: BattleDefsProvider = {
		getHeroDef: (heroId: number) => heroDefById.get(heroId) ?? getHeroDef(heroId),
		getAbilityDef: (abilityId: string) => abilityDefById.get(abilityId) ?? getAbilityDef(abilityId)
	};

	// Derived lists so each block reliably re-runs when battle state updates (fixes health bars not updating)
	const playerList = $derived(battle?.player ?? []);
	const enemyList = $derived(battle?.enemy ?? []);
	/** Index of the enemy front liner (first alive in lineup). -1 if none. */
	const enemyFrontLinerIndex = $derived(
		enemyList.length > 0 ? enemyList.findIndex((e) => e.currentHp > 0) : -1
	);

	/** Combat log: filtered by toggles, last 80, reversed so newest is on top. */
	const combatLogDisplay = $derived(
		(() => {
			const log = battle?.combatLog ?? [];
			const filtered = log.filter(
				(entry) =>
					entry.type === 'death' ||
					(entry.type === 'auto_attack' && logShowAutoAttacks) ||
					(entry.type === 'enemy_attack' && logShowAutoAttacks) ||
					(entry.type === 'spell' && logShowSpells) ||
					(entry.type === 'status_effect' && logShowStatusEffects) ||
					(entry.type === 'return_damage' && (logShowAutoAttacks || logShowSpells))
			);
			return filtered.slice(-80).slice().reverse();
		})()
	);

	const tickIntervalMs = $derived(Math.max(20, Math.round(BASE_TICK_INTERVAL_MS / tickSpeedMultiplier)));

	/** sessionStorage key for this run's battle data */
	function storageKey(): string {
		return `battle:${runId}`;
	}

	/** Save battle state + defs to sessionStorage for refresh survival */
	function saveBattleToStorage() {
		if (!battle) return;
		try {
			const data = {
				battleState: battle,
				heroDefs: Object.fromEntries(heroDefById),
				abilityDefs: Object.fromEntries(abilityDefById)
			};
			sessionStorage.setItem(storageKey(), JSON.stringify(data));
		} catch {
			// storage full or unavailable; non-critical
		}
	}

	/** Load battle state + defs from sessionStorage */
	function loadBattleFromStorage(): boolean {
		try {
			const raw = sessionStorage.getItem(storageKey());
			if (!raw) return false;
			const data = JSON.parse(raw);
			if (!data.battleState) return false;
			battle = data.battleState;
			if (data.heroDefs) {
				heroDefById = new Map(Object.entries(data.heroDefs).map(([k, v]) => [Number(k), v as HeroDef]));
			}
			if (data.abilityDefs) {
				abilityDefById = new Map(Object.entries(data.abilityDefs) as [string, AbilityDef][]);
			}
			return true;
		} catch {
			return false;
		}
	}

	/** Clear sessionStorage entry for this battle */
	function clearBattleStorage() {
		try {
			sessionStorage.removeItem(storageKey());
		} catch {
			// ignore
		}
	}

	/** Call POST /battle/enter to get initial state (fallback if sessionStorage empty) */
	async function fetchBattleFromServer(): Promise<boolean> {
		if (!nodeId) {
			error = 'No nodeId to enter battle';
			return false;
		}
		try {
			const res = await fetch(`/api/incremental/runs/${runId}/battle/enter`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nextNodeId: nodeId })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				error = data.message || res.statusText || 'Enter battle failed';
				return false;
			}
			const data = await res.json();
			battle = data.battleState;
			if (data.heroDefs) {
				heroDefById = new Map(Object.entries(data.heroDefs).map(([k, v]) => [Number(k), v as HeroDef]));
			}
			if (data.abilityDefs) {
				abilityDefById = new Map(Object.entries(data.abilityDefs) as [string, AbilityDef][]);
			}
			// Save to sessionStorage so refresh works
			saveBattleToStorage();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Enter battle failed';
			return false;
		}
	}

	function heroDisplayName(heroId: number): string {
		return heroNameById.get(heroId) ?? `Hero ${heroId}`;
	}

	function getDef(heroId: number): HeroDef | undefined {
		return heroDefById.get(heroId) ?? getHeroDef(heroId);
	}

	function frontLinerCooldownRemaining(): number {
		if (!battle) return 0;
		const elapsed = battle.elapsedTime - battle.lastFocusChangeAt;
		return Math.max(0, FOCUS_COOLDOWN_SEC - elapsed);
	}

	function canChangeFrontLiner(): boolean {
		return frontLinerCooldownRemaining() <= 0;
	}

	function attackProgress(hero: HeroInstance): number {
		const def = getDef(hero.heroId);
		if (!def) return 0;
		const max = attackInterval(def.baseAttackInterval, 0);
		return max > 0 ? Math.min(1, hero.attackTimer / max) : 0;
	}

	function spellProgress(hero: HeroInstance): number {
		const def = getDef(hero.heroId);
		if (!def || def.baseSpellInterval == null) return 0;
		const max = spellInterval(def.baseSpellInterval, 0);
		return max > 0 ? Math.min(1, hero.spellTimer / max) : 0;
	}

	function attackIntervalSec(hero: HeroInstance): number {
		const def = getDef(hero.heroId);
		return def ? attackInterval(def.baseAttackInterval, 0) : 0;
	}

	function spellIntervalSec(hero: HeroInstance): number | null {
		const def = getDef(hero.heroId);
		if (!def || def.baseSpellInterval == null) return null;
		return spellInterval(def.baseSpellInterval, 0);
	}

	function enemyName(defId: string): string {
		return getEnemyDef(defId)?.name ?? defId;
	}

	/** Humanize ability id for display (e.g. laguna_blade → Laguna Blade). */
	function abilityDisplayName(abilityId: string): string {
		return abilityId
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(' ');
	}

	/** Resolve ability def: DB first (from heroes API), then constants. */
	function getAbilityDefForSpell(abilityId: string): AbilityDef | undefined {
		return abilityDefById.get(abilityId) ?? getAbilityDef(abilityId);
	}

	/** Build spell info for a hero (abilities list + active spell on timer). Uses DB abilities when available.
	 *  heroIndex: slot in battle.player; used with lastSpellAbilityIndexByPlayer so the "next spell" tick moves with rotation. */
	function getSpellInfo(hero: HeroInstance, heroIndex?: number): { abilities: SpellInfoAbility[]; active?: SpellInfoActive } | undefined {
		const def = getDef(hero.heroId);
		if (!def?.abilityIds?.length) return undefined;
		const abilities: SpellInfoAbility[] = [];
		for (const id of def.abilityIds) {
			const a = getAbilityDefForSpell(id);
			if (!a) continue;
			abilities.push({
				id: a.id,
				displayName: a.abilityName ?? abilityDisplayName(a.id),
				type: a.type,
				damageType: a.damageType,
				baseDamage: a.baseDamage,
				effect: a.effect,
				returnDamageRatio: a.returnDamageRatio,
				description: a.description
			});
		}
		if (abilities.length === 0) return undefined;
		const intervalSec = spellIntervalSec(hero);
		if (intervalSec != null && intervalSec > 0) {
			const max = spellInterval(def.baseSpellInterval!, 0);
			const progress = max > 0 ? Math.min(1, hero.spellTimer / max) : 0;
			// Rotatable = active + timer (same as resolution engine); pick the one currently charging (next to cast)
			const rotatableIds = def.abilityIds.filter(
				(id) => getAbilityDefForSpell(id)?.type === 'active' && getAbilityDefForSpell(id)?.trigger === 'timer'
			);
			const lastCastIndex =
				heroIndex != null && battle?.lastSpellAbilityIndexByPlayer?.[heroIndex] != null
					? battle.lastSpellAbilityIndexByPlayer[heroIndex]
					: hero.lastCastAbilityIndex ?? -1;
			const nextIndex = rotatableIds.length > 0 ? (lastCastIndex + 1) % rotatableIds.length : 0;
			const activeAbilityId = rotatableIds[nextIndex];
			const activeAb = activeAbilityId ? getAbilityDefForSpell(activeAbilityId) : undefined;
			if (activeAb) {
				return {
					abilities,
					active: {
						abilityId: activeAb.id,
						displayName: activeAb.abilityName ?? abilityDisplayName(activeAb.id),
						damageType: activeAb.damageType,
						baseDamage: activeAb.baseDamage,
						intervalSec,
						timer: hero.spellTimer,
						progress
					}
				};
			}
		}
		return { abilities };
	}

	/** Structured parts for one combat log line (for colored display). Includes resistance breakdown when available. */
	function getLogParts(entry: CombatLogEntry): {
		time: string;
		attacker: string;
		target: string;
		action: string;
		damage: string;
		resistanceDetail: string;
		statusEffect?: string;
		/** true = hero (blue), false = enemy (red). Undefined when no attacker. */
		attackerFriendly?: boolean;
		/** true = hero (blue), false = enemy (red). */
		targetFriendly?: boolean;
	} {
		const time = `[${entry.time.toFixed(1)}s]`;
		let attacker = '';
		let target = '';
		let action = '';
		let damage = '';
		let resistanceDetail = '';
		let statusEffect: string | undefined;
		let attackerFriendly: boolean | undefined;
		let targetFriendly: boolean | undefined;
		const d = entry.damage ?? 0;
		const dtype = entry.damageType ?? 'physical';
		const raw = entry.rawDamage;
		const armor = entry.targetArmor;
		const mr = entry.targetMagicResist;

		if (entry.type === 'auto_attack') {
			attacker = heroDisplayName(entry.attackerHeroId ?? 0);
			target = enemyName(entry.targetEnemyDefId ?? '');
			attackerFriendly = true;
			targetFriendly = false;
			action = 'auto-attack';
			damage = `${d} ${dtype}`;
		} else if (entry.type === 'spell') {
			attacker = heroDisplayName(entry.attackerHeroId ?? 0);
			target = enemyName(entry.targetEnemyDefId ?? '');
			attackerFriendly = true;
			targetFriendly = false;
			action = entry.abilityId ?? 'spell';
			damage = `${d} ${dtype}`;
		} else if (entry.type === 'enemy_attack') {
			attacker = enemyName(entry.attackerEnemyDefId ?? '');
			target = heroDisplayName(entry.targetHeroId ?? 0);
			attackerFriendly = false;
			targetFriendly = true;
			action = '→ Front Liner';
			damage = `${d} physical`;
		} else if (entry.type === 'return_damage') {
			attacker = heroDisplayName(entry.attackerHeroId ?? 0);
			target = enemyName(entry.targetEnemyDefId ?? '');
			attackerFriendly = true;
			targetFriendly = false;
			action = 'return';
			damage = `${d} ${dtype}`;
		} else if (entry.type === 'status_effect') {
			attacker = entry.attackerHeroId != null
				? heroDisplayName(entry.attackerHeroId)
				: entry.attackerEnemyDefId != null
					? enemyName(entry.attackerEnemyDefId)
					: '';
			target = entry.targetHeroId != null
				? heroDisplayName(entry.targetHeroId)
				: entry.targetEnemyDefId != null
					? enemyName(entry.targetEnemyDefId)
					: '';
			attackerFriendly = entry.attackerHeroId != null ? true : entry.attackerEnemyDefId != null ? false : undefined;
			targetFriendly = entry.targetHeroId != null ? true : entry.targetEnemyDefId != null ? false : undefined;
			action = entry.statusEffectId ?? 'status effect';
			statusEffect = entry.statusEffectId;
		} else if (entry.type === 'death') {
			target = entry.deathTarget === 'hero' ? 'Hero' : 'Enemy';
			targetFriendly = entry.deathTarget === 'hero';
			action = 'died';
		}

		if (raw != null && (armor != null || mr != null)) {
			if (dtype === 'physical' && armor != null) {
				resistanceDetail = ` (${raw} raw, armor ${armor})`;
			} else if (dtype === 'magical' && mr != null) {
				resistanceDetail = ` (${raw} raw, ${Math.round(mr * 100)}% MR)`;
			} else if (dtype === 'pure') {
				resistanceDetail = ` (${raw} raw, no reduction)`;
			} else if (armor != null) {
				resistanceDetail = ` (${raw} raw, armor ${armor})`;
			}
		}
		return { time, attacker, target, action, damage, resistanceDetail, statusEffect, attackerFriendly, targetFriendly };
	}

	/** Load sprite sheet metadata for enemies in the current battle */
	async function loadEnemySpriteSheets() {
		if (!battle) return;
		const enemyIds = new Set(battle.enemy.map(e => e.enemyDefId));
		for (const enemyId of enemyIds) {
			const config = getEnemySpriteConfig(enemyId);
			if (config?.spriteSheetMetadataPath && !enemySpriteMetadata.has(enemyId)) {
				try {
					const res = await fetch(config.spriteSheetMetadataPath);
					if (res.ok) {
						const metadata = await res.json();
						enemySpriteMetadata.set(enemyId, metadata);
					}
				} catch {
					// ignore
				}
			}
		}
	}

	/** Run one client-side tick */
	function onTick() {
		if (!battle || battle.result !== null) return;
		battle = battleTick(battle, DELTA_TIME, {
			autoRotateFrontLiner: autoRotateFrontLiner
		}, defsProvider);
	}

	function onResetHp() {
		if (!battle || battle.result !== null) return;
		battle = {
			...battle,
			player: battle.player.map((p) => ({ ...p, currentHp: p.maxHp })),
			enemy: battle.enemy.map((e) => ({ ...e, currentHp: e.maxHp }))
		};
	}

	function onHeroClick(index: number) {
		if (!battle || battle.result !== null) return;
		if (!canChangeFrontLiner()) return;
		if (index === battle.focusedHeroIndex) return;
		const hero = battle.player[index];
		if (!hero || hero.currentHp <= 0) return;
		// Apply focus change through tick with deltaTime 0
		battle = battleTick(battle, 0, { focusChange: index }, defsProvider);
	}

	function onEnemyClick(index: number) {
		if (!battle || battle.result !== null) return;
		if (index === battle.targetIndex) return;
		const enemy = battle.enemy[index];
		if (!enemy || enemy.currentHp <= 0) return;
		// Apply target change through tick with deltaTime 0
		battle = battleTick(battle, 0, { targetChange: index }, defsProvider);
	}

	/** On victory: send result to server (advance run, apply rewards), then go to map. */
	async function onContinueAfterWin() {
		if (!battle || !nodeId) return;
		try {
			// Compute healed HP
			const healed = battle.player.map((p) => {
				const heal = p.maxHp * HEAL_PERCENT_ON_WIN;
				return Math.min(p.currentHp + heal, p.maxHp);
			});
			const playerHeroIds = battle.player.map((p) => p.heroId);

			const res = await fetch(`/api/incremental/runs/${runId}/battle/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nodeId,
					result: 'win',
					elapsedTime: battle.elapsedTime,
					heroHp: healed,
					playerHeroIds
				})
			});
			clearBattleStorage();
			if (res.ok) {
				await goto(`/darkrift/dungeon/${runId}`);
				return;
			}
			const data = await res.json().catch(() => ({}));
			error = data.message || res.statusText || 'Complete failed';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Complete failed';
		}
	}

	/** On defeat: notify server, then go to map. */
	async function onContinueAfterLoss() {
		if (!nodeId) {
			clearBattleStorage();
			await goto(`/darkrift/dungeon/${runId}`);
			return;
		}
		try {
			await fetch(`/api/incremental/runs/${runId}/battle/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nodeId, result: 'lose' })
			});
		} catch {
			// best-effort
		}
		clearBattleStorage();
		await goto(`/darkrift/dungeon/${runId}`);
	}

	// Only re-run when we should be ticking (active battle) or speed changes — not when battle object reference changes each tick
	const battleActive = $derived(!loading && battle != null && battle.result === null);
	const tickSpeed = $derived(tickSpeedMultiplier);

	// Save to sessionStorage periodically (every ~1s worth of ticks)
	let ticksSinceSave = 0;
	const SAVE_EVERY_N_TICKS = 7; // ~1s at 150ms ticks

	$effect(() => {
		if (!battleActive) return;
		const intervalMs = Math.max(20, Math.round(BASE_TICK_INTERVAL_MS / tickSpeed));
		const id = setInterval(() => {
			if (battle?.result !== null) return;
			onTick();
			ticksSinceSave++;
			if (ticksSinceSave >= SAVE_EVERY_N_TICKS) {
				saveBattleToStorage();
				ticksSinceSave = 0;
			}
		}, intervalMs);
		return () => clearInterval(id);
	});

	// Save when battle ends (win/lose)
	$effect(() => {
		if (battle?.result !== null && battle?.result !== undefined) {
			saveBattleToStorage();
		}
	});

	onMount(async () => {
		// Load hero names from API (for display names)
		try {
			const heroesRes = await fetch('/api/incremental/heroes');
			if (heroesRes.ok) {
				const data = await heroesRes.json();
				const names = (data.heroNames ?? []) as Array<{ heroId: number; localizedName: string }>;
				heroNameById = new Map(names.map((n) => [n.heroId, n.localizedName]));
				// Only set heroDefById/abilityDefById from API if not already loaded from sessionStorage
				if (heroDefById.size === 0) {
					const heroes = (data.heroes ?? []) as HeroDef[];
					heroDefById = new Map(heroes.map((h) => [h.heroId, h]));
				}
				if (abilityDefById.size === 0) {
					const abDefs = (data.abilityDefs ?? {}) as Record<string, AbilityDef>;
					abilityDefById = new Map(Object.entries(abDefs));
				}
			}
		} catch {
			// keep empty maps
		}

		// Try loading battle from sessionStorage first (instant, survives refresh)
		const loaded = loadBattleFromStorage();
		if (!loaded) {
			// Fallback: fetch from server (creates the encounter)
			await fetchBattleFromServer();
		}

		if (battle) {
			await loadEnemySpriteSheets();
		}

		loading = false;
	});

	onDestroy(() => {
		// Save final state on unmount
		saveBattleToStorage();
	});
</script>

<div class="w-full max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading battle…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
		<a href="/darkrift/dungeon/{runId}" class="inline-block mt-2 text-sm text-primary hover:underline"
			>← Back to run</a
		>
	{:else if battle}
		{#if battle.result !== null}
			<section
				class="rounded-lg border-2 p-6 text-center {battle.result === 'win'
					? 'border-green-500 bg-green-50 dark:bg-green-900/20'
					: 'border-red-500 bg-red-50 dark:bg-red-900/20'}"
			>
				<p class="text-xl font-semibold {battle.result === 'win' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
					{battle.result === 'win' ? 'Victory!' : 'Defeat'}
				</p>
				{#if battle.result === 'win'}
					<button
						type="button"
						class="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
						onclick={onContinueAfterWin}
					>
						Continue
					</button>
				{:else}
					<button
						type="button"
						class="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
						onclick={onContinueAfterLoss}
					>
						Continue
					</button>
				{/if}
			</section>
		{:else}
			<!-- Top bar: battle controls (full width), Flee right -->
			<header
				class="flex flex-wrap items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 w-full"
			>
				<div class="flex flex-wrap items-center gap-3 min-w-0">
					<label class="flex items-center gap-2 cursor-pointer shrink-0">
						<input
							type="checkbox"
							bind:checked={autoRotateFrontLiner}
							class="rounded border-gray-400 text-primary focus:ring-primary"
						/>
						<span class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Auto-rotate Front Liner</span>
					</label>
					{#if !canChangeFrontLiner()}
						<span class="text-xs text-amber-600 dark:text-amber-400 shrink-0">
							Cooldown: {frontLinerCooldownRemaining().toFixed(1)}s
						</span>
					{/if}
					<button
						type="button"
						class="rounded bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 text-sm shrink-0"
						onclick={onResetHp}
						title="Set all heroes and enemies to full HP (testing)"
					>
						Reset HP
					</button>
					<button
						type="button"
						class="rounded bg-gray-200 dark:bg-gray-700 px-2 py-1 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0"
						onclick={onTick}
					>
						Tick once
					</button>
					<div class="flex items-center gap-2 shrink-0">
						<label for="tick-speed-{runId}" class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Speed</label>
						<input
							id="tick-speed-{runId}"
							type="range"
							min="0.25"
							max="4"
							step="0.25"
							value={tickSpeedMultiplier}
							oninput={(e) => (tickSpeedMultiplier = Number((e.target as HTMLInputElement).value))}
							class="w-20 accent-primary"
						/>
						<span class="text-sm text-gray-600 dark:text-gray-400 w-8">{tickSpeedMultiplier}×</span>
					</div>
				</div>
				<a
					href="/darkrift/dungeon/{runId}"
					class="rounded bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm font-medium shrink-0 ml-auto"
				>
					Flee to Map
				</a>
			</header>

			<div class="flex flex-col lg:flex-row lg:gap-8 gap-6">
				<!-- Main: lineups + tip (stacks on small) -->
				<div class="flex flex-col gap-6 min-w-0 flex-1">
					<!-- Your heroes: always 5 slots -->
					<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
						<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Your heroes</h2>
						<div class="flex flex-wrap justify-center gap-3">
							{#each playerList as hero, slotIndex}
								{@const isFrontLiner = battle && slotIndex === battle.focusedHeroIndex}
								{@const def = getDef(hero.heroId)}
								<div class="flex flex-col items-center shadow-md">
									<!-- Fixed-height slot for status effects so the card doesn't move -->
									<div class="min-h-[52px] flex flex-wrap justify-center items-center gap-1.5 mb-2 w-full">
										{#each hero.buffs ?? [] as buff}
											<StatusEffectBadge buff={buff} size={36} />
										{/each}
									</div>
									<BattleCard
										kind="hero"
										displayName={heroDisplayName(hero.heroId)}
										currentHp={Math.max(0, hero.currentHp)}
										maxHp={hero.maxHp}
										armor={def?.baseArmor ?? 0}
										magicResist={def?.baseMagicResist ?? 0}
										selected={isFrontLiner}
										selectedClass="border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
										disabled={!canChangeFrontLiner()}
										onclick={() => onHeroClick(slotIndex)}
										heroId={hero.heroId}
										attackDamage={def?.baseAttackDamage ?? 0}
										attackIntervalSec={attackIntervalSec(hero)}
										spellIntervalSec={spellIntervalSec(hero)}
										attackTimer={hero.attackTimer}
										spellTimer={hero.spellTimer}
										attackProgress={attackProgress(hero)}
										spellProgress={spellProgress(hero)}
										spellInfo={getSpellInfo(hero, slotIndex)}
										buffs={hero.buffs ?? []}
									/>
								</div>
							{/each}
						</div>
						<p class="mt-2 text-xs text-gray-500">Tap a hero to set Front Liner. All attack Target; only Front Liner casts spells.</p>
					</section>

					<!-- Enemies: flex layout that wraps, no horizontal scroll -->
					<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
						<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Enemies — Front (amber) · Target (red) · tap to set Target</h2>
						<div class="flex flex-wrap justify-center gap-3">
							{#each enemyList as enemy, enemyIndex}
								{@const isTarget = battle && enemyIndex === battle.targetIndex}
								{@const isFrontLiner = enemyFrontLinerIndex >= 0 && enemyIndex === enemyFrontLinerIndex}
								{@const edef = getEnemyDef(enemy.enemyDefId)}
									{@const spriteConfig = getEnemySpriteConfig(enemy.enemyDefId)}
									{@const spriteMetadata = enemySpriteMetadata.get(enemy.enemyDefId)}
								<div class="flex flex-col items-center shadow-md">
									<!-- Fixed-height slot for status effects so the card doesn't move -->
									<div class="min-h-[52px] flex flex-wrap justify-center items-center gap-1.5 mb-2 w-full">
										{#each enemy.buffs ?? [] as buff}
											<StatusEffectBadge buff={buff} size={36} />
										{/each}
									</div>
									<BattleCard
										kind="enemy"
										displayName={edef?.name ?? enemy.enemyDefId}
										currentHp={Math.max(0, enemy.currentHp)}
										maxHp={enemy.maxHp}
										armor={edef?.baseArmor ?? 0}
										magicResist={edef?.baseMagicResist ?? 0}
										selected={isTarget}
										selectedClass="border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
										frontLiner={isFrontLiner}
										frontLinerClass="border-l-4 border-l-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.35)]"
										onclick={() => onEnemyClick(enemyIndex)}
										enemyAttackDamage={edef?.damage ?? 0}
										enemyAttackInterval={edef?.attackInterval ?? 1}
										enemyAttackTimer={enemy.attackTimer}
										enemyAttackProgress={edef && edef.attackInterval > 0 ? Math.min(1, enemy.attackTimer / edef.attackInterval) : 0}
										buffs={enemy.buffs ?? []}
										spriteSheetSrc={spriteConfig?.spriteSheetSrc}
										spriteSheetMetadata={spriteMetadata}
										staticImageSrc={spriteConfig?.staticImageSrc}
									/>
								</div>
							{/each}
						</div>
					</section>

					<p class="text-sm text-gray-500 dark:text-gray-400">
						<strong class="text-amber-500">Front</strong> = enemy front liner (first in lineup); full damage only on them.
						<strong class="text-red-500"> Target</strong> = who your team attacks. Tap an enemy to set Target.
					</p>
				</div>

				<!-- Right column: combat log (on large screens) -->
				<div class="lg:w-[360px] lg:min-w-[360px] lg:sticky lg:top-4 shrink-0">
					<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-900 text-gray-100 p-3">
						<h2 class="text-sm font-medium text-gray-400 mb-2">Combat log</h2>
						<div class="flex flex-wrap gap-2 mb-2">
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium transition-colors {logShowAutoAttacks
									? 'bg-amber-600/80 text-white'
									: 'bg-gray-700 text-gray-400 hover:bg-gray-600'}"
								onclick={() => (logShowAutoAttacks = !logShowAutoAttacks)}
							>
								Auto attacks
							</button>
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium transition-colors {logShowSpells
									? 'bg-violet-600/80 text-white'
									: 'bg-gray-700 text-gray-400 hover:bg-gray-600'}"
								onclick={() => (logShowSpells = !logShowSpells)}
							>
								Spells
							</button>
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium transition-colors {logShowStatusEffects
									? 'bg-purple-600/80 text-white'
									: 'bg-gray-700 text-gray-400 hover:bg-gray-600'}"
								onclick={() => (logShowStatusEffects = !logShowStatusEffects)}
							>
								Status Effects
							</button>
						</div>
						<div class="max-h-48 lg:max-h-[420px] overflow-y-auto font-mono text-xs space-y-0.5">
							<div class="flex flex-col">
								{#each combatLogDisplay as entry}
									{@const parts = getLogParts(entry)}
									{@const isSpell = entry.type === 'spell'}
									{@const isStatusEffect = entry.type === 'status_effect'}
									{@const isDeath = entry.type === 'death'}
									<div
										class="flex flex-wrap gap-x-1 items-baseline py-0.5 border-l-2 {isSpell
											? 'border-violet-500/60'
											: isStatusEffect
												? 'border-purple-500/60'
												: isDeath
													? 'border-red-500/60'
													: 'border-transparent'}"
									>
										<span class="text-gray-500 shrink-0">{parts.time}</span>
										<span class="font-semibold {parts.attackerFriendly === true ? 'text-blue-400' : parts.attackerFriendly === false ? 'text-red-400' : 'text-gray-400'}">{parts.attacker}</span>
										<span class="text-gray-500">→</span>
										<span class="font-semibold {parts.targetFriendly === true ? 'text-blue-400' : parts.targetFriendly === false ? 'text-red-400' : 'text-gray-400'}">{parts.target}</span>
										<span class="text-gray-500">:</span>
										{#if isStatusEffect}
											<span class="text-purple-400 font-semibold inline-flex items-center gap-1"><span class="gi w-3 h-3 text-purple-400" style="--gi: url(/game-icons/ffffff/transparent/1x1/lorc/power-lightning.svg)"></span> {parts.statusEffect?.replace(/_/g, ' ') ?? parts.action}</span>
											{#if entry.statusEffectDuration != null}
												<span class="text-purple-300">({entry.statusEffectDuration.toFixed(1)}s)</span>
											{/if}
										{:else if isDeath}
											<span class="text-red-400 font-semibold">{parts.action}</span>
										{:else}
											<span class="{isSpell ? 'text-violet-400' : 'text-amber-400'}">{parts.action}</span>
											{#if parts.damage}
												<span class="text-emerald-300">{parts.damage} dmg{parts.resistanceDetail}</span>
											{/if}
										{/if}
									</div>
								{/each}
							</div>
							{#if !combatLogDisplay.length}
								<p class="text-gray-500 italic py-2">No actions yet.</p>
							{/if}
						</div>
					</section>
				</div>
			</div>
		{/if}

		<p class="text-sm text-gray-500 dark:text-gray-400">
			<a href="/darkrift/dungeon/{runId}" class="text-primary hover:underline">← Back to run</a>
			·
			<a href="/darkrift/lineup" class="text-primary hover:underline">Lineups</a>
		</p>
	{/if}
</div>
