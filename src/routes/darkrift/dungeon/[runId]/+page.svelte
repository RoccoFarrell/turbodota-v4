<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import { getEncounterDef, getEnemyDef } from '$lib/incremental/constants';
	import { getEnemySpriteConfig } from '$lib/incremental/constants/enemy-sprites';
	import { getContext } from 'svelte';
	import type { HeroDef, AbilityDef } from '$lib/incremental/types';
	import { formatLevelMultiplier, levelMultiplier, scaleEnemyStat } from '$lib/incremental/run/level-scaling';
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
		level?: number;
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

	let heroDefsFromApi = $state<{ heroes: HeroDef[]; abilityDefs: Record<string, AbilityDef> }>({ heroes: [], abilityDefs: {} });
	let runState = $state<RunStateShape | null>(null);
	let pathNodes = $state<MapNodeShape[]>([]);
	let lineup = $state<LineupForEdit | null>(null);
	let runLevel = $state(1);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let advancingNodeId = $state<string | null>(null);
	let healedMessage = $state(false);
	let enemySpriteMetadata = $state<Map<string, unknown>>(new Map());
	let expandedNodes = $state<Record<string, boolean>>({});

	const heroByIdForRun = $derived(new Map(heroDefsFromApi.heroes.map((h) => [h.heroId, h])));
	const runDefGetters = $derived({
		getHeroDef: (heroId: number): HeroDef | undefined => heroByIdForRun.get(heroId),
		getAbilityDef: (abilityId: string): AbilityDef | undefined => heroDefsFromApi.abilityDefs[abilityId]
	});

	const totalNodes = $derived(pathNodes.length);
	const clearedCount = $derived(
		pathNodes.filter((n) => isClearedNode(n)).length
	);
	const progressPercent = $derived(totalNodes > 0 ? Math.round((clearedCount / totalNodes) * 100) : 0);

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
			runLevel = data.level ?? runState?.level ?? 1;
			const nodes: MapNodeShape[] = data.nodes ?? [];
			pathNodes = buildPathOrder(nodes);
			lineup = data.lineup ?? null;
			expandedNodes = {};
			await loadEnemySpriteMetadata();
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
				await goto(`/darkrift/dungeon/${runId}/battle?nodeId=${encodeURIComponent(nextNodeId)}`);
				return;
			}

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
		if (type === 'COMBAT') return 'Combat';
		if (type === 'ELITE') return 'Elite';
		if (type === 'BOSS') return 'Boss';
		if (type === 'BASE') return 'Sanctuary';
		if (type === 'REST') return 'Entrance';
		return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	}

	function isEnemyNode(nodeType: string): boolean {
		return nodeType === 'COMBAT' || nodeType === 'ELITE' || nodeType === 'BOSS';
	}

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
			parts.push(`+${clearance.gold}g`);
		}
		return parts.join(' · ');
	}

	function nodeTypeIcon(nodeType: string): string {
		if (nodeType === 'COMBAT') return '\u2694';
		if (nodeType === 'ELITE') return '\u2605';
		if (nodeType === 'BOSS') return '\uD83D\uDC79';
		if (nodeType === 'BASE') return '\u2665';
		if (nodeType === 'REST') return '\uD83D\uDD2E';
		return '\u2022';
	}

	function nodeAccentColor(nodeType: string): string {
		if (nodeType === 'COMBAT') return 'violet';
		if (nodeType === 'ELITE') return 'amber';
		if (nodeType === 'BOSS') return 'red';
		if (nodeType === 'BASE') return 'emerald';
		if (nodeType === 'REST') return 'blue';
		return 'gray';
	}

	function isClearedNode(node: MapNodeShape): boolean {
		if (runState?.nodeClearances?.[node.id] != null) return true;
		if (!runState?.status || runState.status.toLowerCase() !== 'active') return false;
		const isCurrent = runState.currentNodeId === node.id;
		const canGo = runState.nextNodeIds?.includes(node.id) ?? false;
		return !isCurrent && !canGo;
	}

	function isCurrentNode(node: MapNodeShape): boolean {
		return runState?.currentNodeId === node.id;
	}

	function isNodeExpanded(node: MapNodeShape): boolean {
		if (!isClearedNode(node)) return true;
		return expandedNodes[node.id] ?? false;
	}

	function toggleNodeExpanded(nodeId: string) {
		expandedNodes = { ...expandedNodes, [nodeId]: !(expandedNodes[nodeId] ?? false) };
	}

	$effect(() => {
		const path = $page.url.pathname;
		const rid = $page.params.runId;
		if (rid && path === `/darkrift/dungeon/${rid}`) {
			loadRun();
		}
	});
