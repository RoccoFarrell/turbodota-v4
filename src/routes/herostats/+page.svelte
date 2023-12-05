<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';

	//components
	import {
		Table,
		tableSourceValues,
		tableMapperValues,
		ProgressRadial,
		filter
	} from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import Loading from '$lib/components/Loading.svelte';

	//imports
	import turboking from '$lib/assets/turboking.png';

	//page data
	export let data: PageData;

	console.log(data);
	//console.log(page);

	//table data
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
	let selectedRole: string = 'All';

	const heroRoles = [
		'All',
		'Carry',
		'Disabler',
		'Durable',
		'Escape',
		'Initiator',
		'Nuker',
		'Pusher',
		'Support'
	];

	let tableData: TableSource = {
		head: [],
		body: []
	};

	interface SortObj {
		headerText: string;
		headerKey: string;
		index: number;
	}

	interface SortBy {
		sortObj: SortObj;
		ascending: boolean;
	}

	let sortBy: SortBy = {
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	};

	const sortMap: SortObj[] = [
		{
			headerText: 'Player',
			headerKey: 'player',
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

	let selectedSortHeader: string = 'Games';

	function handleSortHeaderClick(headerText: string) {
		let temp = sortMap.filter((item) => item.headerText === headerText)[0];
		sortBy = {
			sortObj: temp,
			ascending: headerText === selectedSortHeader ? !sortBy.ascending : sortBy.ascending
		};
		handleSort(sortBy);
		selectedSortHeader = headerText;
	}

	function handleSort(sortBy: SortBy) {
		console.log('Sort by: ', sortBy)
		tableData = {
			head: tableData.head,
			body: tableData.body.sort((a: any, b: any) => {
				if (a[sortBy.sortObj.index] < b[sortBy.sortObj.index]) return sortBy.ascending ? -1 : 1;
				else return sortBy.ascending ? 1 : -1;
			})
		};
	}

	//hero list
	let heroListWithAll = data.streamed.heroDescriptions.allHeroes.sort((a: any, b: any) => {
		if (a.localized_name < b.localized_name) return -1;
		else return 1;
	});

	heroListWithAll = [
		{
			id: -1,
			localized_name: 'All',
			roles: []
		},
		...data.streamed.heroDescriptions.allHeroes
	];
	const heroList: Hero[] = heroListWithAll;

	//helper functions

	let matchStats: MatchStats[] = [];
	data.streamed.matchStats.then((value) => {
		console.log(`promise finished ${value}`);
		matchStats = value;
		recalcTable(-1);
		handleSort(sortBy);
	});

	const recalcTable = (filterInput: number | string) => {
		tableData = {
			head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
			body: tableMapperValues(recalcTableData(filterInput), [
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

		handleSort(sortBy)
	};

	const recalcTableData = (filterInput: number | string) => {
		if (typeof filterInput === 'number') {
			console.log(`[herostats page.svelte] new hero ID selected: ${filterInput}`);
		}

		if (typeof filterInput === 'string') {
			console.log(`[herostats page.svelte] new hero Role selected: ${filterInput}`);
		}

		let tableData: TableRow[] = [];

		matchStats.forEach((player) => {
			//filters match data for selected hero
			let pushObj: TableRow = new TableRow();

			let filteredMatchData = [];

			//filter by heroID

			if (typeof filterInput === 'number') {
				selectedRole = 'All';
				filterInput === -1
					? (filteredMatchData = player.matchData)
					: (filteredMatchData = player.matchData.filter(
							(match: Match) => match.hero_id === filterInput
					  ));
			}
			//filter by heroRole
			else if (typeof filterInput === 'string') {
				selectedHeroID = -1;
				if (filterInput === 'all' || filterInput === 'All') filteredMatchData = player.matchData;
				else {
					console.log(heroList);
					let filteredHeroList = heroList
						.filter((hero) => hero.roles.includes(filterInput))
						.map((item) => item.id);
					filteredMatchData = player.matchData.filter((match: Match) =>
						filteredHeroList.includes(match.hero_id)
					);
				}
			}
			//console.log('filtered match data', filteredMatchData)

			pushObj.playerID = player.playerID;
			pushObj.playerName = player.playerName;
			pushObj.games = filteredMatchData.length;
			pushObj.wins = filteredMatchData.reduce(
				(acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
				0
			);
			pushObj.losses = filteredMatchData.length - pushObj.wins;
			pushObj.win_percentage = (pushObj.wins / filteredMatchData.length) || 0;
			pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
			pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
			pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0);
			pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

			tableData.push(pushObj);
		});

		//console.log(tableData);
		return tableData;
	};

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
		if (win_percentage < 0.45) classes = 'text-red-400';
		if (win_percentage <= 0.4) classes = 'text-red-600';
		if (win_percentage >= 0.55) classes = 'text-green-300';
		if (win_percentage >= 0.6) classes = 'text-green-500';

		return classes;
	}

	function calculateKdaClasses(kda: number) {
		//console.log(kda)
		let classes = '';
		if (kda < 4) classes = 'text-red-400';
		if (kda <= 2) classes = 'text-red-600';
		if (kda >= 5) classes = 'text-green-300';
		if (kda >= 7) classes = 'text-green-500';

		return classes;
	}
</script>

{#await data.streamed.matchStats}
	<Loading />
{:then matchStats}
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
				<div>
					Open Dota: <p class="inline text-orange-500 font-bold">
						{matchStats.filter((player) => player.dataSource !== 'db').length}
					</p>
				</div>
				<div>
					Database: <p class="inline text-green-500 font-bold">
						{matchStats.filter((player) => player.dataSource === 'db').length}
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="container mx-auto p-4 space-y-8">
		<div class="flex justify-center items-center space-x-8">
			<p class="inline text-primary-500 font-bold">Hero</p>
			<select
				class="select select-sm variant-ghost-surface"
				bind:value={selectedHeroID}
				on:change={() => recalcTable(selectedHeroID)}
			>
				{#each heroList as hero}
					<option value={hero.id}>{hero.localized_name}</option>
				{/each}
			</select>
			<p class="inline text-primary-500 font-bold">Role</p>
			<select
				class="select select-sm variant-ghost-surface"
				bind:value={selectedRole}
				on:change={() => recalcTable(selectedRole)}
			>
				{#each heroRoles as role}
					<option>{role}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Skeleton table styling -->
	<!-- Responsive Container (recommended) -->
	<div class="table-container">
		<!-- Native Table Element -->
		<table class="table table-interactive">
			<thead>
				<tr>
					{#each ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'] as headerText, i}
						<th
							id={headerText}
							class={'hover:bg-surface-500/50' +
								([2, 3, 6, 7, 8].includes(i) ? ' max-sm:hidden md:visible' : '') +
								(headerText === sortBy.sortObj.headerText && sortBy.ascending ? ' table-sort-asc' : '') +
								(headerText === sortBy.sortObj.headerText && !sortBy.ascending ? ' table-sort-dsc' : '')}
							on:click={() => handleSortHeaderClick(headerText)}>{headerText}</th
						>
					{/each}
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
{:catch error}
	{error.message}
{/await}
