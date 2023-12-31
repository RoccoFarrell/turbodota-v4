import fetch from 'node-fetch';
import * as fs from 'fs';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';
import type { Match, DotaUser } from '@prisma/client';
import { start } from 'repl';
import { filter } from 'd3';

/* 
    Set path for APIs depending on dev or prod
*/

//!! ----------------------- !!
//DO NOT FLIP TO TRUE UNTIL WE MERGE AND FIX PROD SCHEMA
const connectToProd = false;
//!! ----------------------- !!

const apiURL_dev = "http://localhost:5173"
const apiURL_prod = "https://turbodota.com"
let apiURL = ""
connectToProd ? apiURL = apiURL_prod : apiURL = apiURL_dev
//---------------

const playersWeCareAbout = [80636612, 34940151, 113003047, 65110965, 68024789, 423076846, 67762413, 125251142];
const matchesToSkip = [
	5304085637, 5637793913, 6033233731, 4847351935, 4888455966, 5202511518, 4896520517, 4831897782, 4055542139,
	4019523324, 4068856483
];

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

const data = {
	accountIdsForCalc: [65110965, 34940151, 80636612, 113003047, 125251142, 423076846, 67762413, 68024789]
};

let headers = 'account_id,match_id,start_time,winorloss,mmrModifier \n';

fs.writeFile('mmrs.csv', headers, 'utf8', function (err) {
	if (err) {
		console.log('Some error occured - file either not saved or corrupted file saved.');
	} else {
		console.log("It's saved!");
	}
});

let winrates = await fetch(`${apiURL}/api/winrates?source=db`, {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
})
	.then((response: any) => response.json())
	.then((data: any) => {
		return data;
	});

//console.log(winrates)

async function getAllMatches(account_id: number, winrates: any, startDate: string) {
	console.log('Running: ' + account_id);
	let player_match_response: any = await fetch(`${apiURL}/api/updateMatchesForUser/${account_id}`);
	let player_match_response_object = await player_match_response.json();

	//console.log(`[api UMFU for ${account_id}] status: ${player_match_response.status}`);
	if (player_match_response.status !== 200) console.error('open dota shit the bed');

	//if start date, filter matches from API
	let filteredMatches = player_match_response_object.matchData.filter((match: Match) => {
		let matchStartRaw = Number(match.start_time);

		let matchStartTime = dayjs.unix(matchStartRaw);
		//console.log(`matchStartRaw: ${matchStartRaw} matchStartTime: ${matchStartTime}`);
		let inputStartTime = dayjs(startDate);

		//console.log(`[filteredMatches] filtering ${matchStartTime} after ${inputStartTime}`);
		return dayjs(matchStartTime.toString()).isAfter(dayjs(startDate));
	});

	console.log(`[${account_id}] - ${filteredMatches.length} matches after ${startDate}`);

	//return filteredMatches;

	let winorlossstring = 0;

	let playerMMRArr: any = [];
	//console.log(player_match_response_object);
	let j = 1;
	for (const match of filteredMatches) {
		const friendsArray = Array();
		const friendsArray2 = Array();

		if (matchesToSkip.includes(match.match_id)) {
			console.log('Skipping broken match: ' + match.match_id);
		} else {
			let send_match_for_parse_response: any = await fetch(`${apiURL}/api/matches/${match.match_id}`);
			let send_match_for_parse_response_object = await send_match_for_parse_response.json();

            //console.log(`[api /matches for ${match.match_id}] status: ${send_match_for_parse_response.status}`);
	        if (send_match_for_parse_response.status !== 200) console.error('my api shit the bed');

			//console.log("Now handling match ID: " + match.match_id)

            if(!send_match_for_parse_response_object.matchDetailResult.matchDetail.players) console.log(send_match_for_parse_response_object)
			for (const player of send_match_for_parse_response_object.matchDetailResult.matchDetail.players) {
				//console.log(player)
				if (player.account_id == account_id) {
					if (player.win == 1) {
						winorlossstring = 1;
						//console.log("Match: " +match.match_id+" resulted in a WIN")
					} else {
						winorlossstring = 0;
						//console.log("Match: " +match.match_id+" resulted in a LOSS")
					}
				}

				if (playersWeCareAbout.includes(player.account_id) && player.account_id != account_id) {
					//console.log("Found a friend to handle: " + player.account_id)
					let tempArray: any = {};
					tempArray.account_id = player.account_id;
					tempArray.hero_id = player.hero_id;
					//tempArray.win_or_loss = winorlossstring
					// if (player.win == 1) {
					//     tempArray.win_or_loss = 1
					// }
					// else {
					//     tempArray.win_or_loss = 0
					// }
					friendsArray.push(tempArray);
				}
			}
			//console.log("Friends Array To Handle: " + JSON.stringify(friendsArray))
			//console.log(winrates.insert)

			for (const item of friendsArray) {
				let tempArray: any = {};
				tempArray.account_id = item.account_id;
				tempArray.hero_id = item.hero_id;
				//tempArray.win_or_loss = item.win_or_loss
				tempArray.games = winrates.insert
					.filter((rate: any) => rate.account_id === item.account_id)[0]
					.heroesArr.filter((hero: any) => hero.hero_id === item.hero_id)[0].games;
				if (tempArray.games <= 7) {
					tempArray.win_rate = 0.5;
				} else {
					tempArray.win_rate = winrates.insert
						.filter((rate: any) => rate.account_id === item.account_id)[0]
						.heroesArr.filter((hero: any) => hero.hero_id === item.hero_id)[0].winrate;
				}
				friendsArray2.push(tempArray);
			}
			//console.log("Friends Array 2 To Handle: " + JSON.stringify(friendsArray2))

			//Do the math
			let mmrIndividualModifier = 0;
			let mmrTotalMatchModifier = 0;
			let i = 0;
			for (const item of friendsArray2) {
				if (winorlossstring == 1) {
					mmrIndividualModifier = 5 + (item.win_rate - 0.5) * 10 * -1;
					//console.log("Won match! Adding to individual modifier: " + mmrIndividualModifier)
				} else {
					mmrIndividualModifier = 5 - (item.win_rate - 0.5) * 10 * -1;
					//console.log("Lost match! Subtracting from individual modifier: " + mmrIndividualModifier)
				}
				mmrTotalMatchModifier += mmrIndividualModifier;
				//console.log("mmrTotalMatchModifier is now: " + mmrTotalMatchModifier)
				i++;
			}
			//console.log("mmrTotalMatchModifier is this before adding missing players: " + mmrTotalMatchModifier)
			mmrTotalMatchModifier = mmrTotalMatchModifier + 5 * (5 - i);
			//console.log("mmrTotalMatchModifier is this after adding missing players: " + mmrTotalMatchModifier)

			let pushObj: any = {
				match_id: match.match_id,
				start_time: match.start_time,
				win: winorlossstring === 1 ? true : false,
				mmrModifier: parseFloat(mmrTotalMatchModifier.toFixed(2))
			};

			playerMMRArr.push(pushObj);
			//allPlayers[account_id] = pushObj

			//Store the mmrTotalMatchModifier value properly
			let string =
				account_id.toString() +
				',' +
				match.match_id.toString() +
				',' +
				match.start_time.toString() +
				',' +
				winorlossstring.toString() +
				',' +
				mmrTotalMatchModifier.toString() +
				'\n';
			fs.appendFile('mmrs.csv', string, (err) => {
				if (err) {
					console.log(err);
				}
			});
		}
		//console.log('Finished match #' + j);
		j++;
		//console.log("Sleeping till next match")
		await sleep(100); //Can make this lower once it works, just used this for testing a single match lazily
	}

	return playerMMRArr;
}

