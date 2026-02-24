<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as actionStore from '$lib/incremental/stores/action-slots.svelte';

	interface SaveOption {
		id: string;
		name: string | null;
		createdAt: string;
		season: {
			id: number;
			name: string;
			startDate: string;
			endDate: string;
			active: boolean;
			leagueID: number;
		} | null;
	}

	interface Props {
		saves: SaveOption[];
	}

	let { saves }: Props = $props();

	const currentSaveId = $derived(actionStore.getSaveId());

	function displayLabel(save: SaveOption): string {
		if (save.season) return save.season.name;
		if (save.name) return save.name;
		return 'Default';
	}

	async function onSelect(event: Event) {
		const newId = (event.target as HTMLSelectElement).value;
		if (newId === currentSaveId) return;
		actionStore.setSaveId(newId);
		await Promise.all([actionStore.fetchBank(), actionStore.fetchSlots()]);
		await invalidateAll();
	}
</script>

{#if saves.length > 1}
	<div class="mx-3 mb-1 mt-0.5">
		<label for="save-season-select" class="sr-only">Select save / season</label>
		<select
			id="save-season-select"
			class="w-full text-xs font-semibold rounded-md border border-violet-800/30 bg-violet-950/30
			       text-violet-300 px-2 py-1.5 focus:outline-none focus:border-violet-600/50 cursor-pointer
			       appearance-none"
			value={currentSaveId ?? saves[0]?.id}
			onchange={onSelect}
		>
			{#each saves as save (save.id)}
				<option value={save.id}>
					{displayLabel(save)}{#if save.season?.active} (Active){/if}
				</option>
			{/each}
		</select>
	</div>
{:else if saves.length === 1 && saves[0].season}
	<div class="mx-3 mb-1 mt-0.5">
		<a
			href="/leagues/{saves[0].season.leagueID}/seasons/{saves[0].season.id}"
			class="flex items-center w-full text-xs font-semibold rounded-md border border-violet-800/30 bg-violet-950/30
			       text-violet-300 px-2 py-1.5 no-underline hover:border-violet-600/50 hover:text-violet-200 transition-colors"
		>
			{#if saves[0].season.active}<span class="inline-block w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)] mr-1.5 shrink-0"></span>{/if}
			<span class="truncate">{saves[0].season.name}</span>
			<i class="fi fi-br-angle-right ml-auto text-[0.5rem] text-violet-600 shrink-0"></i>
		</a>
	</div>
{/if}
