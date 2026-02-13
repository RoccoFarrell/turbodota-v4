<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import { getEncounterDef, getEnemyDef } from '$lib/incremental/constants';
	import { getEnemySpriteConfig } from '$lib/incremental/constants/enemy-sprites';
	// Kept only to satisfy any cached chunk that still referenced it (can remove after hard refresh)
	import questBoardImg from '$lib/assets/questBoard.png';
	void questBoardImg;
	import { getContext } from 'svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import LineupCard from '$lib/incremental/components/LineupCard.svelte';
	import BattleCard from '$lib/incremental/components/BattleCard.svelte';

	const runId = $derived($page.params.runId);
	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];
	function getHeroName(heroId: number): string {
		return layoutHeroes.find((h) => h.id === heroId)?.localized_name ?? `Hero ${heroId}`;
	}

	type NodeClearanceShape = {
		outcome: string;
		durationSeconds?: number;
		gold?: number;
		[key: string]: unknown;
	};

	type RunStateShape = {
		runId: string;
		status: string;
		currentNodeId: string;
		currentNodeType?: string;
		nextNodeIds: string[];
		nodeClearances?: Record<string, NodeClearanceShape>;
	};

	type MapNodeShape = {
		id: string;
		nodeType: string;
		encounterId: string | null;
		nextNodeIds: string[];
	};

	type LineupForEdit = {
		lineupId: string;
		heroIds: number[];
		heroHp: number[] | null;
	};

	/** Hero/ability defs from DB for LineupCard HP and display */
	let heroDefsFromApi = $state<{ heroes: HeroDef[]; abilityDefs: Record<string, AbilityDef> }>({ heroes: [], abilityDefs: {} });
	let runState = $state<RunStateShape | null>(null);
	let pathNodes = $state<MapNodeShape[]>([]);
	let lineup = $state<LineupForEdit | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let advancingNodeId = $state<string | null>(null);
	let healedMessage = $state(false);
	/** Enemy id -> sprite sheet metadata for encounter previews */
	let enemySpriteMetadata = $state<Map<string, unknown>>(new Map());
	/** Node id -> expanded (cleared encounters default collapsed) */
	let expandedNodes = $state<Record<string, boolean>>({});

	const heroByIdForRun = $derived(new Map(heroDefsFromApi.heroes.map((h) => [h.heroId, h])));
	/** Getters for LineupCard so it always sees current hero/ability defs from API */
	const runDefGetters = $derived({
		getHeroDef: (heroId: number): HeroDef | undefined => heroByIdForRun.get(heroId),
		getAbilityDef: (abilityId: string): AbilityDef | undefined => heroDefsFromApi.abilityDefs[abilityId]
	});

	function buildPathOrder(nodes: MapNodeShape[]): MapNodeShape[] {
		if (nodes.length === 0) return [];
		const byId = new Map(nodes.map((n) => [n.id, n]));
		const isReferred = new Set<string>();
		for (const n of nodes) {
			for (const nextId of n.nextNodeIds) isReferred.add(nextId);
		}
		const start = nodes.find((n) => !isReferred.has(n.id)) ?? nodes[0];
		const path: MapNodeShape[] = [start];
		let current = start;
		while (current.nextNodeIds.length > 0) {
			const nextId = current.nextNodeIds[0];
			const next = byId.get(nextId);
			if (!next) break;
			path.push(next);
			current = next;
		}
		return path;
	}

	/** Load sprite sheet metadata for all encounter enemies in the path */
	async function loadEnemySpriteMetadata() {
		const encounterIds = new Set(
			pathNodes.filter((n) => n.encounterId).map((n) => n.encounterId as string)
		);
		const enemyIds = new Set<string>();
		for (const eid of encounterIds) {
			const enc = getEncounterDef(eid);
			if (enc) for (const e of enc.enemies) enemyIds.add(e.enemyDefId);
		}
		for (const enemyId of enemyIds) {
			const config = getEnemySpriteConfig(enemyId);
			if (config?.spriteSheetMetadataPath && !enemySpriteMetadata.has(enemyId)) {
				try {
					const res = await fetch(config.spriteSheetMetadataPath);
					if (res.ok) {
						const metadata = await res.json();
						enemySpriteMetadata = new Map(enemySpriteMetadata).set(enemyId, metadata);
					}
				} catch {
					// ignore
				}
			}
		}
	}

	async function loadRun() {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/incremental/runs/${runId}/map`, { cache: 'no-store' });
			if (!res.ok) {
				if (res.status === 404) error = 'Run not found';
				else error = res.statusText || 'Failed to load run';
				runState = null;
				pathNodes = [];
				lineup = null;
				return;
			}
			const data = await res.json();
			runState = data.runState ?? null;
			const nodes: MapNodeShape[] = data.nodes ?? [];
			pathNodes = buildPathOrder(nodes);
			lineup = data.lineup ?? null;
			// Cleared encounters start collapsed every time we load the map
			expandedNodes = {};
			await loadEnemySpriteMetadata();
			// Load hero defs from DB for LineupCard (HP bar, etc.)
			const heroesRes = await fetch('/api/incremental/heroes');
			if (heroesRes.ok) {
				const heroesData = await heroesRes.json();
				heroDefsFromApi = { heroes: heroesData.heroes ?? [], abilityDefs: heroesData.abilityDefs ?? {} };
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load run';
			runState = null;
			pathNodes = [];
			lineup = null;
		} finally {
			loading = false;
		}
	}

	function isEncounterNode(nodeType: string): boolean {
		return nodeType === 'COMBAT' || nodeType === 'ELITE' || nodeType === 'BOSS';
	}

	async function chooseNextNode(nextNodeId: string) {
		if (advancingNodeId) return;
		advancingNodeId = nextNodeId;
		error = null;
		healedMessage = false;
		try {
			const node = pathNodes.find((n) => n.id === nextNodeId);
			const enterBattle = node && isEncounterNode(node.nodeType);

			if (enterBattle) {
				// Enter battle without advancing run; advance only on win. User can leave anytime.
				const res = await fetch(`/api/incremental/runs/${runId}/battle/enter`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nextNodeId })
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					error = data.message || res.statusText || 'Enter battle failed';
					return;
				}
				await goto(`/incremental/run/${runId}/battle?nodeId=${encodeURIComponent(nextNodeId)}`);
				return;
			}

			// Non-encounter node (e.g. base): advance run
			const res = await fetch(`/api/incremental/runs/${runId}/advance`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nextNodeId })
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				error = data.message || res.statusText || 'Advance failed';
				return;
			}

			if (data.runState) {
				runState = data.runState;
				if (data.runState.currentNodeType === 'BASE') {
					healedMessage = true;
					toaster.success({ title: 'Healed!' });
				}
				const mapRes = await fetch(`/api/incremental/runs/${runId}/map`);
				if (mapRes.ok) {
					const mapData = await mapRes.json();
					pathNodes = buildPathOrder(mapData.nodes ?? []);
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed';
		} finally {
			advancingNodeId = null;
		}
	}

	function nodeTypeLabel(type: string): string {
		if (!type) return '?';
		return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	}

	function isEnemyNode(nodeType: string): boolean {
		return nodeType === 'COMBAT' || nodeType === 'ELITE' || nodeType === 'BOSS';
	}

	/** Expand encounter into list of { enemyDefId, def, count } for preview BattleCards */
	function encounterPreviewEnemies(encounterId: string | null): Array<{ enemyDefId: string; def: ReturnType<typeof getEnemyDef>; count: number }> {
		if (!encounterId) return [];
		const enc = getEncounterDef(encounterId);
		if (!enc) return [];
		return enc.enemies.map(({ enemyDefId, count: c }) => ({
			enemyDefId,
			def: getEnemyDef(enemyDefId),
			count: c ?? 1
		}));
	}

	function clearanceLabel(clearance: NodeClearanceShape): string {
		const parts: string[] = [];
		if (clearance.outcome === 'victory') parts.push('Victory');
		else if (clearance.outcome === 'skip') parts.push('Skip');
		else parts.push(clearance.outcome);
		if (typeof clearance.durationSeconds === 'number') {
			parts.push(`${clearance.durationSeconds.toFixed(1)}s`);
		}
		if (typeof clearance.gold === 'number' && clearance.gold > 0) {
			parts.push(`+${clearance.gold} gold`);
		}
		return parts.join(' · ');
	}

	function nodeTypeIcon(nodeType: string): string {
		if (nodeType === 'COMBAT') return '⚔';
		if (nodeType === 'ELITE') return '★';
		if (nodeType === 'BOSS') return '👹';
		if (nodeType === 'BASE') return '♥';
		return '•';
	}

	function isClearedNode(node: MapNodeShape): boolean {
		// Node is cleared if it has a clearance record (victory/skip) — most reliable
		if (runState?.nodeClearances?.[node.id] != null) return true;
		// Otherwise treat as cleared if we're active and this node is neither current nor a next choice
		if (!runState?.status || runState.status.toLowerCase() !== 'active') return false;
		const isCurrent = runState.currentNodeId === node.id;
		const canGo = runState.nextNodeIds?.includes(node.id) ?? false;
		return !isCurrent && !canGo;
	}

	function isCurrentNode(node: MapNodeShape): boolean {
		return runState?.currentNodeId === node.id;
	}

	/** Cleared encounters default collapsed; current/next always expanded */
	function isNodeExpanded(node: MapNodeShape): boolean {
		if (!isClearedNode(node)) return true;
		return expandedNodes[node.id] ?? false;
	}

	function toggleNodeExpanded(nodeId: string) {
		expandedNodes = { ...expandedNodes, [nodeId]: !(expandedNodes[nodeId] ?? false) };
	}

	// Load run whenever we're on the map page (initial load and when navigating back from battle)
	$effect(() => {
		const path = $page.url.pathname;
		const rid = $page.params.runId;
		if (rid && path === `/incremental/run/${rid}`) {
			loadRun();
		}
	});
</script>

<div class="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Run – Map</h1>

	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading run…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
		<a href="/incremental/lineup" class="text-sm text-primary hover:underline">← Back to Lineups</a>
	{:else if runState}
		<!-- Timeline + encounter cards: gold timeline on left, cards on right -->
		<div class="flex flex-col">
			{#each pathNodes as node, i}
				{@const cleared = isClearedNode(node)}
				{@const isNext = runState.status?.toLowerCase() === 'active' && runState.nextNodeIds?.includes(node.id)}
				{@const canClick = isNext && !advancingNodeId}
				{@const isCurrent = isCurrentNode(node)}
				{@const previewEnemies = isEnemyNode(node.nodeType) ? encounterPreviewEnemies(node.encounterId) : []}
				{@const expanded = isNodeExpanded(node)}
				<div class="flex min-h-0">
					<!-- Gold timeline: line segment + circle with icon -->
					<div class="w-12 flex flex-col items-center shrink-0 py-0.5">
						{#if i > 0}
							<div class="w-0.5 flex-1 min-h-[10px] bg-amber-500/90 dark:bg-amber-400/80" aria-hidden="true"></div>
						{/if}
						<div
							class="rounded-full w-8 h-8 flex items-center justify-center shrink-0 border-2 {cleared
								? 'border-amber-600/80 dark:border-amber-500/80 bg-amber-500/20 dark:bg-amber-500/10'
								: isCurrent
									? 'border-amber-400 dark:border-amber-300 bg-amber-400/30 dark:bg-amber-300/20'
									: 'border-amber-500/70 dark:border-amber-400/70 bg-gray-100 dark:bg-gray-800'}"
							aria-hidden="true"
						>
							{#if cleared}
								<span class="text-amber-700 dark:text-amber-200 text-sm font-bold" aria-label="Completed">✓</span>
							{:else if isCurrent}
								<span class="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-label="Current encounter"></span>
							{:else}
								<span class="text-amber-600/80 dark:text-amber-400/80 text-xs">{nodeTypeIcon(node.nodeType)}</span>
							{/if}
						</div>
						{#if i < pathNodes.length - 1}
							<div class="w-0.5 flex-1 min-h-[10px] bg-amber-500/90 dark:bg-amber-400/80" aria-hidden="true"></div>
						{/if}
					</div>
					<!-- Card content -->
					<div class="flex-1 min-w-0 pl-3 pr-0 pb-4">
						{#if cleared}
							<!-- Cleared: expandable row -->
							<button
								type="button"
								class="w-full text-left rounded-xl border-2 p-3 flex flex-col sm:flex-row gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border-stone-500/60 dark:border-stone-600 bg-stone-100 dark:bg-stone-900/60 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 cursor-pointer"
								onclick={() => toggleNodeExpanded(node.id)}
							>
								<div class="flex flex-col gap-0.5 min-w-[120px] shrink-0">
									<div class="flex items-center gap-2">
										<span class="text-xl text-gray-600 dark:text-gray-400">{nodeTypeIcon(node.nodeType)}</span>
										<span class="font-semibold text-gray-800 dark:text-gray-200">{nodeTypeLabel(node.nodeType)}</span>
									</div>
									{#if runState.nodeClearances?.[node.id]}
										<span class="text-sm text-gray-600 dark:text-gray-400">{clearanceLabel(runState.nodeClearances[node.id])}</span>
									{/if}
								</div>
								{#if previewEnemies.length > 0}
									<!-- Condensed enemy summary when collapsed -->
									<div class="flex flex-wrap gap-2 items-center flex-1">
										{#each previewEnemies as { enemyDefId, def, count }}
											<span
												class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-stone-200 dark:bg-stone-700 text-gray-700 dark:text-gray-300"
											>
												{#if getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
													<img
														src={getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
														alt=""
														class="w-5 h-5 rounded bg-stone-600 object-cover shrink-0"
													/>
												{:else}
													<span class="w-5 h-5 rounded bg-stone-600 flex items-center justify-center text-[10px] font-bold text-stone-300 shrink-0">{(def?.name ?? enemyDefId).charAt(0)}</span>
												{/if}
												<span class="font-medium">{def?.name ?? enemyDefId}</span>
												<span class="text-gray-500 dark:text-gray-400">{def?.hp ?? 0} HP</span>
												{#if (count ?? 1) > 1}
													<span class="text-gray-500">×{count}</span>
												{/if}
											</span>
										{/each}
									</div>
								{/if}
								{#if previewEnemies.length > 0}
									<span class="shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true">{expanded ? '▼' : '▶'}</span>
								{/if}
							</button>
							{#if expanded && previewEnemies.length > 0}
								<!-- Expanded: full BattleCards -->
								<div class="mt-3 pl-0 flex flex-wrap gap-3">
									{#each previewEnemies as { enemyDefId, def, count }}
										{#each Array(count) as _}
											<div class="flex flex-col items-center shrink-0 shadow-md">
												<BattleCard
													kind="enemy"
													displayName={def?.name ?? enemyDefId}
													currentHp={def?.hp ?? 0}
													maxHp={def?.hp ?? 0}
													armor={def?.baseArmor ?? 0}
													magicResist={def?.baseMagicResist ?? 0}
													selected={false}
													selectedClass=""
													disabled={true}
													enemyAttackDamage={def?.damage ?? 0}
													enemyAttackInterval={def?.attackInterval ?? 1}
													enemyAttackTimer={0}
													enemyAttackProgress={0}
													buffs={[]}
													spriteSheetSrc={getEnemySpriteConfig(enemyDefId)?.spriteSheetSrc}
													spriteSheetMetadata={enemySpriteMetadata.get(enemyDefId) as any}
													staticImageSrc={getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
												/>
											</div>
										{/each}
									{/each}
								</div>
							{/if}
						{:else}
							<!-- Not cleared: full card, clickable if next -->
							<button
								type="button"
								class="w-full text-left rounded-xl border-2 p-4 flex flex-col sm:flex-row gap-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
									{canClick ? 'hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 cursor-pointer border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60' : 'cursor-default border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60'}
									{isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-(--background)' : ''}"
								disabled={!canClick}
								onclick={() => canClick && chooseNextNode(node.id)}
							>
								<div class="flex flex-col gap-1 min-w-[140px] shrink-0">
									<div class="flex items-center gap-2">
										<span
											class="text-2xl {node.nodeType === 'ELITE' ? 'text-amber-500' : node.nodeType === 'BOSS' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}"
											aria-hidden="true"
										>
											{nodeTypeIcon(node.nodeType)}
										</span>
										<span class="font-semibold text-gray-800 dark:text-gray-200">{nodeTypeLabel(node.nodeType)}</span>
									</div>
									{#if runState.nodeClearances?.[node.id]}
										<span class="text-sm text-gray-600 dark:text-gray-400">{clearanceLabel(runState.nodeClearances[node.id])}</span>
									{:else if isNext && isEnemyNode(node.nodeType)}
										<span class="text-sm text-amber-600 dark:text-amber-400">Tap to enter battle</span>
									{:else if isNext}
										<span class="text-sm text-primary">Tap to continue</span>
									{/if}
								</div>
								{#if previewEnemies.length > 0}
									<div class="flex flex-wrap gap-3 items-start flex-1 min-w-0">
										{#each previewEnemies as { enemyDefId, def, count }}
											{#each Array(count) as _}
												<div class="flex flex-col items-center shrink-0 shadow-md">
													<BattleCard
														kind="enemy"
														displayName={def?.name ?? enemyDefId}
														currentHp={def?.hp ?? 0}
														maxHp={def?.hp ?? 0}
														armor={def?.baseArmor ?? 0}
														magicResist={def?.baseMagicResist ?? 0}
														selected={false}
														selectedClass=""
														disabled={true}
														enemyAttackDamage={def?.damage ?? 0}
														enemyAttackInterval={def?.attackInterval ?? 1}
														enemyAttackTimer={0}
														enemyAttackProgress={0}
														buffs={[]}
														spriteSheetSrc={getEnemySpriteConfig(enemyDefId)?.spriteSheetSrc}
														spriteSheetMetadata={enemySpriteMetadata.get(enemyDefId) as any}
														staticImageSrc={getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
													/>
												</div>
											{/each}
										{/each}
									</div>
								{/if}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Lineup (reorder + heal) when run is active -->
		{#if runState.status?.toLowerCase() === 'active' && lineup && runId}
			<LineupCard
				name="Roster"
				lineupId={lineup.lineupId}
				heroIds={lineup.heroIds}
				getHeroName={getHeroName}
				variant="run"
				runId={runId}
				heroHp={lineup.heroHp}
				getHeroDef={runDefGetters.getHeroDef}
				getAbilityDef={runDefGetters.getAbilityDef}
				onUpdate={loadRun}
			/>
		{/if}

		<!-- Status and choices summary -->
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				<strong>Status:</strong> {runState.status}
			</p>
			{#if healedMessage}
				<p class="text-sm text-green-600 dark:text-green-400 font-medium">Healed!</p>
			{/if}
			{#if runState.status?.toLowerCase() !== 'active'}
				<p class="text-sm text-gray-600 dark:text-gray-300">This run has ended.</p>
			{:else if runState.nextNodeIds && runState.nextNodeIds.length > 0}
				<p class="text-sm text-gray-600 dark:text-gray-300">
					The next encounter is the only node available. Win the battle to unlock further nodes; leaving or losing does not advance the run.
				</p>
			{:else if pathNodes.length > 0}
				<p class="text-sm text-gray-600 dark:text-gray-300">No further nodes. Run complete.</p>
			{/if}
		</section>

		<p class="text-sm text-gray-500 dark:text-gray-400">
			<a href="/incremental/lineup" class="text-primary hover:underline">← Back to Lineups</a>
			·
			<a href="/incremental" class="text-primary hover:underline">Incremental</a>
		</p>
	{/if}
</div>
