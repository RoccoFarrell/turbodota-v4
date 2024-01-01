<script lang="ts">
	//svelte
	import { slide, blur, fade } from 'svelte/transition';
	import { quintOut, cubicOut } from 'svelte/easing';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	console.log('data: ', data);

	//constants
	//import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout';

	//skeleton
	import { Table } from '@skeletonlabs/skeleton';
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';

	//components
	import History from '../_components/History.svelte';

	//helpers
	import { calculateKdaClasses, calculateWinPercentageClasses } from '$lib/helpers/tableColors';

	//assets
	import Turboking from '$lib/assets/turboking.png';

	/* 
        Sort info
    */
	class LeaderboardRow {
		player: number = 0;
		name: string = '';
		wins: number = 0;
		losses: number = 0;
		win_percentage: number = 0;
		kdaWins: number = 0;
		kdaLosses: number = 0;
		kdaTotal: number = 0;
		goldWon: number = 0;
		goldLost: number = 0;
	}

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
			headerText: 'Gold Won',
			headerKey: 'goldWon',
			index: 2
		},
		{
			headerText: 'Gold Lost',
			headerKey: 'goldLost',
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
	let tableSource: TableSource = {
		head: sortMap.map((sort) => sort.headerText),
		body: []
	};

	$: tableSource;

	if (data.randoms) {
		/* 
        Get all unique player IDs in random database
    */
		let uniqueIDs = data.randoms
			.map((random) => random.account_id)
			.filter((random, i, arr) => arr.indexOf(random) === i);
		console.log(uniqueIDs);

		console.log(uniqueIDs);

		console.log(`Parsing ${data.randoms.length} randoms`);
		let randomTotals = {};
		let tableData: LeaderboardRow[] = [];

		/* 
            Loop through unique IDs generated above
        */
		uniqueIDs.forEach((playerID) => {
			//console.log('looping through playerID: ', playerID);
			let row: LeaderboardRow = new LeaderboardRow();

			let playerRandoms = data.randoms.filter((random) => random.account_id === playerID && random.active === false);
			if (playerRandoms.length > 0) {
				row.player = playerID;
				row.name = playerRandoms[0].user ? playerRandoms[0].user.username : '';

				/* calculate wins and losses */
				let winCount = playerRandoms.reduce((acc, cur) => (cur.win ? (acc += 1) : (acc += 0)), 0);
				let lossCount = playerRandoms.reduce((acc, cur) => (!cur.win ? (acc += 1) : (acc += 0)), 0);
				row.wins = winCount;
				row.losses = lossCount;
				row.win_percentage = row.wins / (row.wins + row.losses);

				let kdaWins = 0,
					kdaLosses = 0,
					kdaTotal = 0;

				/* 
                    Sum all KDAs in wins and losses
                */

				let kdaCalcs = {
					wins: {
						kills: 0,
						deaths: 0,
						assists: 0
					},
					losses: {
						kills: 0,
						deaths: 0,
						assists: 0
					},
					total: {
						kills: 0,
						deaths: 0,
						assists: 0
					}
				}
				playerRandoms.forEach((random) => {
					if (random.match) {
						kdaCalcs.total.kills += random.match.kills
						kdaCalcs.total.deaths += random.match.deaths
						kdaCalcs.total.assists += random.match.assists
						if (random.win) {
							kdaCalcs.wins.kills += random.match.kills
							kdaCalcs.wins.deaths += random.match.deaths
							kdaCalcs.wins.assists += random.match.assists
						} else if (!random.win) {
							kdaCalcs.losses.kills += random.match.kills
							kdaCalcs.losses.deaths += random.match.deaths
							kdaCalcs.losses.assists += random.match.assists
						}
					}
				});
				row.kdaTotal = (kdaCalcs.total.kills + kdaCalcs.total.assists) / kdaCalcs.total.deaths || 0
				row.kdaWins = (kdaCalcs.wins.kills + kdaCalcs.wins.assists) / kdaCalcs.wins.deaths || 0
				row.kdaLosses = (kdaCalcs.losses.kills + kdaCalcs.losses.assists) / kdaCalcs.losses.deaths || 0
				
				//old way that results in infinity
				// playerRandoms.forEach((random) => {
				// 	if (random.match) {
				// 		kdaTotal += (random.match.kills + random.match.assists) / random.match.deaths;
				// 		if (random.win) {
				// 			kdaWins += (random.match.kills + random.match.assists) / random.match.deaths;
				// 		} else if (!random.win) {
				// 			kdaLosses += (random.match.kills + random.match.assists) / random.match.deaths;
				// 		}
				// 	}
				// });
				// row.kdaTotal = kdaTotal / (winCount + lossCount);
				// row.kdaWins = kdaWins / winCount;
				// row.kdaLosses = kdaLosses / lossCount;

				/* 
                    Gold calculations
                */

				row.goldWon = playerRandoms.reduce(
					(acc, cur) => (cur.win && cur.endGold ? (acc += cur.endGold) : (acc += 0)),
					0
				);
				row.goldLost = playerRandoms.reduce(
					(acc, cur) => (cur.win && cur.modifierTotal ? (acc += cur.modifierTotal) : (acc += 0)),
					0
				);

				//console.log(`pushing row for ${row.name}`);
				tableData.push(row);
			}
		});

		/* 
            Set table data
        */

		//console.log(tableData);

		/* 
            Sort by gold 
        */

		tableData = tableData.sort((a: any, b: any) => {
			if (a.goldWon < b.goldWon) return 1;
			else if (a.goldWon > b.goldWon) return -1;
			else if (a.goldWon === b.goldWon) {
				if (a.win_percentage < b.win_percentage) return 1;
				else return -1;
			} else return 0;
		});

		tableSource = {
			head: tableSource.head,
			body: tableMapperValues(
				tableData,
				sortMap.map((sort) => sort.headerKey)
			)
		};
	}

	/* 
        Handle header click
    */

	const headerSelect = (header: any) => {
		console.log(header);
	};

	/* 
        Handle row select
    */

	$: selectedRow = -1;
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
			<div class="max-w-[40%]">
				<h2 class="h2 text-primary-700 max-md:font-bold">The Walker Random Leaderboard™</h2>
			</div>

			<!-- {#if data.session && data.session.user}
				<div class="text-xs">
					Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
				</div>
			{/if} -->
			<div class="vibrating border-4 border-dashed border-amber-500 my-4 flex justify-center space-x-8 p-4">
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
		<!-- <Table
			interactive={true}
			source={tableSource}
			on:selected={headerSelect}
			regionHeadCell={'text-center text-primary-500 font-semibold'}
		/> -->

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
							on:click={() => handleSortHeaderClick(headerText)}>{headerText}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#key tableSource}
					{#each tableSource.body as row, i_player}
						<tr
							on:click={() => rowSelected(row, i_player)}
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
										)}`}>
										{#if parseFloat(row[i]) !== parseFloat("0.00")}
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
								on:click={() => rowSelected(row, i_player)}
								transition:slide={{ delay: 100, duration: 300, easing: cubicOut }}
								class="p-0"
							>
								<td colspan="10" class="table-cell p-0 m-0">
									<div
										class="xl:max-w-[40%] lg:max-w-[50%] md:max-w-[60%] max-w-[90%] mx-auto"
										transition:blur={{ amount: 20, duration: 400 }}
									>
										<History
											completedRandoms={data.randoms.filter(
												(random) => random.account_id === parseInt(row[0]) && random.active === false
											)}
											allHeroes={data.heroDescriptions.allHeroes}
										/>
									</div>
								</td>
							</tr>
							<!-- {:else}
                            <div>
                                {selectedRow}
                                {i_player}
                            </div> -->
						{/if}
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
	</div>
</div>
