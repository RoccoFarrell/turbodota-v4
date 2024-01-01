import { Prisma } from '@prisma/client'
import type { Random } from '@prisma/client';

type RandomWithUsersAndMatch = Prisma.RandomGetPayload<{
    include: {
        match: true,
        user: true,
        seasons: {
            include: {
                _count: {
                    select: { randoms: true}
                }
            }
        }
    }
  }>

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

const calculateRandomLeaderboard = (inputRandoms: RandomWithUsersAndMatch[]) => {
	/* 
        Get all unique player IDs in random database
    */
	let uniqueIDs = inputRandoms.map((random) => random.account_id).filter((random, i, arr) => arr.indexOf(random) === i);
	//console.log(uniqueIDs);

	//console.log(uniqueIDs);

	console.log(`Parsing ${inputRandoms.length} randoms`);
	let randomTotals = {};
	let tableData: LeaderboardRow[] = [];

	/* 
            Loop through unique IDs generated above
        */
	uniqueIDs.forEach((playerID) => {
		//console.log('looping through playerID: ', playerID);
		let row: LeaderboardRow = new LeaderboardRow();

		let playerRandoms = inputRandoms.filter((random) => random.account_id === playerID && random.active === false);
		if (playerRandoms.length > 0) {
			row.player = playerID;
			row.name = playerRandoms[0].user ? playerRandoms[0].user.username : '';

			/* calculate wins and losses */
			let winCount = playerRandoms.reduce((acc, cur) => (cur.win ? (acc += 1) : (acc += 0)), 0);
			let lossCount = playerRandoms.reduce((acc, cur) => (!cur.win ? (acc += 1) : (acc += 0)), 0);
			row.wins = winCount;
			row.losses = lossCount;
			row.win_percentage = parseFloat((row.wins / (row.wins + row.losses)).toFixed(2));

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
			};
			playerRandoms.forEach((random) => {
				if (random.match) {
					kdaCalcs.total.kills += random.match.kills;
					kdaCalcs.total.deaths += random.match.deaths;
					kdaCalcs.total.assists += random.match.assists;
					if (random.win) {
						kdaCalcs.wins.kills += random.match.kills;
						kdaCalcs.wins.deaths += random.match.deaths;
						kdaCalcs.wins.assists += random.match.assists;
					} else if (!random.win) {
						kdaCalcs.losses.kills += random.match.kills;
						kdaCalcs.losses.deaths += random.match.deaths;
						kdaCalcs.losses.assists += random.match.assists;
					}
				}
			});
			row.kdaTotal = parseFloat(((kdaCalcs.total.kills + kdaCalcs.total.assists) / kdaCalcs.total.deaths).toFixed(2)) || 0;
			row.kdaWins = parseFloat(((kdaCalcs.wins.kills + kdaCalcs.wins.assists) / kdaCalcs.wins.deaths).toFixed(2)) || 0;
			row.kdaLosses = parseFloat(((kdaCalcs.losses.kills + kdaCalcs.losses.assists) / kdaCalcs.losses.deaths).toFixed(2)) || 0;

			/* 
                    Gold calculations
                */

			row.goldWon = playerRandoms.reduce((acc, cur) => (cur.win && cur.endGold ? (acc += cur.endGold) : (acc += 0)), 0);
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

    return tableData
};

export { calculateRandomLeaderboard }