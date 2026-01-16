<script lang="ts">
	//svelte
	import { slide, blur, fade } from 'svelte/transition';
	import { quintOut, cubicOut } from 'svelte/easing';
	import { getContext } from 'svelte';

	import { calculateTownLeaderboard } from '$lib/helpers/leaderboardFromSeason';

	

	let heroes = getContext('heroes')

	//constants
	//import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout';

	//skeleton
	// TableSource type (not exported from Skeleton v3)
	type TableSource = {
		head: string[];
		body: any[][];
		meta?: any[][];
	};
	
	// Helper function to map table data values
	function tableMapperValues(data: any[], keys: string[]): any[][] {
		return data.map(item => keys.map(key => item[key]));
	}

	//components
	import History from '../../../../turbotown/quests/_components/History.svelte';

	//helpers
	import { calculateKdaClasses, calculateWinPercentageClasses } from '$lib/helpers/tableColors';

	//assets
	import Turboking from '$lib/assets/turboking.png';
	interface Props {
		//page data
		turbotowns: any;
		members: any;
		randoms: any;
	}

	let { turbotowns, members, randoms }: Props = $props();

	const sortMap: SortObj[] = [
		{
			headerText: 'Player',
			headerKey: 'player',
			index: 0
		},
		{
			headerText: 'Name',
			headerKey: 'name',
			index: 1
		},
		{
			headerText: 'XP',
			headerKey: 'xp',
			index: 2
		},
		{
			headerText: 'Gold',
			headerKey: 'gold',
			index: 3
		},
		{
			headerText: 'Wins',
			headerKey: 'wins',
			index: 4
		},
		{
			headerText: 'Losses',
			headerKey: 'losses',
			index: 5
		},
		{
			headerText: 'Win %',
			headerKey: 'win_percentage',
			index: 6
		},
		{
			headerText: 'KDA in Wins',
			headerKey: 'kdaWins',
			index: 7
		},
		{
			headerText: 'KDA in Losses',
			headerKey: 'kdaLosses',
			index: 8
		},
		{
			headerText: 'Total KDA',
			headerKey: 'kdaTotal',
			index: 9
		}
	];

	let sortBy: SortBy = {
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	};

	/* 
        Table source defaults
    */
	

	// let randoms: any[] = []
	// turbotowns.forEach((town: any) => {
	// 	let townRandoms = town.quests.filter((quest: any) => !quest.active).map((quest: any) => quest.random)
	// 	randoms.push(...townRandoms)
	// })

	//$: console.log('members: ', members, 'turbotowns: ', turbotowns, 'randoms: ', randoms);

	let rawTableData = calculateTownLeaderboard(turbotowns, randoms, members);

	//console.log('rawTableData: ', rawTableData);
	let sourceData = tableMapperValues(rawTableData, [
		'player',
		'name',
		'xp',
		'gold',
		'wins',
		'losses',
		'win_percentage',
		'kdaWins',
		'kdaLosses',
		'kdaTotal'
	]);

	let headerValues = sortMap.map((sort) => sort.headerText)

	let tableSource: TableSource = {
		head: headerValues,
		body: sourceData
	};

	// function setTableSource(): TableSource {
	// 	return {
	// 		head: sortMap.map((sort) => sort.headerText),
	// 		body: sourceData,
	// 	};
	// }

	// If sourceData updates, set the new TableSource values
	// let tableSource: TableSource | undefined;
	// $: tableSource = sourceData ? setTableSource() : undefined;

	/* 
        Handle row select
    */

	let selectedRow = $derived(-1);
	const rowSelected = (row: any, i: number) => {
		console.log(`${i}: ${row}`);
		if (selectedRow === i) selectedRow = -1;
		else selectedRow = i;
		console.log(`selectedRow: ${selectedRow}`);
	};
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center md:mx-8 mx-4">
		<div class="w-full flex max-md:flex-col justify-around items-center md:my-2 my-1">
			<!-- <div class="max-w-[40%]">
				<h2 class="h2 text-primary-700 max-md:font-bold">TurboTown Leaderboard™</h2>
			</div> -->
			<div class="w-1/2 vibrating border-4 border-dashed border-amber-500 my-4 flex justify-center space-x-8 p-4 bg-amber-500/10">
				<img src={Turboking} class="w-20" alt="the current turboking" />
				<div class="h-full flex flex-col items-center justify-center my-auto">
					{#if tableSource.body[0]}
						<p class="text-tertiary-500 italic">The current king:</p>
						<div class="text-2xl font-bold text-green-400">{tableSource.body[0][1]}</div>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex justify-center items-center w-full p-4">
			<i class="fi fi-rr-lightbulb-question text-primary-400 text-3xl"></i>
			<p class="mx-4 italic text-xs text-tertiary-400">Click a row to see their random history!</p>
		</div>

		<table class="table table-interactive mx-10">
			<thead>
				<tr>
					{#each tableSource.head as headerText, i}
						<th
							id={headerText}
							class={'text-center hover:bg-surface-500/50' +
								([0, 3, 5, 6, 7, 8].includes(i) ? ' max-md:hidden lg:visible' : '') +
								(headerText === sortBy.sortObj.headerText && sortBy.ascending ? ' table-sort-asc' : '') +
								(headerText === sortBy.sortObj.headerText && !sortBy.ascending ? ' table-sort-dsc' : '')}
						>
							{headerText}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#key tableSource}
					{#each tableSource.body as row, i_player}
						<tr
							onclick={() => rowSelected(row, i_player)}
							transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}
						>
							{#each tableSource.head as cellText, i}
								{#if cellText.includes('Player')}
									<td class="max-md:hidden lg:visible text-2xl text-secondary-500">{row[i]}</td>
								{:else if cellText.includes('Win %')}
									<td class={`max-md:hidden lg:visible ${calculateWinPercentageClasses(parseFloat(row[i]))}`}
										>{(parseFloat(row[i]) * 100).toFixed(2)}</td
									>
								{:else if cellText.includes('Gold Won')}
									<td class="text-amber-400 font-bold">{row[i]}</td>
								{:else if cellText.includes('Gold Lost')}
									<td class="max-md:hidden lg:visible text-red-800 font-bold">{row[i]}</td>
								{:else if i === 1}
									<td class="text-primary-500 font-semibold">{row[i]}</td>
								{:else if cellText.includes('KDA')}
									<td
										class={`${cellText === 'Total KDA' ? '' : 'max-md:hidden lg:visible'} ${calculateKdaClasses(
											parseFloat(row[i])
										)}`}
									>
										{#if parseFloat(row[i]) !== parseFloat('0.00')}
											{parseFloat(row[i]).toFixed(2)}
										{:else}
											<p class="text-xs text-slate-500">-</p>
										{/if}
									</td>
								{:else if [0, 3, 5, 6, 7, 8].includes(i)}
									<td class="max-md:hidden lg:visible">{row[i]}</td>
								{:else}
									<td>{row[i]}</td>
								{/if}
							{/each}
						</tr>
						{#if selectedRow === i_player}
							<tr
								onclick={() => rowSelected(row, i_player)}
								transition:slide={{ delay: 100, duration: 300, easing: cubicOut }}
								class="p-0"
							>
								<td colspan="10" class="table-cell p-0 m-0">
									<div
										class="xl:max-w-[40%] lg:max-w-[50%] md:max-w-[60%] max-w-[90%] mx-auto"
										transition:blur={{ amount: 20, duration: 400 }}
									>
										<History
											completedRandoms={randoms.filter(
												(random) => random.account_id === parseInt(row[0]) && random.active === false && random.status !== 'skipped'
											)}
											allHeroes={heroes}
										/>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				{/key}
			</tbody>
		</table>
	</div>
</div>
