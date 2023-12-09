<script lang="ts">
    export let selectedPlayer: string = "All"
    export let sortBy: SortBy = {
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	};
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