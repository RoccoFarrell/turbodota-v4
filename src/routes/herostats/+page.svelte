<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import turboking from '$lib/assets/turboking.png';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { tableSourceValues, tableMapperValues } from '@skeletonlabs/skeleton';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	export let data: PageData;

	console.log(data);

    class TableRow {
        playerID: number = 0;
        playerName: string = "";
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
    }

	$: tableData = {
			head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
			body: tableMapperValues(recalcTable(selectedHeroID), ['playerName', 'games', 'wins', 'losses', 'win_percentage','kda', 'kills', 'deaths', 'assists'])
	};

	const recalcTable = (heroID: number = -1) => {
		console.log(heroID);

        let tableData: TableRow[] = []
		data.matchStats.forEach((player) => {
            //filters match data for selected hero
            let pushObj: TableRow = new TableRow()

            let filteredMatchData = []
            heroID === -1 ? filteredMatchData = player.matchData : filteredMatchData = player.matchData.filter((match: Match) => match.hero_id === heroID)

            pushObj.playerID = player.playerID
            pushObj.playerName = player.playerName
	        pushObj.games = filteredMatchData.length
	        pushObj.wins = filteredMatchData.reduce((acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0), 0)
	        pushObj.losses = filteredMatchData.length - pushObj.wins
	        pushObj.win_percentage = pushObj.wins / filteredMatchData.length
	        pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0)
	        pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0)
            pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0)
            pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths

            console.log(`pushObj: ${JSON.stringify(pushObj)}`)
            tableData.push(pushObj)
        });

        //console.log(`tableData: ${JSON.stringify(tableData)}`)
        //console.log(data)
		return tableData;
	};

	// let promise = Promise.resolve([]);
	// let tableData = [];
	// let selectedHero = null;

    let heroListWithAll = [...data.allHeroes, {
        id: -1,
        localized_name: "All"
    }]
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
</script>

<div class="container mx-auto p-16 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<h1 class="h1">ONLY THE TRUE KING WILL RULE</h1>
		<img class="w-32" alt="turboking" src={turboking} />
	</div>
</div>

<div class="container mx-auto p-16 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<select class="select select-sm variant-ghost-surface" bind:value={selectedHeroID}>
			{#each heroList as hero}
				<option value={hero.id}>{hero.localized_name}</option>
			{/each}
		</select>
	</div>
</div>

<div>
	<Table source={tableData} />
</div>

<!-- {#await promise}
    <ProgressRadial/>
{:then}
    
{/await} -->
