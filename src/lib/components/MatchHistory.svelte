<script lang="ts">
	export let matchTableData;

    import { Table } from '@skeletonlabs/skeleton';
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';

    import { calculateKdaClasses } from '$lib/helpers/tableColors';
    
	const tableMatch: TableSource = {
		// A list of heading labels.
		head: ['Match ID', 'Result', 'Hero', 'KDA'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(matchTableData, ['match_id', 'start_time', 'result', 'hero', 'kda']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(matchTableData, ['match_id', 'start_time', 'result', 'hero', 'kda']),
	};
</script>

<!-- <Table source={tableMatch}/> -->
<div class="w-full flex flex-col card p-1 space-y-4 md:w-full max-md:max-w-sm">
	<h5 class="h5 text-primary-500 w-full border-b border-primary-500 border-dashed py-1">Last 5 Matches</h5>
	<div class="h-full">
        <div class="table-container">
            <!-- Native Table Element -->
            <table class="table table-hover table-compact">
                <thead>
                    <tr>
                        {#each tableMatch.head as header}
                            <th class="text-center p-0">{header}</th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each tableMatch.body as row, i}
                        <tr>
                            <td class="text-xs text-secondary-500">
                                <div class="hover:text-primary-400">
                                    <a href={`https://dotabuff.com/matches/${row[0]}`} target="_blank">
                                        {row[0]}
                                    </a>
                                    
                                </div>
                                <div class="text-xs text-slate-500">
                                    {row[1]}
                                </div>
                            </td>
                            <td class={"text-xl font-bold" + (row[2] ? " text-green-500" : " text-red-500")}>{row[2] ? "W": "L"}</td>
                            <td><i class={`z-50 d2mh hero-${row[3]}`}></i></td>
                            <td class={calculateKdaClasses(parseFloat(row[4]))}>{row[4]}</td>
                        </tr>
                    {/each}
                </tbody>
                <!-- <tfoot>
                    <tr>
                        <th colspan="3">Calculated Total Weight</th>
                        <td>{totalWeight}</td>
                    </tr>
                </tfoot> -->
            </table>
        </div>
	</div>
</div>
