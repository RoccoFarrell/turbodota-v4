<script lang="ts">
	import { handlers } from 'svelte/legacy';

	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import type { Hero } from '@prisma/client';

	//components
	import { Tabs, Progress } from '@skeletonlabs/skeleton-svelte';
	
	// TableSource type (might need to be defined locally if not exported)
	type TableSource = {
		head: string[];
		body: any[][];
	};
	
	// Helper function to map table data values
	function tableMapperValues(data: any[], keys: string[]): any[][] {
		return data.map(item => keys.map(key => item[key]));
	}
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

	
	interface Props {
		//page data
		data: PageData;
	}

	let { data }: Props = $props();

	console.log(`[herostats page.svelte]`, data);
	//console.log(page);

	/* 
		Hero List
	*/
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

	/* 
		End hero list
	*/

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

	// Note: Skeleton v3 Tabs manages state internally - no need for tabSet variable

	let tableData: TableSource = $state({
		head: [],
		body: []
	});

	let sortBy: SortBy = $state({
		sortObj: {
			headerText: 'Games',
			headerKey: 'games',
			index: 1
		},
		ascending: false
	});

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

	//helper functions

	let matchStats: MatchStats[] = [];
	// data.streamed.matchStats.then((value) => {
	// 	//console.log(`promise finished ${value}`);
	// 	matchStats = value;
	// 	recalcTable();
	// 	handleSort(sortBy);
	// });

	const generateMatchStatsArr = async () => {
		let userDataArray: MatchStats[] = [];
		let apiResults = await Promise.all(
			Object.keys(data.streamed.separatedMatchStats).map((playerID: any) => {
				return data.streamed.separatedMatchStats[playerID];
			})
		);

		//console.log(`apiResults: `, apiResults)

		apiResults.forEach((result) => {
			userDataArray.push({
				playerID: result.account_id,
				playerName: result.playerName,
				matchData: result.matchData,
				dataSource: result.dataSource,
				od_url: result.od_url
			});
		});

		matchStats = userDataArray;
		recalcTable();
		handleSort(sortBy);
		return userDataArray;
	};

	const recalcTable = () => {
		tableData = {
			head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
			body: tableMapperValues(recalcTableData(), [
				'name',
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
							filteredMatchData = filteredMatchData.filter((match: Match) => filteredHeroList.includes(match.hero_id));
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

<div id="tablePageContainer" class="m-4 md:mx-8 md:my-4 w-full max-w-[90%]">
	<div>
		<!-- Header-->
		 
		<div id="header" class="container mx-auto md:my-2 my-1">
			<div class="flex items-center justify-around ">
				<div class="flex flex-col items-center">
					<h1 class="h1 text-primary-500">Hero Stats</h1>
					<div class="flex justify-center items-center space-x-8 my-2 max-md:hidden">
						<h3 class="h3">ONLY THE TRUE KING WILL RULE</h3>
						<img class="w-8 lg:w-12" alt="turboking" src={turboking} />
					</div>
				</div>
				<!--Development stats-->
				<div>
					{#each data.playersWeCareAbout as player}
						<div class="flex flex-col">
							<div class="grid grid-cols-2 gap-4 text-xs">
								<div>
									<p class="text-primary-500">
										{player.playerName}:
									</p>
								</div>
								<div >
									{#await data.streamed.separatedMatchStats[player.playerID]}
										<div class="placeholder"></div>
									{:then playerStats}
										<p class="text-secondary-500">complete - {playerStats.matchData.length} matches</p>
									{/await}
								</div>
							</div>
						</div>
					{/each}
				</div>
				<!-- <div class="flex flex-col">
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
				</div> -->
			</div>
		</div>

		<Tabs 
			defaultValue="heroes"
			onValueChange={(details) => {
				if (details.value === 'heroes') {
					sortData.setSelectedPlayer('All');
					sortData.setHeroID(-1);
					recalcTable();
				} else if (details.value === 'players') {
					sortData.setSelectedPlayer('Rocco');
					recalcTable();
				}
			}}
		>
			<Tabs.List class="justify-center">
				<Tabs.Trigger value="heroes">
					<div class="flex justify-center ml-2">
						<div class="d2mh axe"></div>
					</div>
					<span>Heroes</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="players">
					<div class="flex justify-center ml-2">
						<img src={Knight} class="w-8" alt="Knight icon" />
					</div>
					<span>Players</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Heroes Tab Panel -->
			<Tabs.Content value="heroes">
					<div class="flex flex-col justify-center">
						{#await generateMatchStatsArr()}
							<div class="m-8 w-full">
								<Loading />
							</div>
						{:then matchStats}
							<div class="flex justify-center items-center gap-4 my-4">
								{#if $sortData.heroID === -1}
									<span class="text-2xl font-bold text-amber-500">All Heroes</span>
								{:else}
									{#each heroList as hero}
										{#if hero.id === $sortData.heroID}
											<div class="flex items-center gap-4">
												<div class="d2mh {hero.name?.toLowerCase()}"></div>
												<span class="text-2xl font-bold text-amber-500">{hero.localized_name}</span>
											</div>
										{/if}
									{/each}
								{/if}
							</div>
							<!-- Filter elements -->
							<div class="container mx-auto p-4">
								<div class="max-md:flex-col flex justify-center items-center md:space-x-2 max-md:space-y-2">
									<div
										class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
									>
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Hero</p>
										<select
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.heroID}
											onchange={handlers(() => ($sortData.role = 'All'), () => recalcTable())}
										>
											{#each heroList as hero}
												<option value={hero.id}>{hero.localized_name}</option>
											{/each}
										</select>
									</div>
									<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Role</p>
										<select
											class="select select-sm preset-tonal-surface border border-surface-500"
											bind:value={$sortData.role}
											onchange={handlers(() => ($sortData.heroID = -1), () => recalcTable())}
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
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.startDate}
											onchange={() => recalcTable()}
										/>
									</div>
									<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">End Date</p>
										<input
											type="date"
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.endDate}
											onchange={() => recalcTable()}
										/>
									</div>
									<div class="flex md:flex-col justify-around items-center w-full md:space-x-1 mt-6">
										<button
											type="button"
											class="btn preset-outlined-error-500"
											onclick={handlers(() =>
											(sortBy = {
												sortObj: sortMap.filter((item) => item.headerText === 'Games')[0],
												ascending: false
											}), () => {
											sortData.reset();
											recalcTable();
										})}>Reset Table</button
										>
									</div>
								</div>
							</div>

							<!-- Skeleton table styling -->
							<div class="table-container overflow-hidden mx-auto">
								<StatsTable {tableData} {sortBy} />
							</div>
						{:catch error}
							{error.message}
						{/await}
					</div>
			</Tabs.Content>

			<!-- Players Tab Panel -->
			<Tabs.Content value="players">
					<div class="flex flex-col justify-center">
						{#await generateMatchStatsArr()}
							<div class="m-8 w-full">
								<Loading />
							</div>
						{:then matchStats}
							<!-- Filter elements -->
							<div class="container mx-auto p-4">
								<div class="max-md:flex-col flex justify-center items-center md:space-x-2 max-md:space-y-2">
									<div
										class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center"
									>
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Player</p>
										<select
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.selectedPlayer}
											onchange={() => recalcTable()}
										>
											{#each playersWeCareAbout as player}
												<option>{player.playerName}</option>
											{/each}
										</select>
									</div>
									<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">Role</p>
										<select
											class="select select-sm preset-tonal-surface border border-surface-500"
											bind:value={$sortData.role}
											onchange={handlers(() => ($sortData.heroID = -1), () => recalcTable())}
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
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.startDate}
											onchange={() => recalcTable()}
										/>
									</div>
									<div class="flex md:flex-col max-sm:justify-around items-center w-full md:space-x-1 md:justify-center">
										<p class="w-full inline text-primary-500 font-bold max-sm:w-1/4 md:text-center">End Date</p>
										<input
											type="date"
											class="select select-sm preset-tonal-surface border border-surface-500 w-full"
											bind:value={$sortData.endDate}
											onchange={() => recalcTable()}
										/>
									</div>
									<div class="flex md:flex-col justify-around items-center w-full md:space-x-1 mt-6">
										<button
											type="button"
											class="btn preset-outlined-error-500"
											onclick={handlers(() =>
											(sortBy = {
												sortObj: sortMap.filter((item) => item.headerText === 'Games')[0],
												ascending: false
											}), () => {
											sortData.reset();
											recalcTable();
										})}>Reset Table</button
										>
									</div>
								</div>
							</div>

							<!-- Skeleton table styling -->
							<div class="table-container overflow-hidden mx-auto">
								<StatsTable {tableData} {sortBy} />
							</div>
						{:catch error}
							{error.message}
						{/await}
					</div>
			</Tabs.Content>
		</Tabs>
	</div>
</div>
