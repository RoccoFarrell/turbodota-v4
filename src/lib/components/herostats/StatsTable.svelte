<script lang="ts">
    import type { TableSource } from '@skeletonlabs/skeleton';

    //stores
	import { sortData } from '$lib/stores/sortData';

    export let tableData: TableSource = {
        head: [],
        body: []
    }
    export let selectedPlayer: string = "All"
    export let sortBy: SortBy = {
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	};

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
		sortData.setSortHeader(headerText)

        tableData = {
			head: tableData.head,
			body: tableData.body.sort((a: any, b: any) => {
				if (a[sortBy.sortObj.index] < b[sortBy.sortObj.index]) return sortBy.ascending ? -1 : 1;
				else return sortBy.ascending ? 1 : -1;
			})
		};
	}

    //helper functions
    function calculateWinPercentageClasses(win_percentage: number) {
		//console.log(win_percentage)
		let classes = '';
		if (win_percentage < 0.4) classes = 'text-red-800 vibrating font-bold';
		else if (win_percentage < 0.45) classes = 'text-red-700';
		else if (win_percentage <= 0.465) classes = 'text-red-600';
		else if (win_percentage <= 0.49) classes = 'text-red-500';

		if (win_percentage >= 0.51) classes = 'text-green-300';
		if (win_percentage >= 0.535) classes = 'text-green-500';
		if (win_percentage >= 0.58) classes = 'text-amber-500 animate-pulse';

		return classes;
	}

	function calculateKdaClasses(kda: number) {
		//console.log(kda)
		let classes = '';
		if (kda < 2.5) classes = 'text-red-600';
		if (kda <= 3) classes = 'text-red-400';
		if (kda >= 3.5) classes = 'text-green-300';
		if (kda >= 4) classes = 'text-green-500';

		return classes;
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
                            (headerText === sortBy.sortObj.headerText && sortBy.ascending
                                ? ' table-sort-asc'
                                : '') +
                            (headerText === sortBy.sortObj.headerText && !sortBy.ascending
                                ? ' table-sort-dsc'
                                : '')}
                        on:click={() => handleSortHeaderClick(headerText)}>{headerText}</th
                    >
                {/each}
            {:else}
                {#each ['Hero', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as headerText, i}
                    <th
                        id={headerText}
                        class={'hover:bg-surface-500/50' +
                            ([2, 3, 6, 7, 8].includes(i) ? ' max-sm:hidden md:visible' : '') +
                            (headerText === sortBy.sortObj.headerText && sortBy.ascending
                                ? ' table-sort-asc'
                                : '') +
                            (headerText === sortBy.sortObj.headerText && !sortBy.ascending
                                ? ' table-sort-dsc'
                                : '')}
                        on:click={() => handleSortHeaderClick(headerText)}>{headerText}</th
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
                            <td class={`${calculateWinPercentageClasses(parseFloat(row[i]))}`}
                                >{(parseFloat(row[i]) * 100).toFixed(2)}</td
                            >
                        {:else if i === 1}
                            <td class="text-primary-500 font-semibold">{row[i]}</td>
                        {:else if i === 5}
                            <td class={`${calculateKdaClasses(parseFloat(row[i]))}`}
                                >{parseFloat(row[i]).toFixed(2)}</td
                            >
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
</table>