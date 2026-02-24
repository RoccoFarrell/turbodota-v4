<script lang="ts">
	// TableSource type (not exported from Skeleton v3)
	type TableSource = {
		head: string[];
		body: any[][];
		meta?: any[][];
	};

	//stores
	import { sortData } from '$lib/stores/sortData';

	interface Props {
		tableData?: TableSource;
		selectedPlayer?: string;
		sortBy?: SortBy;
	}

	let {
		tableData = $bindable({
			head: [],
			body: []
		}),
		selectedPlayer = 'All',
		sortBy = $bindable({
			sortObj: {
				headerText: 'Games',
				headerKey: 'games',
				index: 1
			},
			ascending: false
		})
	}: Props = $props();

	interface SortObj {
		headerText: string;
		headerKey: string;
		index: number;
	}

	interface SortBy {
		sortObj: SortObj;
		ascending: boolean;
	}

	const sortMap: SortObj[] = [
		{
			headerText: 'Player',
			headerKey: 'player',
			index: 0
		},
		{
			headerText: 'Hero',
			headerKey: 'hero',
			index: 0
		},
		{
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		{
			headerText: 'Wins',
			headerKey: 'wins',
			index: 2
		},
		{
			headerText: 'Losses',
			headerKey: 'losses',
			index: 3
		},
		{
			headerText: 'Win %',
			headerKey: 'win_percentage',
			index: 4
		},
		{
			headerText: 'KDA',
			headerKey: 'kda',
			index: 5
		},
		{
			headerText: 'Kills',
			headerKey: 'kills',
			index: 6
		},
		{
			headerText: 'Deaths',
			headerKey: 'deaths',
			index: 7
		},
		{
			headerText: 'Assists',
			headerKey: 'assists',
			index: 8
		}
	];

	const headers = ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'];
	const hiddenOnMobile = new Set([2, 3, 6, 7, 8]);

	function handleSortHeaderClick(headerText: string) {
		let temp = sortMap.filter((item) => item.headerText === headerText)[0];
		sortBy = {
			sortObj: temp,
			ascending: headerText === $sortData.sortHeader ? !sortBy.ascending : sortBy.ascending
		};
		sortData.setSortHeader(headerText);

		tableData = {
			head: tableData.head,
			body: tableData.body.sort((a: any, b: any) => {
				if (a[sortBy.sortObj.index] < b[sortBy.sortObj.index]) return sortBy.ascending ? -1 : 1;
				else return sortBy.ascending ? 1 : -1;
			})
		};
	}

	function getWinPillClasses(value: number): string {
		if (value < 0.45) return 'bg-red-900/60 text-red-400';
		if (value > 0.55) return 'bg-emerald-900/60 text-emerald-400';
		return 'bg-slate-800/60 text-slate-300';
	}

	function getKdaPillClasses(value: number): string {
		if (value < 3) return 'bg-red-900/60 text-red-400';
		if (value > 6) return 'bg-emerald-900/60 text-emerald-400';
		return 'bg-slate-800/60 text-slate-300';
	}

	function getDisplayHeaders(): string[] {
		if (selectedPlayer === 'All') return headers;
		return ['Hero', ...headers.slice(1)];
	}
</script>

<div class="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-lg overflow-hidden">
	<table class="w-full border-collapse">
		<thead>
			<tr class="border-b border-amber-500/20">
				{#each getDisplayHeaders() as headerText, i}
					<th
						class="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-xs text-amber-300/70 cursor-pointer select-none hover:text-amber-300 transition-colors duration-150{hiddenOnMobile.has(i) ? ' max-sm:hidden' : ''}"
						onclick={() => handleSortHeaderClick(headerText)}
					>
						{headerText}
						{#if headerText === sortBy.sortObj.headerText}
							<span class="ml-1 text-amber-400">{sortBy.ascending ? '▲' : '▼'}</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#key tableData}
				{#each tableData.body as row, rowIndex}
					<tr class="hover:bg-amber-500/5 transition-colors duration-150{rowIndex % 2 === 0 ? ' bg-white/[0.02]' : ''}">
						{#each headers as _cellText, i}
							{#if i === 0}
								<!-- Name column -->
								<td class="px-3 py-2 font-medium text-slate-200">{row[i]}</td>
							{:else if i === 1}
								<!-- Games column -->
								<td class="px-3 py-2 text-amber-400 font-semibold">{row[i]}</td>
							{:else if i === 4}
								<!-- Win % pill badge -->
								<td class="px-3 py-2">
									<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold {getWinPillClasses(parseFloat(row[i]))}"
										>{(parseFloat(row[i]) * 100).toFixed(1)}%</span
									>
								</td>
							{:else if i === 5}
								<!-- KDA pill badge -->
								<td class="px-3 py-2">
									<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold {getKdaPillClasses(parseFloat(row[i]))}"
										>{parseFloat(row[i]).toFixed(2)}</span
									>
								</td>
							{:else if hiddenOnMobile.has(i)}
								<!-- Wins, Losses, Kills, Deaths, Assists — hidden on mobile -->
								<td class="px-3 py-2 text-slate-400 max-sm:hidden">{row[i]}</td>
							{:else}
								<td class="px-3 py-2 text-slate-400">{row[i]}</td>
							{/if}
						{/each}
					</tr>
				{/each}
			{/key}
		</tbody>
	</table>
</div>
