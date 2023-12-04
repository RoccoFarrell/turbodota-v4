<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
    import { navigating } from "$app/stores";

	import { onMount } from 'svelte';
	import turboking from '$lib/assets/turboking.png';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { tableSourceValues, tableMapperValues } from '@skeletonlabs/skeleton';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	export let data: PageData;

	console.log(data);
	console.log(page);

	class TableRow {
		playerID: number = 0;
		playerName: string = '';
		games: number = 0;
		wins: number = 0;
		losses: number = 0;
		win_percentage: number = 0;
		kda: number = 0;
		kills: number = 0;
		deaths: number = 0;
		assists: number = 0;
	}

	let selectedHeroID: number = -1;
	//var obj: { property: string; } = { property: "foo" };

	let tableData: TableSource = {
		head: [],
		body: []
	};

	$: tableData = {
		head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
		body: tableMapperValues(recalcTable(selectedHeroID), [
			'playerName',
			'games',
			'wins',
			'losses',
			'win_percentage',
			'kda',
			'kills',
			'deaths',
			'assists'
		])
	};

	const recalcTable = (heroID: number = -1) => {
		console.log(heroID);

		let tableData: TableRow[] = [];
		data.matchStats.forEach((player) => {
			//filters match data for selected hero
			let pushObj: TableRow = new TableRow();

			let filteredMatchData = [];
			heroID === -1
				? (filteredMatchData = player.matchData)
				: (filteredMatchData = player.matchData.filter((match: Match) => match.hero_id === heroID));

			pushObj.playerID = player.playerID;
			pushObj.playerName = player.playerName;
			pushObj.games = filteredMatchData.length;
			pushObj.wins = filteredMatchData.reduce(
				(acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
				0
			);
			pushObj.losses = filteredMatchData.length - pushObj.wins;
			pushObj.win_percentage = pushObj.wins / filteredMatchData.length;
			pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
			pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
			pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0);
			pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths;

			//console.log(`pushObj: ${JSON.stringify(pushObj)}`);
			tableData.push(pushObj);
		});

		//console.log(`tableData: ${JSON.stringify(tableData)}`)

		//sort by games by default
		tableData = tableData.sort((a: any, b: any) => {
			if (a.games < b.games) return 1;
			else return -1;
		});
		console.log(tableData);
		return tableData;
	};

	// let promise = Promise.resolve([]);
	// let tableData = [];
	// let selectedHero = null;

	let heroListWithAll = data.allHeroes.sort((a: any, b: any) => {
		if (a.localized_name < b.localized_name) return -1;
		else return 1;
	});

	heroListWithAll = [
		{
			id: -1,
			localized_name: 'All'
		},
		...data.allHeroes
	];
	const heroList: Hero[] = heroListWithAll;

	function winOrLoss(slot: number, win: boolean) {
		if (slot > 127) {
			if (win === false) {
				return true;
			} else return false;
		} else {
			if (win === false) {
				return false;
			} else return true;
		}
	}

	function calculateWinPercentageClasses(win_percentage: number) {
		//console.log(win_percentage)
		let classes = '';
		if (win_percentage < 0.45) classes = 'text-red-300';
		if (win_percentage <= 0.4) classes = 'text-red-500';
		if (win_percentage >= 0.55) classes = 'text-green-300';
		if (win_percentage >= 0.6) classes = 'text-green-500';

		return classes;
	}

	function calculateKdaClasses(kda: number) {
		//console.log(kda)
		let classes = '';
		if (kda < 4) classes = 'text-red-300';
		if (kda <= 2) classes = 'text-red-500';
		if (kda >= 5) classes = 'text-green-300';
		if (kda >= 7) classes = 'text-green-500';

		return classes;
	}
</script>

<div class="container mx-auto my-4">
	<div class="flex items-center justify-around space-x-4">
		<div class="flex flex-col items-center">
			<h1 class="h1 text-primary-500">Hero Stats</h1>
			<div class="flex justify-center items-center space-x-8 my-2">
				<h3 class="h3">ONLY THE TRUE KING WILL RULE</h3>
				<img class="w-8 lg:w-12" alt="turboking" src={turboking} />
			</div>
		</div>
		<div class="flex flex-col">
            <h3 class="h3 text-primary-500">Data sources</h3>
            <div>Open Dota: <p class="inline text-orange-500 font-bold">{data.matchStats.filter(player => player.dataSource !== "db").length}</p> </div>
            <div>Database: <p class="inline text-green-500 font-bold">{data.matchStats.filter(player => player.dataSource === "db").length}</p> </div>
        </div>
	</div>
</div>

<div class="container mx-auto p-4 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<select class="select select-sm variant-ghost-surface" bind:value={selectedHeroID}>
			{#each heroList as hero}
				<option value={hero.id}>{hero.localized_name}</option>
			{/each}
		</select>
	</div>
</div>

<!-- Skeleton table component -->
<!-- <div>
	<Table source={tableData} />
</div> -->

<!-- Skeleton table styling -->
<!-- Responsive Container (recommended) -->
<div class="table-container">
	<!-- Native Table Element -->
	<table class="table table-interactive">
		<thead>
			<tr>
				{#each ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as headerText, i}
					{#if [2, 3, 6, 7, 8].includes(i)}
						<th class="max-sm:hidden md:visible hover:bg-surface-500/50">{headerText}</th>
					{:else}
						<th class="hover:bg-surface-500/50">{headerText}</th>
					{/if}
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each tableData.body as row, i}
				<tr>
					{#each ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as cellText, i}
						{#if i === 4}
							<td class={`${calculateWinPercentageClasses(parseFloat(row[i]))}`}
								>{(parseFloat(row[i]) * 100).toFixed(2)}</td
							>
						{:else if i === 1}
							<td class="text-orange-500 font-semibold">{row[i]}</td>
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
		</tbody>
		<!-- <tfoot>
			<tr>
				<th colspan="3">Calculated Total Weight</th>
				<td>test</td>
			</tr>
		</tfoot> -->
	</table>
</div>

<!-- {#await promise}
    <ProgressRadial/>
{:then}
    
{/await} -->