</script>

<div class="min-h-full relative">
	<!-- Atmospheric background -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
		<div class="absolute inset-0 bg-gradient-to-b from-gray-950 via-violet-950/20 to-gray-950"></div>
		<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-violet-600/6 rounded-full blur-[100px]"></div>
	</div>

	<div class="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
		{#if loading}
			<div class="flex justify-center py-16">
				<div class="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-center space-y-3">
				<p class="text-red-300">{error}</p>
				<a href="/darkrift/lineup" class="text-sm text-violet-400 hover:text-violet-300">&larr; Back to Lineups</a>
			</div>
		{:else if runState}
			<!-- Header bar -->
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<a href="/darkrift/dungeon" class="text-gray-500 hover:text-gray-300 transition-colors text-sm">&larr;</a>
					<h1 class="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-violet-300">
						The Dark Rift
					</h1>
					<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/25">
						<span class="text-violet-300 font-bold text-sm">Lv {runLevel}</span>
						<span class="text-violet-400/60 text-xs">{formatLevelMultiplier(runLevel)}</span>
					</div>
				</div>

				<!-- Run progress -->
				<div class="flex items-center gap-3">
					{#if runState.status?.toLowerCase() === 'active'}
						<div class="flex items-center gap-2 text-sm text-gray-400">
							<div class="flex gap-0.5">
								{#each pathNodes as node, i}
									{@const cleared = isClearedNode(node)}
									{@const current = isCurrentNode(node)}
									<div
										class="w-3 h-1.5 rounded-full transition-all {cleared
											? 'bg-violet-500'
											: current
												? 'bg-violet-400 animate-pulse'
												: 'bg-gray-700'}"
									></div>
								{/each}
							</div>
							<span class="text-xs text-gray-500">{progressPercent}%</span>
						</div>
					{:else if runState.status?.toLowerCase() === 'won'}
						<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-300 text-sm font-semibold">
							&#x2713; Cleared
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold">
							&#x2620; Defeated
						</span>
					{/if}
				</div>
			</div>

			<!-- Node timeline -->
			<div class="flex flex-col">
				{#each pathNodes as node, i}
					{@const cleared = isClearedNode(node)}
					{@const isNext = runState.status?.toLowerCase() === 'active' && runState.nextNodeIds?.includes(node.id)}
					{@const canClick = isNext && !advancingNodeId}
					{@const isCurrent = isCurrentNode(node)}
					{@const previewEnemies = isEnemyNode(node.nodeType) ? encounterPreviewEnemies(node.encounterId) : []}
					{@const expanded = isNodeExpanded(node)}
					{@const accent = nodeAccentColor(node.nodeType)}

					<div class="flex min-h-0">
						<!-- Timeline spine -->
						<div class="w-12 flex flex-col items-center shrink-0 py-0.5">
							{#if i > 0}
								<div
									class="w-px flex-1 min-h-[10px] transition-all {cleared
										? 'bg-violet-500/60'
										: 'bg-gray-700/60'}"
									aria-hidden="true"
								></div>
							{/if}
							<div
								class="rounded-full w-9 h-9 flex items-center justify-center shrink-0 border-2 transition-all
									{cleared
										? 'border-violet-500/50 bg-violet-500/10'
										: isCurrent
											? 'border-violet-400 bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
											: isNext
												? 'border-violet-500/40 bg-gray-900'
												: 'border-gray-700 bg-gray-900'}"
								aria-hidden="true"
							>
								{#if cleared}
									<span class="text-violet-300 text-sm font-bold">&#x2713;</span>
								{:else if isCurrent}
									<span class="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse"></span>
								{:else if node.nodeType === 'BOSS'}
									<span class="text-red-400 text-sm">{nodeTypeIcon(node.nodeType)}</span>
								{:else if node.nodeType === 'ELITE'}
									<span class="text-amber-400 text-sm">{nodeTypeIcon(node.nodeType)}</span>
								{:else}
									<span class="text-gray-500 text-xs">{nodeTypeIcon(node.nodeType)}</span>
								{/if}
							</div>
							{#if i < pathNodes.length - 1}
								<div
									class="w-px flex-1 min-h-[10px] transition-all {cleared
										? 'bg-violet-500/60'
										: 'bg-gray-700/60'}"
									aria-hidden="true"
								></div>
							{/if}
						</div>

						<!-- Card content -->
						<div class="flex-1 min-w-0 pl-3 pr-0 pb-4">
							{#if cleared}
								<!-- Cleared node: compact expandable row -->
								<button
									type="button"
									class="w-full text-left rounded-xl border p-3 flex flex-col sm:flex-row gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer
										border-gray-800 bg-gray-900/40 hover:bg-gray-900/70"
									onclick={() => toggleNodeExpanded(node.id)}
								>
									<div class="flex flex-col gap-0.5 min-w-[120px] shrink-0">
										<div class="flex items-center gap-2">
											<span class="text-gray-500">{nodeTypeIcon(node.nodeType)}</span>
											<span class="font-semibold text-gray-400 text-sm">{nodeTypeLabel(node.nodeType)}</span>
										</div>
										{#if runState.nodeClearances?.[node.id]}
											<span class="text-xs text-gray-600">{clearanceLabel(runState.nodeClearances[node.id])}</span>
										{/if}
									</div>
									{#if previewEnemies.length > 0}
										<div class="flex flex-wrap gap-2 items-center flex-1">
											{#each previewEnemies as { enemyDefId, def, count }}
												<span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-gray-800 text-gray-400 border border-gray-700/50">
													{#if getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
														<img
															src={getEnemySpriteConfig(enemyDefId)?.staticImageSrc}
															alt=""
															class="w-5 h-5 rounded bg-gray-700 object-cover shrink-0"
														/>
													{:else}
														<span class="w-5 h-5 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{(def?.name ?? enemyDefId).charAt(0)}</span>
													{/if}
													<span class="font-medium text-gray-300">{def?.name ?? enemyDefId}</span>
													<span class="text-gray-600">{scaleEnemyStat(def?.hp ?? 0, runLevel)} HP</span>
													{#if (count ?? 1) > 1}
														<span class="text-gray-600">&times;{count}</span>
													{/if}
												</span>
											{/each}
										</div>
									{/if}
									{#if previewEnemies.length > 0}
										<span class="shrink-0 text-gray-600" aria-hidden="true">{expanded ? '\u25BC' : '\u25B6'}</span>
									{/if}
								</button>
								{#if expanded && previewEnemies.length > 0}
									<div class="mt-3 pl-0 flex flex-wrap gap-3">
										{#each previewEnemies as { enemyDefId, def, count }}
											{#each Array(count) as _}
												<div class="flex flex-col items-center shrink-0 shadow-md">
													<BattleCard
														kind="enemy"
														displayName={def?.name ?? enemyDefId}
														currentHp={scaleEnemyStat(def?.hp ?? 0, runLevel)}
														maxHp={scaleEnemyStat(def?.hp ?? 0, runLevel)}
														armor={def?.baseArmor ?? 0}
														magicResist={def?.baseMagicResist ?? 0}
														selected={false}
														selectedClass=""
														disabled={true}
														enemyAttackDamage={scaleEnemyStat(def?.damage ?? 0, runLevel)}
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
								<!-- Active/upcoming node -->
								<button
									type="button"
									class="w-full text-left rounded-xl border-2 p-4 flex flex-col sm:flex-row gap-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
										{canClick
											? 'cursor-pointer hover:border-violet-500/60 hover:bg-violet-950/30'
											: 'cursor-default'}
										{isCurrent
											? 'border-violet-500/40 bg-violet-950/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]'
											: 'border-gray-700/50 bg-gray-900/60'}
										{node.nodeType === 'BOSS' && !cleared ? 'border-red-500/30' : ''}
										{node.nodeType === 'ELITE' && !cleared ? 'border-amber-500/30' : ''}"
									disabled={!canClick}
									onclick={() => canClick && chooseNextNode(node.id)}
								>
									<div class="flex flex-col gap-1 min-w-[140px] shrink-0">
										<div class="flex items-center gap-2">
											<span
												class="text-2xl {node.nodeType === 'ELITE' ? 'text-amber-400' : node.nodeType === 'BOSS' ? 'text-red-400' : node.nodeType === 'BASE' ? 'text-emerald-400' : 'text-violet-400'}"
												aria-hidden="true"
											>
												{nodeTypeIcon(node.nodeType)}
											</span>
											<span class="font-bold text-gray-100">{nodeTypeLabel(node.nodeType)}</span>
											{#if node.nodeType === 'BOSS'}
												<span class="text-xs px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-400 uppercase tracking-wider font-semibold">Boss</span>
											{:else if node.nodeType === 'ELITE'}
												<span class="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-400 uppercase tracking-wider font-semibold">Elite</span>
											{/if}
										</div>
										{#if runState.nodeClearances?.[node.id]}
											<span class="text-sm text-gray-500">{clearanceLabel(runState.nodeClearances[node.id])}</span>
										{:else if isNext && isEnemyNode(node.nodeType)}
											<span class="text-sm text-violet-400 font-medium">Enter battle &rarr;</span>
										{:else if isNext}
											<span class="text-sm text-violet-400">Continue &rarr;</span>
										{/if}
										{#if isEnemyNode(node.nodeType) && runLevel > 1}
											<span class="text-xs text-gray-600">{formatLevelMultiplier(runLevel)} enemy stats</span>
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
															currentHp={scaleEnemyStat(def?.hp ?? 0, runLevel)}
															maxHp={scaleEnemyStat(def?.hp ?? 0, runLevel)}
															armor={def?.baseArmor ?? 0}
															magicResist={def?.baseMagicResist ?? 0}
															selected={false}
															selectedClass=""
															disabled={true}
															enemyAttackDamage={scaleEnemyStat(def?.damage ?? 0, runLevel)}
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

			<!-- Status footer -->
			<section class="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
				{#if healedMessage}
					<p class="text-sm text-emerald-400 font-medium">Party healed at the sanctuary!</p>
				{/if}
				{#if runState.status?.toLowerCase() === 'won'}
					<div class="text-center space-y-3">
						<p class="text-amber-300 font-semibold">Level {runLevel} cleared!</p>
						<p class="text-sm text-gray-400">Return to The Dark Rift to descend deeper.</p>
						<a
							href="/darkrift/dungeon"
							class="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
						>
							Back to Dark Rift
						</a>
					</div>
				{:else if runState.status?.toLowerCase() !== 'active'}
					<div class="text-center space-y-3">
						<p class="text-red-400 font-semibold">Your party has fallen.</p>
						<p class="text-sm text-gray-500">Train your heroes and try again.</p>
						<a
							href="/darkrift/dungeon"
							class="inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 px-5 py-2.5 text-sm font-medium transition-colors border border-gray-700"
						>
							Back to Dark Rift
						</a>
					</div>
				{:else if runState.nextNodeIds && runState.nextNodeIds.length > 0}
					<p class="text-sm text-gray-500">
						Win the battle to advance. Leaving or losing does not cost progress.
					</p>
				{:else if pathNodes.length > 0}
					<p class="text-sm text-gray-500">No further nodes. Run complete.</p>
				{/if}
			</section>

			<div class="flex items-center gap-2 text-sm text-gray-600">
				<a href="/darkrift/dungeon" class="text-violet-400 hover:text-violet-300 transition-colors">Dark Rift</a>
				<span>&middot;</span>
				<a href="/darkrift/lineup" class="text-violet-400 hover:text-violet-300 transition-colors">Lineups</a>
				<span>&middot;</span>
				<a href="/darkrift" class="text-violet-400 hover:text-violet-300 transition-colors">Dashboard</a>
			</div>
		{/if}
	</div>
</div>
