<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';

	//components
	import { Table, tableSourceValues, tableMapperValues, ProgressRadial, filter, TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import Loading from '$lib/components/Loading.svelte';

	import StatsTable from '$lib/components/herostats/StatsTable.svelte';

	//images
	import turboking from '$lib/assets/turboking.png';
	import Knight from '$lib/assets/knight.png';

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';

	//constants
	import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout';
	import { heroRoles } from '$lib/constants/heroRoles';

	//stores
	import { sortData } from '$lib/stores/sortData';

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

	let tabSet: number = 0;

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
		recalcTable();
		handleSort(sortBy);
	});

	const recalcTable = () => {
		tableData = {
			head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
			body: tableMapperValues(recalcTableData(), ['name', 'games', 'wins', 'losses', 'win_percentage', 'kda', 'kills', 'deaths', 'assists'])
		};

		handleSort(sortBy);
	};

	const recalcTableData = () => {
		//console.log($sortData);
		let tableData: TableRow[] = [];

		let startDateUnix = $sortData.startDate === '' ? new Date(0) : new Date($sortData.startDate);
		let endDateUnix = new Date($sortData.endDate);

		if ($sortData.selectedPlayer == 'All') {
			matchStats.forEach((player) => {
				//filters match data for selected hero
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];

				//filter by heroID
				if ($sortData.heroID != -1) {
					$sortData.role = 'All';
					$sortData.selectedPlayer = 'All';
					filteredMatchData = player.matchData.filter((match: Match) => match.hero_id === $sortData.heroID);
				}
				//filter by heroRole
				else if ($sortData.role != 'All') {
					$sortData.selectedPlayer = 'All';
					$sortData.heroID = -1;
					if ($sortData.role === 'all' || $sortData.role === 'All') {
						filteredMatchData = player.matchData;
					} else {
						let filteredHeroList = heroList
							.filter((hero) => hero.roles.includes($sortData.role))
							.map((item) => item.id);
						filteredMatchData = player.matchData.filter((match: Match) => filteredHeroList.includes(match.hero_id));
					}
				} else {
					filteredMatchData = player.matchData;
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
				pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0);
				pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

				tableData.push(pushObj);
			});

			//filter by Player
		} else {
			//$sortData.role = 'All';
			$sortData.heroID = -1;

			heroListWithAll.forEach((hero: Hero) => {
				//filters match data for selected player
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];

				//filter by heroID
				const findPlayer = playersWeCareAbout.find((element) => element.playerName === $sortData.selectedPlayer);
				if (findPlayer != undefined) {
					let playerIndex: number = playersWeCareAbout.indexOf(findPlayer);

					filteredMatchData = matchStats[playerIndex].matchData.filter((match: Match) => match.hero_id === hero.id);
					filteredMatchData = filteredMatchData.filter(
						(match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
					);

					if (typeof $sortData.role === 'string' && $sortData.heroID == -1) {
						if ($sortData.role === 'all' || $sortData.role === 'All') {
							//filteredMatchData = player.matchData;
						} else {
							let filteredHeroList = heroList
								.filter((hero) => hero.roles.includes($sortData.role))
								.map((item) => item.id);
							filteredMatchData = filteredMatchData.filter((match: Match) =>
								filteredHeroList.includes(match.hero_id)
							);
						}
					}

					pushObj.name = hero.localized_name;
					pushObj.games = filteredMatchData.length;
					pushObj.wins = filteredMatchData.reduce(
						(acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
						0
					);
					pushObj.losses = filteredMatchData.length - pushObj.wins;
					pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
					pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
					pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
					pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0);
					pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

					tableData.push(pushObj);
				} else {
					throw new TypeError('Error selecting player!');
				}
			});
		}

		return tableData;
	};
</script>

{#await data.streamed.matchStats || true}
	<div class="m-8 w-full">
		<Loading />
	</div>
{:then matchStats}
	<div id="tablePageContainer" class="m-4 md:mx-8 md:my-4 w-full max-w-[90%]">
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
			<Tab
				bind:group={tabSet}
				name="tab1"
				value={0}
				on:click={() => {
					sortData.setSelectedPlayer('All');
					sortData.setHeroID(-1);
					recalcTable();
				}}
			>
				<svelte:fragment slot="lead"
					><div class="flex justify-center ml-2">
						<div class="d2mh axe" />
					</div></svelte:fragment
				>
				<span>Heroes</span>
			</Tab>
			<Tab
				bind:group={tabSet}
				name="tab1"
				value={1}
				on:click={() => {
					sortData.setSelectedPlayer('Rocco');
					recalcTable();
				}}
			>
				<svelte:fragment slot="lead"
					><div class="flex justify-center ml-2">
						<img src={Knight} class="w-8" alt="Knight icon" />
					</div></svelte:fragment
				>
				<span>Players</span>
			</Tab>

			<!-- Tab Panels --->
			<svelte:fragment slot="panel">
				<div class="flex flex-col justify-center">
					<!-- Filter elements -->
					<div class="container mx-auto p-4">
						<div class="max-md:flex-col flex justify-center items-center md:space-x-2 max-md:space-y-2">
							{#if tabSet === 0}
								<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
									<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Hero</p>
									<select
										class="select select-sm variant-ghost-surface w-full"
										bind:value={$sortData.heroID}
										on:change={() => ($sortData.role = 'All')}
										on:change={() => recalcTable()}
									>
										{#each heroList as hero}
											<option value={hero.id}>{hero.localized_name}</option>
										{/each}
									</select>
								</div>
							{/if}
							{#if tabSet === 1}
								<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
									<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Player</p>
									<select
										class="select select-sm variant-ghost-surface w-full"
										bind:value={$sortData.selectedPlayer}
										on:change={() => recalcTable()}
									>
										{#each playersWeCareAbout as player}
											<option>{player.playerName}</option>
										{/each}
									</select>
								</div>
							{/if}
							<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
								<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Role</p>
								<select
									class="select select-sm variant-ghost-surface"
									bind:value={$sortData.role}
									on:change={() => ($sortData.heroID = -1)}
									on:change={() => recalcTable()}
								>
									{#each heroRoles as role}
										<option>{role}</option>
									{/each}
								</select>
							</div>

							<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
								<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Start Date</p>
								<input
									type="date"
									class="select select-sm variant-ghost-surface w-full"
									bind:value={$sortData.startDate}
									on:change={() => recalcTable()}
								/>
							</div>
							<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
								<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">End Date</p>
								<input
									type="date"
									class="select select-sm variant-ghost-surface w-full"
									bind:value={$sortData.endDate}
									on:change={() => recalcTable()}
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
									on:click={() => {
										sortData.reset();
										recalcTable();
									}}>Reset Table</button
								>
							</div>
						</div>
					</div>

					<!-- Skeleton table styling -->
					<!-- Responsive Container (recommended) -->
					<div class="table-container overflow-hidden mx-auto">
						<!-- New Component -->
						<!-- <div>{JSON.stringify($sortData)}</div>
					<div>{JSON.stringify(sortBy)}</div> -->
						<StatsTable {tableData} {sortBy} />
					</div>
				</div>
			</svelte:fragment>
		</TabGroup>
	</div>
{:catch error}
	{error.message}
{/await}
