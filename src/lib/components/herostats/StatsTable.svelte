<script lang="ts">
	import type { TableSource } from '@skeletonlabs/skeleton';

	//helpers
	import { calculateKdaClasses, calculateWinPercentageClasses } from '$lib/helpers/tableColors';

	//stores
	import { sortData } from '$lib/stores/sortData';

	interface Props {
		tableData?: TableSource;
		selectedPlayer?: string;
		sortBy?: SortBy;
	}

	let { tableData = $bindable({
		head: [],
		body: []
	}), selectedPlayer = 'All', sortBy = $bindable({
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	}) }: Props = $props();

	interface SortObj {
		headerText: string;
		headerKey: string;
		index: number;
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

	//$: handleSortHeaderChange($sortData.sortHeader)

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
</script>

<!-- Native Table Element -->
<table class="table table-interactive">
	<thead>
		<tr>
			{#if selectedPlayer == 'All'}
				{#each ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as headerText, i}
					<th
						id={headerText}
						class={'hover:bg-surface-500/50' +
							([2, 3, 6, 7, 8].includes(i) ? ' max-sm:hidden md:visible' : '') +
							(headerText === sortBy.sortObj.headerText && sortBy.ascending ? ' table-sort-asc' : '') +
							(headerText === sortBy.sortObj.headerText && !sortBy.ascending ? ' table-sort-dsc' : '')}
						onclick={() => handleSortHeaderClick(headerText)}>{headerText}</th
					>
				{/each}
			{:else}
				{#each ['Hero', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as headerText, i}
					<th
						id={headerText}
						class={'hover:bg-surface-500/50' +
							([2, 3, 6, 7, 8].includes(i) ? ' max-sm:hidden md:visible' : '') +
							(headerText === sortBy.sortObj.headerText && sortBy.ascending ? ' table-sort-asc' : '') +
							(headerText === sortBy.sortObj.headerText && !sortBy.ascending ? ' table-sort-dsc' : '')}
						onclick={() => handleSortHeaderClick(headerText)}>{headerText}</th
					>
				{/each}
			{/if}
		</tr>
	</thead>
	<tbody>
		{#key tableData}
			{#each tableData.body as row, i}
				<tr>
					{#each ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as cellText, i}
						{#if i === 4}
							<td class={`${calculateWinPercentageClasses(parseFloat(row[i]))}`}>{(parseFloat(row[i]) * 100).toFixed(2)}</td>
						{:else if i === 1}
							<td class="text-primary-500 font-semibold">{row[i]}</td>
						{:else if i === 5}
							<td class={`${calculateKdaClasses(parseFloat(row[i]))}`}>{parseFloat(row[i]).toFixed(2)}</td>
						{:else if [2, 3, 6, 7, 8].includes(i)}
							<td class="max-sm:hidden md:visible">{row[i]}</td>
						{:else}
							<td>{row[i]}</td>
						{/if}
					{/each}
				</tr>
			{/each}
		{/key}
	</tbody>
	<!-- <tfoot>
			<tr>
				<th colspan="3">Calculated Total Weight</th>
				<td>test</td>
			</tr>
		</tfoot> -->
</table>