let playerID = 80636612;

let playersInLeague = await prisma.league.findUnique({
	where: { id: 7 },
	include: {
		members: true
	}
});

console.log('playersInLeague: ', playersInLeague);

let scriptPromise = null;
let matchSum = 0;
if (playersInLeague) {
	scriptPromise = playersInLeague.members.map(async (player: DotaUser) => {
		let matchesResult = await getAllMatches(player.account_id, winrates, '12-01-2023');
		console.log(`[${player.account_id}] found: `, matchesResult.length);

        matchSum += matchesResult.length
		if (matchesResult.length > 0) {
			const result_tx = await prisma.$transaction(
				async (tx) => {
					try {
						let result_mmrForUser = await Promise.all(
							matchesResult.map(async (match: any) => {
								return await tx.friendshipMMR.upsert({
									where: {
										matchPlusAccount: { match_id: match.match_id, account_id: player.account_id }
									},
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore: Unreachable code error
									update: {
                                        start_time: dayjs.unix(match.start_time).toDate(),
                                        win: match.win,
                                        mmrModifier: match.mmrModifier,
										match: {
											connect: { match_id: match.match_id}
										},
                                        dota_user: {
                                            connect: {
                                                account_id: player.account_id
                                            }
                                        }
									},
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore: Unreachable code error
									create: {
                                        start_time: dayjs.unix(match.start_time).toDate(),
                                        win: match.win,
                                        mmrModifier: match.mmrModifier,
										match: {
											connect: { match_id: match.match_id} 
										},
                                        dota_user: {
                                            connect: {
                                                account_id: player.account_id
                                            }
                                        }
									}
								});
							})
						);

						console.log(`result mmr insert for ${player.account_id}: ${result_mmrForUser.length}`);

					} catch (e) {
						console.error(e);
					}
				},
				{
					maxWait: 10000, // default: 2000
					timeout: 20000 // default: 5000
				}
			);
            return result_tx
		}

        
	});
}

//console.log(`=========end script===========\nshould have inserted ${matchSum} matches into FriendshipMMR`)
//getAllMatches(playerID, winrates, '12-01-2023');

// for (const torunplayer of playersWeCareAbout)
// {
//     let playerID = torunplayer;
//     getAllMatches(playerID, winrates);
// }

// 80636612   - Martin
// 34940151   - Roberts
// 113003047  - Dan
// 65110965   - Rocco
// 68024789   - Ben
// 423076846  - Chris
// 67762413   - Walker
// 125251142  - Matt
