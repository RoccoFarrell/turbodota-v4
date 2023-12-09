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
		filter,
		TabGroup,
		Tab,
		TabAnchor
	} from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import Loading from '$lib/components/Loading.svelte';

	//imports
	import turboking from '$lib/assets/turboking.png';
	import Knight from '$lib/assets/knight.png';

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

	//page data
	export let data: PageData;

	console.log(`[herostats page.svelte]`, data);
	//console.log(page);

	class TableRow {
		playerID: number = 0;
		name: string = '';
		games: number = 0;
		wins: number = 0;
		losses: number = 0;
		win_percentage: number = 0;
		kda: number = 0;
		kills: number = 0;
		deaths: number = 0;
		assists: number = 0;
	}

	interface SortObj {
		headerText: string;
		headerKey: string;
		index: number;
	}

	interface SortBy {
		sortObj: SortObj;
		ascending: boolean;
	}

	let selectedHeroID: number = -1;
	let selectedRole: string = 'All';
	let selectedStartDate = new Date(0);
	let selectedEndDate = new Date();

	let tabSet: number = 0;

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

	const playersWeCareAbout = [
		{ playerID: 65110965, playerName: 'Rocco' },
		{ playerID: 34940151, playerName: 'Roberts' },
		{ playerID: 80636612, playerName: 'Martin' },
		{ playerID: 113003047, playerName: 'Danny' },
		{ playerID: 125251142, playerName: 'Matt' },
		{ playerID: 423076846, playerName: 'Chris' },
		{ playerID: 67762413, playerName: 'Walker' },
		{ playerID: 68024789, playerName: 'Ben' }
		//{ playerID: 123794823, playerName: 'Steven' },
		//{ playerID: 214308966, playerName: 'Andy' }
	];

	let selectedPlayer = playersWeCareAbout[0].playerName;

	let tableData: TableSource = {
		head: [],
		body: []
	};

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
		//console.log('[herostats page.svelte] Sort by: ', sortBy);
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
		//console.log(`promise finished ${value}`);
		matchStats = value;
		recalcTable(selectedStartDate, selectedEndDate, 'All', -1, 'All');
		handleSort(sortBy);
	});

	const recalcTable = (
		selectedStartDate: Date,
		selectedEndDate: Date,
		selectedRole: string,
		selectedHeroID: number,
		selectedPlayer: string
	) => {
		tableData = {
			head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
			body: tableMapperValues(
				recalcTableData(
					selectedStartDate,
					selectedEndDate,
					selectedRole,
					selectedHeroID,
					selectedPlayer
				),
				['name', 'games', 'wins', 'losses', 'win_percentage', 'kda', 'kills', 'deaths', 'assists']
			)
		};

		handleSort(sortBy);
	};

	function formatDateToString(date: Date) {
		//return date in format MM/DD/YYYY with type string
		return (
			(date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)) +
			'/' +
			(date.getDate() > 9 ? date.getDate() : '0' + date.getDate()) +
			'/' +
			date.getFullYear()
		);
	}

	const recalcTableData = (
		inputStartDate: Date,
		inputEndDate: Date,
		inputRole: string,
		inputHeroID: number,
		inputSelectedPlayer: string
	) => {
		let tableData: TableRow[] = [];

		let startDateUnix = new Date(inputStartDate);
		let endDateUnix = new Date(inputEndDate);

		if (
			formatDateToString(startDateUnix) == formatDateToString(new Date(0)) &&
			formatDateToString(endDateUnix) == formatDateToString(new Date())
		) {
			selectedStartDate = new Date(0);
			selectedEndDate = new Date();
		}

		if (inputSelectedPlayer == 'All') {
			matchStats.forEach((player) => {
				//filters match data for selected hero
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];

				startDateUnix = new Date(inputStartDate);
				endDateUnix = new Date(inputEndDate);

				//filter reset condition
				if (inputRole == 'All' && inputHeroID == -1 && inputSelectedPlayer == 'All') {
					selectedPlayer = 'All';
					selectedHeroID = -1;
					selectedRole = 'All';
					filteredMatchData = player.matchData;
				}
				//filter by heroID
				else if (typeof inputHeroID === 'number' && inputRole == 'All') {
					selectedRole = 'All';
					selectedPlayer = 'All';
					selectedHeroID === -1
						? (filteredMatchData = player.matchData)
						: (filteredMatchData = player.matchData.filter(
								(match: Match) => match.hero_id === inputHeroID
						  ));
				}
				//filter by heroRole
				else if (typeof inputRole === 'string' && inputHeroID == -1) {
					selectedPlayer = 'All';
					selectedHeroID = -1;
					if (inputRole === 'all' || inputRole === 'All') {
						filteredMatchData = player.matchData;
					} else {
						let filteredHeroList = heroList
							.filter((hero) => hero.roles.includes(inputRole))
							.map((item) => item.id);
						filteredMatchData = player.matchData.filter((match: Match) =>
							filteredHeroList.includes(match.hero_id)
						);
					}
				}

				//filter by Date
				filteredMatchData = filteredMatchData.filter(
					(match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
				);

				//pushObj.playerID = player.playerID;
				pushObj.name = player.playerName;
				pushObj.games = filteredMatchData.length;
				pushObj.wins = filteredMatchData.reduce(
					(acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
					0
				);
				pushObj.losses = filteredMatchData.length - pushObj.wins;
				pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
				pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
				pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
				pushObj.assists = filteredMatchData.reduce(
					(acc: number, cur: Match) => acc + cur.assists,
					0
				);
				pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

				tableData.push(pushObj);
			});

			//filter by Player
		} else {
			selectedRole = 'All';
			selectedHeroID = -1;

			heroListWithAll.forEach((hero: Hero) => {
				//filters match data for selected player
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];
				startDateUnix = new Date(inputStartDate);
				endDateUnix = new Date(inputEndDate);

				//filter by heroID
				const findPlayer = playersWeCareAbout.find(
					(element) => element.playerName === selectedPlayer
				);
				if (findPlayer != undefined) {
					let playerIndex: number = playersWeCareAbout.indexOf(findPlayer);

					filteredMatchData = matchStats[playerIndex].matchData.filter(
						(match: Match) => match.hero_id === hero.id
					);
					filteredMatchData = filteredMatchData.filter(
						(match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
					);

					pushObj.name = hero.localized_name;
					pushObj.games = filteredMatchData.length;
					pushObj.wins = filteredMatchData.reduce(
						(acc: number, cur: Match) =>
							acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
						0
					);
					pushObj.losses = filteredMatchData.length - pushObj.wins;
					pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
					pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
					pushObj.deaths = filteredMatchData.reduce(
						(acc: number, cur: Match) => acc + cur.deaths,
						0
					);
					pushObj.assists = filteredMatchData.reduce(
						(acc: number, cur: Match) => acc + cur.assists,
						0
					);
					pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

					tableData.push(pushObj);
				} else {
					throw new TypeError('Error selecting player!');
				}
			});
		}

		return tableData;
	};

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

{#await data.streamed.matchStats || true}
	<div class="m-8 w-full">
		<Loading />
	</div>
{:then matchStats}
	<div id="tablePageContainer" class="m-4 md:mx-10 md:my-4 w-full w-max-[80%]">
		<!-- Header-->
		<div id="header" class="container mx-auto md:my-2 my-1">
			<div class="flex items-center justify-around space-x-4">
				<div class="flex flex-col items-center">
					<h1 class="h1 text-primary-500">Hero Stats</h1>
					<div class="flex justify-center items-center space-x-8 my-2 max-md:hidden">
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

		<TabGroup justify="justify-center">
			<Tab bind:group={tabSet} name="tab1" value={0}>
				<svelte:fragment slot="lead"
					><div class="flex justify-center ml-2">
						<div class="d2mh axe" />
					</div></svelte:fragment
				>
				<span>Heroes</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab1" value={1}>
				<svelte:fragment slot="lead"
					><div class="flex justify-center ml-2">
						<img src={Knight} class="w-8" alt="Knight icon" />
					</div></svelte:fragment
				>
				<span>Players</span>
			</Tab>

			<!-- Tab Panels --->
			<svelte:fragment slot="panel">
				{#if tabSet === 0}
					(tab panel 1 contents)
				{:else if tabSet === 1}
					(tab panel 2 contents)
				{:else if tabSet === 2}
					(tab panel 3 contents)
				{/if}
			</svelte:fragment>
		</TabGroup>

		<!-- Filter elements -->
		<div class="container mx-auto p-4">
			<div class="max-md:flex-col flex justify-center items-center md:space-x-2 max-md:space-y-2">
				<div
					class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
				>
					<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Hero</p>
					<select
						class="select select-sm variant-ghost-surface w-full"
						bind:value={selectedHeroID}
						on:change={() =>
							recalcTable(selectedStartDate, selectedEndDate, 'All', selectedHeroID, 'All')}
					>
						{#each heroList as hero}
							<option value={hero.id}>{hero.localized_name}</option>
						{/each}
					</select>
				</div>
				<div
					class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
				>
					<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Role</p>
					<select
						class="select select-sm variant-ghost-surface"
						bind:value={selectedRole}
						on:change={() =>
							recalcTable(selectedStartDate, selectedEndDate, selectedRole, -1, 'All')}
					>
						{#each heroRoles as role}
							<option>{role}</option>
						{/each}
					</select>
				</div>
				<div
					class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
				>
					<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Player</p>
					<select
						class="select select-sm variant-ghost-surface w-full"
						bind:value={selectedPlayer}
						on:change={() =>
							recalcTable(selectedStartDate, selectedEndDate, 'All', -1, selectedPlayer)}
					>
						{#each playersWeCareAbout as player}
							<option>{player.playerName}</option>
						{/each}
					</select>
				</div>
				<div
					class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
				>
					<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">
						Start Date
					</p>
					<input
						type="date"
						class="select select-sm variant-ghost-surface w-full"
						bind:value={selectedStartDate}
						on:change={() =>
							recalcTable(
								selectedStartDate,
								selectedEndDate,
								selectedRole,
								selectedHeroID,
								selectedPlayer
							)}
					/>
				</div>
				<div
					class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
				>
					<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">
						End Date
					</p>
					<input
						type="date"
						class="select select-sm variant-ghost-surface w-full"
						bind:value={selectedEndDate}
						on:change={() =>
							recalcTable(
								selectedStartDate,
								selectedEndDate,
								selectedRole,
								selectedHeroID,
								selectedPlayer
							)}
					/>
				</div>
				<div class="flex md:flex-col justify-around items-center w-full md:space-x-1 mt-6">
					<button
						type="button"
						class="btn variant-ringed-error"
						on:click={() =>
							(sortBy = {
								sortObj: sortMap.filter((item) => item.headerText === 'Games')[0],
								ascending: false
							})}
						on:click={() => recalcTable(new Date(0), new Date(), 'All', -1, 'All')}
						>Reset Table</button
					>
				</div>
			</div>
		</div>

		<!-- Skeleton table styling -->
		<!-- Responsive Container (recommended) -->
		<div class="table-container">
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
				<!-- <tfoot>
			<tr>
				<th colspan="3">Calculated Total Weight</th>
				<td>test</td>
			</tr>
		</tfoot> -->
			</table>
		</div>
	</div>
{:catch error}
	{error.message}
{/await}
