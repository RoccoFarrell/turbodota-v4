//import fetch from 'node-fetch'

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

//Get All Matches for player from TurboTown
async function getAllMatches(account_id: number) {
	let dbcounter = 0;
	let odcounter = 0;
	let i = 0;

	let player_match_response = await fetch('https://turbodota.com/api/updateMatchesForUser/' + account_id);
	let player_match_response_object = await player_match_response.json();

	//console.log(player_match_response_object)

	for (const match of player_match_response_object.matchData) {
		await sleep(3000);
		if (i >= 0) {
			let send_match_for_parse_response = await fetch('https://turbodota.com/api/matches/' + match.match_id);
			console.log(send_match_for_parse_response);
			let send_match_for_parse_response_object;

			try {
				send_match_for_parse_response_object = await send_match_for_parse_response.json();
			} catch (error) {
				console.log('errored');
				console.log('send_match_for_parse_response' + JSON.stringify(send_match_for_parse_response));
				console.log('send_match_for_parse_response_object' + send_match_for_parse_response_object);
				console.error(error);
			}

			if (send_match_for_parse_response_object.matchDetailResult.source == 'db') {
				dbcounter++;

				console.log('(#DB' + dbcounter + ') match ID in details DB: ' + match.match_id);
			} else if (send_match_for_parse_response_object.matchDetailResult.source == 'opendota') {
				odcounter++;
				console.log('(#OD' + odcounter + ') match ID in details DB: ' + match.match_id);

				await sleep(3000);
			} else console.log(send_match_for_parse_response_object.matchDetailResult.source);
		}
		i++;
		console.log(i);
		console.log(`${dbcounter} from DB, ${odcounter} from opendota` )
	}
}

let runningID = 80636612;
getAllMatches(runningID);
