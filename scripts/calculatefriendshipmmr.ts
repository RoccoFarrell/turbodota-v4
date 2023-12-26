import fetch from 'node-fetch';
const playersWeCareAbout = [80636612, 34940151, 113003047, 65110965, 68024789, 423076846, 67762413, 125251142];

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

//Get All Matches for player from TurboTown

//TEMP
const data = {
    accountIdsForCalc: [65110965, 34940151, 80636612, 113003047, 125251142, 423076846, 67762413, 68024789]
};


let winrates = await fetch('https://turbodota.com/api/winrates', {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
})
	.then((response) => response.json())
	.then((data) => {
		return data
	});

    console.log(winrates)
async function getAllMatches(account_id: number) {
	let player_match_response = await fetch('https://turbodota.com/api/updateMatchesForUser/' + account_id);
	let player_match_response_object = await player_match_response.json();

	console.log(player_match_response_object);
	for (const match of player_match_response_object.matchData) {
		let send_match_for_parse_response = await fetch('https://turbodota.com/api/matches/' + match.match_id);
		let send_match_for_parse_response_object = await send_match_for_parse_response.json();

		for (const player of send_match_for_parse_response_object.matchDetailResult.matchDetail.players) {
			if (playersWeCareAbout.includes(player.account_id) && player.account_id != account_id) {
				console.log('Account ID: ' + player.account_id + ' | Hero ID: ' + player.hero_id);

				
			}
		}
	}
	await sleep(3000);
}

let playerID = 80636612;
getAllMatches(playerID);

// 80636612   - Martin
// 34940151   - Roberts
// 113003047  - Dan
// 65110965   - Rocco
// 68024789   - Ben
// 423076846  - Chris
// 67762413   - Walker
// 125251142  - Matt
