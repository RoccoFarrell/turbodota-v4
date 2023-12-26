//import fetch from 'node-fetch'

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

//Get All Matches for player from TurboTown
async function getAllMatches(account_id: number) {
	let dbcounter = 0;
	let odcounter = 0;
	let fails = 0;
	let i = 0;
	const failedarray = Array();

	let player_match_response = await fetch('https://turbodota.com/api/updateMatchesForUser/' + account_id);
	let player_match_response_object = await player_match_response.json();

	for (const match of player_match_response_object.matchData) {
		if (i >= 0) {
			//console.log(match.match_id)
			let send_match_for_parse_response = await fetch('https://turbodota.com/api/matches/' + match.match_id);
			//console.log(send_match_for_parse_response);
			let send_match_for_parse_response_object;

			try {
				send_match_for_parse_response_object = await send_match_for_parse_response.json();

				if (send_match_for_parse_response_object.matchDetailResult.source == 'db') {
					dbcounter++;
					console.log('(#DB' + dbcounter + ') match ID in details DB: ' + match.match_id);
					await sleep(250);
				} else if (send_match_for_parse_response_object.matchDetailResult.source == 'opendota') {
					odcounter++;
					console.log('(#OD' + odcounter + ') match ID in details DB: ' + match.match_id);
					await sleep(3000);
				} else console.log(send_match_for_parse_response_object.matchDetailResult.source);

			} catch (error) {
				console.log('errored');
				console.log('send_match_for_parse_response' + JSON.stringify(send_match_for_parse_response));
				console.log('send_match_for_parse_response_object' + send_match_for_parse_response_object);
				console.error(error);
				failedarray.push(match.match_id)
				fails++
				i++
				await sleep(3000);

				continue
			}
		}
		i++;
		//console.log(i);
		console.log(`${dbcounter} from DB, ${odcounter} from opendota, ${fails} failures` )
	}
	console.log("Failed array: " + failedarray)
}

let runningID = 125251142;
getAllMatches(runningID);

// 80636612   - Martin
// 34940151   - Roberts
// 113003047  - Dan
// 65110965   - Rocco
// 68024789   - Ben
// 423076846  - Chris
// 67762413   - Walker
// 125251142  - Matt
