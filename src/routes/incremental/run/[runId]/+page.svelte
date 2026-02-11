<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toaster } from '$lib/toaster';
	import knightImg from '$lib/assets/knight.png';
	import questBoardImg from '$lib/assets/questBoard.png';
	import { getEncounterDef, getEnemyDef } from '$lib/incremental/constants';
	import RosterQuickEdit from '$lib/incremental/components/RosterQuickEdit.svelte';

	const runId = $derived($page.params.runId);

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

	let runState = $state<RunStateShape | null>(null);
	let pathNodes = $state<MapNodeShape[]>([]);
	let lineup = $state<LineupForEdit | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let advancingNodeId = $state<string | null>(null);
	let healedMessage = $state(false);

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

	async function loadRun() {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/incremental/runs/${runId}/map`);
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

	/** Next encounter node (only one is ever available in linear path). */
	const nextEncounter = $derived.by(() => {
		if (!runState?.nextNodeIds?.length || !pathNodes.length) return null;
		const nextId = runState.nextNodeIds[0];
		const node = pathNodes.find((n) => n.id === nextId);
		return node && isEnemyNode(node.nodeType) ? node : null;
	});

	function encounterEnemyPreview(encounterId: string | null): string {
		if (!encounterId) return '';
		const enc = getEncounterDef(encounterId);
		if (!enc) return '';
		const parts = enc.enemies.map(({ enemyDefId, count: c }) => {
			const count = c ?? 1;
			const def = getEnemyDef(enemyDefId);
			const name = def?.name ?? enemyDefId;
			return count > 1 ? `${name} ×${count}` : name;
		});
		return parts.join(', ');
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

	function knightClass(node: MapNodeShape): string {
		const base = 'inline-block object-contain transition-transform hover:scale-105';
		const isCurrent = runState?.currentNodeId === node.id;
		const canGo = runState?.nextNodeIds?.includes(node.id) ?? false;
		const dimmed = runState?.status === 'active' && !isCurrent && !canGo;
		const clickable = runState?.status === 'active' && canGo && !advancingNodeId;
		let size = 'h-12 w-12';
		let glow = '';
		if (node.nodeType === 'ELITE') {
			size = 'h-16 w-16';
			glow = 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]';
		} else if (node.nodeType === 'BOSS') {
			size = 'h-20 w-20';
			glow = 'drop-shadow-[0_0_12px_rgba(220,38,38,0.9)] drop-shadow-[0_0_24px_rgba(234,179,8,0.6)]';
		} else {
			// COMBAT or other
			glow = 'drop-shadow-[0_0_4px_rgba(148,163,184,0.6)]';
		}
		const currentRing = isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-(--background)' : '';
		// Cleared nodes: no opacity fade (clashes with wood); contrast comes from dark panel on the button wrapper
		const cursor = clickable ? 'cursor-pointer' : dimmed ? 'cursor-default' : 'cursor-default';
		return [base, size, glow, currentRing, cursor].filter(Boolean).join(' ');
	}

	function isClearedNode(node: MapNodeShape): boolean {
		if (!runState?.status || runState.status !== 'active') return false;
		const isCurrent = runState.currentNodeId === node.id;
		const canGo = runState.nextNodeIds?.includes(node.id) ?? false;
		return !isCurrent && !canGo;
	}

	onMount(() => {
		loadRun();
	});
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Run – Map</h1>

	{#if loading}
		<p class="text-gray-500 dark:text-gray-400">Loading run…</p>
	{:else if error}
		<p class="text-destructive">{error}</p>
		<a href="/incremental/lineup" class="text-sm text-primary hover:underline">← Back to Lineups</a>
	{:else if runState}
		<!-- Map: quest board background with full path (use imported asset so Vite resolves the URL) -->
		<div
			class="min-h-[320px] sm:min-h-[380px] rounded-xl bg-no-repeat bg-cover bg-center relative overflow-hidden flex flex-col justify-center"
			style="background-image: url({questBoardImg});"
		>
			<!-- Path strip: nodes in order with connectors -->
			<div class="relative px-4 py-8 flex items-center justify-center gap-0 flex-wrap">
				{#each pathNodes as node, i}
					{#if i > 0}
						<!-- Connector line: darker so it reads on the quest board -->
						<div
							class="shrink-0 w-6 sm:w-10 h-0.5 sm:h-1 rounded {isClearedNode(pathNodes[i - 1]) ? 'bg-stone-800/90' : 'bg-amber-800/80 dark:bg-amber-700/70'}"
							aria-hidden="true"
						></div>
					{/if}
					{@const cleared = isClearedNode(node)}
					<button
						type="button"
						class="flex flex-col items-center gap-1 p-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {cleared
							? 'bg-stone-900/85 dark:bg-stone-950/90 border border-stone-600/50 shadow-md'
							: ''} {!cleared && runState.status === 'active' && runState.nextNodeIds?.includes(node.id) && !advancingNodeId
							? 'hover:bg-amber-900/25 dark:hover:bg-amber-800/25'
							: ''} {runState.currentNodeId === node.id && !cleared ? 'bg-amber-900/40 dark:bg-amber-800/40' : ''}"
						disabled={runState.status !== 'active' || !runState.nextNodeIds?.includes(node.id) || advancingNodeId !== null}
						onclick={() => chooseNextNode(node.id)}
					>
						{#if isEnemyNode(node.nodeType)}
							<img
								src={knightImg}
								alt={nodeTypeLabel(node.nodeType)}
								class={knightClass(node)}
							/>
						{:else}
							<!-- Non-enemy: simple icon placeholder -->
							<div
								class="h-12 w-12 rounded-full border-2 flex items-center justify-center text-xs font-medium {cleared
									? 'border-stone-500/80 text-stone-200'
									: 'border-amber-700/80 dark:border-amber-500/80 text-amber-800 dark:text-amber-200'} {runState.currentNodeId === node.id && !cleared ? 'ring-2 ring-primary ring-offset-2 ring-offset-(--background)' : ''}"
							>
								{node.nodeType === 'BASE' ? '♥' : node.nodeType.slice(0, 1)}
							</div>
						{/if}
						<span
							class="text-[10px] sm:text-xs font-medium whitespace-nowrap {cleared ? 'text-stone-200' : 'text-amber-900 dark:text-amber-100'}"
						>
							{nodeTypeLabel(node.nodeType)}
						</span>
						{#if runState.nodeClearances?.[node.id]}
							<span
								class="text-[9px] sm:text-[10px] max-w-[80px] sm:max-w-[100px] truncate block text-center {cleared ? 'text-amber-200/95' : 'text-amber-800 dark:text-amber-300'}"
								title={clearanceLabel(runState.nodeClearances[node.id])}
							>
								{clearanceLabel(runState.nodeClearances[node.id])}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Roster quick edit (reorder + heal) when run is active and lineup is available -->
		{#if runState.status === 'active' && lineup && runId}
			<RosterQuickEdit
				lineupId={lineup.lineupId}
				runId={runId}
				heroIds={lineup.heroIds}
				heroHp={lineup.heroHp}
				onUpdate={loadRun}
			/>
		{/if}

		<!-- Next encounter preview (only one encounter is available at a time) -->
		{#if runState.status === 'active' && nextEncounter}
			<section class="rounded-lg border border-amber-700/50 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-900/20 p-4">
				<h2 class="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Next encounter</h2>
				<p class="text-sm text-amber-800 dark:text-amber-200">
					{nodeTypeLabel(nextEncounter.nodeType)} — tap the node on the map above to enter battle.
				</p>
				<p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
					<strong>Enemies:</strong> {encounterEnemyPreview(nextEncounter.encounterId)}
				</p>
			</section>
		{/if}

		<!-- Status and choices summary -->
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				<strong>Status:</strong> {runState.status}
			</p>
			{#if healedMessage}
				<p class="text-sm text-green-600 dark:text-green-400 font-medium">Healed!</p>
			{/if}
			{#if runState.status !== 'active'}
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
