<!--
  Quick-edit roster/lineup: drag-and-drop reorder (battle order) and heal-to-full per hero.
  Reusable so it can be added to other views (map, lineup detail, etc.).
-->
<script lang="ts">
	import { getHeroDef } from '$lib/incremental/constants';
	import { toaster } from '$lib/toaster';

	interface Props {
		lineupId: string;
		runId: string;
		/** Ordered hero ids (battle order). */
		heroIds: number[];
		/** Current HP per index; null = all full. */
		heroHp: number[] | null;
		/** Optional display names (heroId -> name). */
		heroNames?: Record<number, string> | Map<number, string>;
		/** Called after reorder or heal so parent can refetch. */
		onUpdate?: () => void;
	}

	let {
		lineupId,
		runId,
		heroIds,
		heroHp,
		heroNames = {},
		onUpdate
	}: Props = $props();

	let draggingIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);
	let reordering = $state(false);
	let healingIndex = $state<number | null>(null);

	function displayName(heroId: number): string {
		if (heroNames instanceof Map) return heroNames.get(heroId) ?? `Hero ${heroId}`;
		return (heroNames as Record<number, string>)[heroId] ?? `Hero ${heroId}`;
	}

	function currentHp(index: number): number {
		const def = getHeroDef(heroIds[index]);
		const max = def?.baseMaxHp ?? 100;
		if (heroHp == null) return max;
		const v = heroHp[index];
		return typeof v === 'number' && v >= 0 ? Math.min(v, max) : max;
	}

	function maxHp(index: number): number {
		return getHeroDef(heroIds[index])?.baseMaxHp ?? 100;
	}

	function hpPercent(index: number): number {
		const cur = currentHp(index);
		const max = maxHp(index);
		return max > 0 ? (cur / max) * 100 : 100;
	}

	async function handleReorder(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;
		reordering = true;
		try {
			const next = [...heroIds];
			const [removed] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, removed);
			const res = await fetch(`/api/incremental/lineups/${lineupId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ heroIds: next })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: 'Reorder failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Order updated' });
			onUpdate?.();
		} catch (e) {
			toaster.error({ title: 'Reorder failed', description: e instanceof Error ? e.message : 'Unknown error' });
		} finally {
			reordering = false;
		}
	}

	async function handleHeal(index: number) {
		healingIndex = index;
		try {
			const max = maxHp(index);
			const len = heroIds.length;
			const current = heroHp ?? heroIds.map((_, i) => maxHp(i));
			const next = [...current];
			next[index] = max;
			const res = await fetch(`/api/incremental/runs/${runId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ heroHp: next })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toaster.error({ title: 'Heal failed', description: data.message ?? res.statusText });
				return;
			}
			toaster.success({ title: 'Healed to full' });
			onUpdate?.();
		} catch (e) {
			toaster.error({ title: 'Heal failed', description: e instanceof Error ? e.message : 'Unknown error' });
		} finally {
			healingIndex = null;
		}
	}

	function onDragStart(e: DragEvent, index: number) {
		draggingIndex = index;
		e.dataTransfer?.setData('text/plain', String(index));
		e.dataTransfer!.effectAllowed = 'move';
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggingIndex === null) return;
		dropTargetIndex = index;
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function onDragLeave() {
		dropTargetIndex = null;
	}

	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		dropTargetIndex = null;
		const fromIndex = draggingIndex;
		draggingIndex = null;
		if (fromIndex == null || fromIndex === toIndex) return;
		handleReorder(fromIndex, toIndex);
	}

	function onDragEnd() {
		draggingIndex = null;
		dropTargetIndex = null;
	}
</script>

<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
	<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Roster (battle order)</h3>
	<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Drag to reorder; order matters in battle.</p>
	<ul class="space-y-1.5" role="list">
		{#each heroIds as heroId, index}
			<li
				draggable={!reordering}
				class="flex items-center gap-2 rounded-lg border p-2 transition-colors
					{dropTargetIndex === index ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-600'}
					{draggingIndex === index ? 'opacity-60' : ''}"
				ondragstart={(e) => onDragStart(e, index)}
				ondragover={(e) => onDragOver(e, index)}
				ondragleave={onDragLeave}
				ondrop={(e) => onDrop(e, index)}
				ondragend={onDragEnd}
			>
				<span
					class="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 shrink-0 touch-none"
					aria-label="Drag to reorder"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
					</svg>
				</span>
				<span class="d2mh hero-{heroId} shrink-0 w-8 h-8 rounded bg-gray-700" aria-hidden="true"></span>
				<span class="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{displayName(heroId)}</span>
				<div class="flex-1 min-w-0 flex items-center gap-2">
					<div class="flex-1 min-w-0 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
						<div
							class="h-full rounded-full transition-all {hpPercent(index) >= 100 ? 'bg-green-500' : 'bg-amber-500'}"
							style="width: {hpPercent(index)}%"
						></div>
					</div>
					<span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">{currentHp(index)}/{maxHp(index)}</span>
				</div>
				<button
					type="button"
					class="shrink-0 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
					disabled={healingIndex !== null || currentHp(index) >= maxHp(index)}
					onclick={() => handleHeal(index)}
				>
					{healingIndex === index ? '…' : 'Heal'}
				</button>
			</li>
		{/each}
	</ul>
</div>
