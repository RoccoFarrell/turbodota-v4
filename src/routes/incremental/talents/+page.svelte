<script lang="ts">
	import { onMount } from 'svelte';
	import { toaster } from '$lib/toaster';
	import { getContext } from 'svelte';
	import { TALENT_NODES, type TalentNodeDef } from '$lib/incremental/constants/talent-nodes';

	const layoutHeroes = getContext<Array<{ id: number; localized_name: string }>>('heroes') ?? [];

	let saveId = $state<string | null>(null);
	let saves = $state<Array<{ id: string; name: string | null }>>([]);
	let pointsEarned = $state(0);
	let pointsSpent = $state(0);
	let pointsAvailable = $state(0);
	let purchasedNodeIds = $state<string[]>([]);
	let purchasing = $state<string | null>(null);

	function saveParam() {
		return saveId ? `?saveId=${encodeURIComponent(saveId)}` : '';
	}

	async function ensureSave() {
		if (saveId) return;
		const res = await fetch('/api/incremental/saves');
		if (res.ok) {
			const list = await res.json();
			saves = list;
			if (list.length > 0) saveId = list[0].id;
		}
		if (!saveId) {
			const w = await fetch('/api/incremental/wallet');
			if (w.ok) {
				const data = await w.json();
				saveId = data.saveId ?? null;
			}
		}
	}

	async function fetchTalents() {
		if (!saveId) return;
		const res = await fetch(`/api/incremental/talents${saveParam()}`);
		if (res.ok) {
			const data = await res.json();
			pointsEarned = data.pointsEarned ?? 0;
			pointsSpent = data.pointsSpent ?? 0;
			pointsAvailable = data.pointsAvailable ?? 0;
			purchasedNodeIds = data.purchasedNodeIds ?? [];
		}
	}

	function isPurchased(nodeId: string): boolean {
		return purchasedNodeIds.includes(nodeId);
	}

	function canPurchase(node: TalentNodeDef): boolean {
		if (pointsAvailable < 1) return false;
		if (isPurchased(node.id)) return false;
		for (const prereqId of node.prerequisiteIds) {
			if (!isPurchased(prereqId)) return false;
		}
		return true;
	}

	async function purchase(nodeId: string) {
		purchasing = nodeId;
		try {
			const res = await fetch('/api/incremental/talents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ saveId, nodeId })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toaster.error({ title: 'Purchase failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Talent purchased' });
			await fetchTalents();
		} finally {
			purchasing = null;
		}
	}

	onMount(() => {
		(async () => {
			await ensureSave();
			await fetchTalents();
		})();
	});
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Talent tree</h1>

	{#if saves.length > 1}
		<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
			<label for="talents-save" class="text-sm font-medium text-gray-500 dark:text-gray-400">Save</label>
			<select
				id="talents-save"
				class="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
				bind:value={saveId}
				onchange={fetchTalents}
			>
				{#each saves as s}
					<option value={s.id}>{s.name ?? 'Save'}</option>
				{/each}
			</select>
		</section>
	{/if}

	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<p class="text-sm text-gray-600 dark:text-gray-300">
			<strong>{pointsAvailable}</strong> talent points available
			<span class="text-gray-500">(earned: {pointsEarned}, spent: {pointsSpent})</span>. Earn 1 point per hero unlocked on your roster.
		</p>
	</section>

	<section class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
		<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Nodes</h2>
		<ul class="space-y-2">
			{#each TALENT_NODES as node}
				{@const purchased = isPurchased(node.id)}
				{@const canBuy = canPurchase(node)}
				<li
					class="rounded border p-3 {purchased
						? 'border-primary bg-primary/5 dark:bg-primary/10'
						: 'border-gray-200 dark:border-gray-600'}"
				>
					<p class="font-medium text-gray-900 dark:text-gray-100">{node.name}</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">{node.description}</p>
					{#if purchased}
						<span class="mt-2 inline-block text-xs text-primary">Purchased</span>
					{:else if canBuy}
						<button
							type="button"
							class="mt-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
							disabled={purchasing !== null}
							onclick={() => purchase(node.id)}
						>
							{purchasing === node.id ? 'Purchasing...' : 'Purchase (1 point)'}
						</button>
					{:else}
						<p class="mt-2 text-xs text-gray-400">
							{#if node.prerequisiteIds.length > 0}
								Requires: {node.prerequisiteIds.filter((id) => !isPurchased(id)).join(', ')}
							{:else if pointsAvailable < 1}
								Need 1 talent point
							{/if}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<p class="text-sm text-gray-500 dark:text-gray-400">
		<a href="/incremental" class="text-primary hover:underline">← Back to Incremental</a>
	</p>
</div>
