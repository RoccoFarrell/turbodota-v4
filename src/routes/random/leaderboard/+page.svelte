<script lang="ts">
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

	//format leaderboard data
	class LeaderboardRow {
		playerID: number = 0;
		name: string = '';
		wins: number = 0;
		losses: number = 0;
		kdaWins: number = 0;
		kdaLosses: number = 0;
		goldWon: number = 0;
		goldLost: number = 0;
	}

	/* 
        Table source defaults
    */
	let tableSource: TableSource = {
		head: ['player', 'name', 'wins', 'losses', 'Gold Won', 'Gold Lost', 'KDA In Wins', 'KDA In Losses'],
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
            console.log('looping through playerID: ', playerID)
			let row: LeaderboardRow = new LeaderboardRow();

			let playerRandoms = data.randoms.filter((random) => (random.account_id === playerID && random.active === false));
			if (playerRandoms.length > 0) {
				row.playerID = playerID;
				row.name = playerRandoms[0].user ? playerRandoms[0].user.username : '';

				/* calculate wins and losses */
				let winCount = playerRandoms.reduce((acc, cur) => (cur.win ? (acc += 1) : (acc += 0)), 0);
				let lossCount = playerRandoms.reduce((acc, cur) => (!cur.win ? (acc += 1) : (acc += 0)), 0);
				row.wins = winCount;
				row.losses = lossCount;

				let kdaWins = 0,
					kdaLosses = 0;

				/* 
                    Sum all KDAs in wins and losses
                */
				playerRandoms.forEach((random) => {
					if (random.match && random.win) {
						kdaWins += (random.match.kills + random.match.assists) / random.match.deaths;
					} else if (random.match && !random.win) {
						kdaLosses += (random.match.kills + random.match.assists) / random.match.deaths;
					}
				});
				row.kdaWins = kdaWins / winCount;
				row.kdaLosses = kdaLosses / lossCount;

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

                console.log(`pushing row for ${row.name}`)
				tableData.push(row);
			}
		});

		/* 
            Set table data
        */

		console.log(tableData);

        /* 
            Sort by gold 
        */

        tableData = tableData.sort((a: any, b: any) => {
            if(a.goldWon < b.goldWon) return 1
            else return -1
        })

		tableSource = {
			head: tableSource.head,
			body: tableMapperValues(tableData, [
				'playerID',
				'name',
				'wins',
				'losses',
				'goldWon',
				'goldLost',
				'kdaWins',
				'kdaLosses'
			])
		};
	}

    /* 
        Handle header click
    */

    const headerSelect = (header: any) => {
        console.log(header)
    }
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center space-y-2 md:mx-8 mx-2">
		<div class="flex justify-around items-center w-3/4">
			<h1 class="h1 text-primary-700 max-md:font-bold">The Walker Random™</h1>
			{#if data.session && data.session.user}
				<div class="text-xs">
					Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
				</div>
			{/if}
		</div>
		<Table interactive={true} source={tableSource} on:selected={headerSelect} regionHeadCell={"text-center text-primary-500 font-semibold"}/>
	</div>
</div>
