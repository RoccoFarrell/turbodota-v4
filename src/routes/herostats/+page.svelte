<script lang="ts">
	import type { PageData } from './$types';
	import type { Hero } from '@prisma/client';

	// Components
	import Loading from '$lib/components/Loading.svelte';
	import StatsTable from '$lib/components/herostats/StatsTable.svelte';

	// Helpers
	import winOrLoss from '$lib/helpers/winOrLoss';
	import { filterMatchesByGameMode } from '$lib/helpers/herostats';

	// Constants
	import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout';
	import { heroRoles } from '$lib/constants/heroRoles';

	// Stores
	import { sortData } from '$lib/stores/sortData';

	// TableSource type
	type TableSource = {
		head: string[];
		body: any[][];
	};

	// Helper function to map table data values
	function tableMapperValues(data: any[], keys: string[]): any[][] {
		return data.map(item => keys.map(key => item[key]));
	}

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	console.log(`[herostats page.svelte]`, data);

	/* Hero List */
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

	/* Table Row class */
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

	/* Local view state */
	let activeView: 'heroes' | 'players' = $state('heroes');

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
		{ headerText: 'Player', headerKey: 'player', index: 0 },
		{ headerText: 'Hero', headerKey: 'hero', index: 0 },
		{ headerText: 'Games', headerKey: 'games', index: 1 },
		{ headerText: 'Wins', headerKey: 'wins', index: 2 },
		{ headerText: 'Losses', headerKey: 'losses', index: 3 },
		{ headerText: 'Win %', headerKey: 'win_percentage', index: 4 },
		{ headerText: 'KDA', headerKey: 'kda', index: 5 },
		{ headerText: 'Kills', headerKey: 'kills', index: 6 },
		{ headerText: 'Deaths', headerKey: 'deaths', index: 7 },
		{ headerText: 'Assists', headerKey: 'assists', index: 8 }
	];

	function handleSort(sortBy: SortBy) {
		tableData = {
			head: tableData.head,
			body: tableData.body.sort((a: any, b: any) => {
				if (a[sortBy.sortObj.index] < b[sortBy.sortObj.index]) return sortBy.ascending ? -1 : 1;
				else return sortBy.ascending ? 1 : -1;
			})
		};
	}

	/* Match stats */
	let matchStats: MatchStats[] = [];

	const generateMatchStatsArr = async () => {
		let userDataArray: MatchStats[] = [];
		let apiResults = await Promise.all(
			Object.keys(data.streamed.separatedMatchStats).map((playerID: any) => {
				return data.streamed.separatedMatchStats[playerID];
			})
		);

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

	// Call generateMatchStatsArr ONCE and store the promise
	const matchStatsPromise = generateMatchStatsArr();

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
		let tableData: TableRow[] = [];

		let startDateUnix = $sortData.startDate === '' ? new Date(0) : new Date($sortData.startDate);
		let endDateUnix = new Date($sortData.endDate);

		if ($sortData.selectedPlayer == 'All') {
			matchStats.forEach((player) => {
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];

				// Filter by heroID
				if ($sortData.heroID != -1) {
					$sortData.role = 'All';
					$sortData.selectedPlayer = 'All';
					filteredMatchData = player.matchData.filter((match: Match) => match.hero_id === $sortData.heroID);
				}
				// Filter by heroRole
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

				// Filter by game mode
				filteredMatchData = filterMatchesByGameMode(filteredMatchData, $sortData.gameMode);

				// Filter by date
				filteredMatchData = filteredMatchData.filter(
					(match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
				);

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
		} else {
			// Player view
			$sortData.heroID = -1;

			heroListWithAll.forEach((hero: Hero) => {
				let pushObj: TableRow = new TableRow();

				let filteredMatchData = [];

				const findPlayer = playersWeCareAbout.find((element) => element.playerName === $sortData.selectedPlayer);
				if (findPlayer != undefined) {
					let playerIndex: number = playersWeCareAbout.indexOf(findPlayer);

					filteredMatchData = matchStats[playerIndex].matchData.filter((match: Match) => match.hero_id === hero.id);

					// Filter by game mode
					filteredMatchData = filterMatchesByGameMode(filteredMatchData, $sortData.gameMode);

					// Filter by date
					filteredMatchData = filteredMatchData.filter(
						(match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
					);

					if (typeof $sortData.role === 'string' && $sortData.heroID == -1) {
						if ($sortData.role === 'all' || $sortData.role === 'All') {
							// no additional filter
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

			// Filter out zero-game heroes in player view
			tableData = tableData.filter(row => row.games > 0);
		}

		return tableData;
	};
</script>

<div class="m-4 md:mx-8 md:my-4 w-full max-w-[90%]">
	<!-- Header -->
	<div class="text-center">
		<h1 class="hud-glow text-4xl md:text-5xl font-extrabold uppercase tracking-wider text-amber-400">
			HERO STATS
		</h1>
		<p class="text-[10px] tracking-[0.3em] text-amber-700/60 uppercase mt-1">
			ONLY THE TRUE KING WILL RULE
		</p>
	</div>

	<!-- Player Loading Indicators -->
	<div class="flex items-center justify-center gap-1.5 my-3">
		{#each data.playersWeCareAbout as player}
			{#await data.streamed.separatedMatchStats[player.playerID]}
				<div class="w-7 h-7 rounded-full flex items-center justify-center border border-amber-800/40 text-amber-800/40 text-[10px] font-bold animate-pulse">
					{player.playerName[0]}
				</div>
			{:then}
				<div class="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-bold">
					{player.playerName[0]}
				</div>
			{/await}
		{/each}
	</div>

	<!-- Mode Selector -->
	<div class="flex justify-center my-4">
		<div class="border border-amber-800/40 rounded-lg overflow-hidden inline-flex">
			<button
				class="px-5 py-2 font-bold uppercase tracking-wider text-sm transition-all duration-150 {$sortData.gameMode === 'ranked' ? 'bg-amber-500 text-black mode-btn-active' : 'bg-black/40 text-slate-400 hover:text-amber-300 hover:bg-amber-950/30'}"
				onclick={() => { sortData.setGameMode('ranked'); recalcTable(); }}
			>RANKED</button>
			<button
				class="px-5 py-2 font-bold uppercase tracking-wider text-sm transition-all duration-150 {$sortData.gameMode === 'turbo' ? 'bg-amber-500 text-black mode-btn-active' : 'bg-black/40 text-slate-400 hover:text-amber-300 hover:bg-amber-950/30'}"
				onclick={() => { sortData.setGameMode('turbo'); recalcTable(); }}
			>TURBO</button>
			<button
				class="px-5 py-2 font-bold uppercase tracking-wider text-sm transition-all duration-150 {$sortData.gameMode === 'all' ? 'bg-amber-500 text-black mode-btn-active' : 'bg-black/40 text-slate-400 hover:text-amber-300 hover:bg-amber-950/30'}"
				onclick={() => { sortData.setGameMode('all'); recalcTable(); }}
			>ALL</button>
		</div>
	</div>

	<!-- View Toggle -->
	<div class="flex justify-center gap-6 mb-4">
		<button
			class="uppercase tracking-wider text-sm px-4 py-2 {activeView === 'heroes' ? 'border-b-2 border-amber-400 text-amber-400' : 'border-b-2 border-transparent text-slate-500 hover:text-slate-300'}"
			onclick={() => { activeView = 'heroes'; sortData.setSelectedPlayer('All'); sortData.setHeroID(-1); recalcTable(); }}
		>Heroes</button>
		<button
			class="uppercase tracking-wider text-sm px-4 py-2 {activeView === 'players' ? 'border-b-2 border-amber-400 text-amber-400' : 'border-b-2 border-transparent text-slate-500 hover:text-slate-300'}"
			onclick={() => { activeView = 'players'; sortData.setSelectedPlayer('Rocco'); recalcTable(); }}
		>Players</button>
	</div>

	<!-- Content -->
	{#await matchStatsPromise}
		<div class="flex justify-center my-8">
			<Loading />
		</div>
	{:then}
		<!-- Filter Bar -->
		<div class="flex flex-wrap items-end gap-3 justify-center my-4 px-4">
			{#if activeView === 'heroes'}
				<!-- Hero dropdown -->
				<div class="flex flex-col">
					<label class="text-[10px] uppercase tracking-wider text-amber-600/60 mb-1">Hero</label>
					<select
						class="bg-black/30 border border-amber-900/30 text-slate-300 text-sm rounded px-2 py-1.5 focus:border-amber-500/50 focus:outline-none"
						bind:value={$sortData.heroID}
						onchange={() => { $sortData.role = 'All'; recalcTable(); }}
					>
						{#each heroList as hero}
							<option value={hero.id}>{hero.localized_name}</option>
						{/each}
					</select>
				</div>
			{:else}
				<!-- Player dropdown -->
				<div class="flex flex-col">
					<label class="text-[10px] uppercase tracking-wider text-amber-600/60 mb-1">Player</label>
					<select
						class="bg-black/30 border border-amber-900/30 text-slate-300 text-sm rounded px-2 py-1.5 focus:border-amber-500/50 focus:outline-none"
						bind:value={$sortData.selectedPlayer}
						onchange={() => recalcTable()}
					>
						{#each playersWeCareAbout as player}
							<option>{player.playerName}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Role dropdown -->
			<div class="flex flex-col">
				<label class="text-[10px] uppercase tracking-wider text-amber-600/60 mb-1">Role</label>
				<select
					class="bg-black/30 border border-amber-900/30 text-slate-300 text-sm rounded px-2 py-1.5 focus:border-amber-500/50 focus:outline-none"
					bind:value={$sortData.role}
					onchange={() => { $sortData.heroID = -1; recalcTable(); }}
				>
					{#each heroRoles as role}
						<option>{role}</option>
					{/each}
				</select>
			</div>

			<!-- Start Date -->
			<div class="flex flex-col">
				<label class="text-[10px] uppercase tracking-wider text-amber-600/60 mb-1">Start Date</label>
				<input
					type="date"
					class="bg-black/30 border border-amber-900/30 text-slate-300 text-sm rounded px-2 py-1.5 focus:border-amber-500/50 focus:outline-none"
					bind:value={$sortData.startDate}
					onchange={() => recalcTable()}
				/>
			</div>

			<!-- End Date -->
			<div class="flex flex-col">
				<label class="text-[10px] uppercase tracking-wider text-amber-600/60 mb-1">End Date</label>
				<input
					type="date"
					class="bg-black/30 border border-amber-900/30 text-slate-300 text-sm rounded px-2 py-1.5 focus:border-amber-500/50 focus:outline-none"
					bind:value={$sortData.endDate}
					onchange={() => recalcTable()}
				/>
			</div>

			<!-- Reset button -->
			<button
				class="border border-red-800/40 text-red-400 hover:bg-red-900/20 rounded px-3 py-1.5 text-sm uppercase tracking-wider transition-colors"
				onclick={() => {
					sortBy = {
						sortObj: sortMap.filter((item) => item.headerText === 'Games')[0],
						ascending: false
					};
					sortData.reset();
					recalcTable();
				}}
			>Reset</button>
		</div>

		<!-- Stats Table -->
		<div class="border-t-2 border-amber-500/40 mt-2">
			<StatsTable {tableData} {sortBy} selectedPlayer={$sortData.selectedPlayer} />
		</div>
	{:catch error}
		<p class="text-red-400 text-center my-8">{error.message}</p>
	{/await}
</div>

<style>
	.hud-glow {
		text-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1);
	}
	.mode-btn-active {
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
	}
</style>
