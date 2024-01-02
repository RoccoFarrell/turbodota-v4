const query3rdPartyAPI = async (provider: string, path: string) => {
    let account_id: number = 65110965
	console.log(`\n-----------\n[stratz] account_id: ${account_id}\n-------------\n`);

	//let requestBody = await request.json();

	//console.log(requestBody);

	//generate gql

	const query = `
    query {player(steamAccountId:${account_id}) {
		steamAccountId
		matches(request: {
		  take: 10,
		  gameModeIds:[23]
			}) {
		  id
		  gameMode
		  startDateTime
		  endDateTime
		  durationSeconds
		  isStats
		  players(steamAccountId:${account_id}){
			steamAccountId
			isRadiant
			isVictory
			partyId
			heroId
			kills
			assists
			deaths
			
		  }
		}
	  }
	}
	`;

	const stratz_response = await fetch('https://api.stratz.com/graphql', {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.STRATZ_TOKEN}`
		}),
		body: JSON.stringify({
			query
		})
	});

	const headers = stratz_response.headers;
	//console.log(headers)
	let cacheTimeoutSeconds = 60;
	const stratz_data = await stratz_response.json();
	// setHeaders({
	// 	'cache-control': `max-age=${cacheTimeoutSeconds}`,
	// 	'x-ratelimit-remaining-minute': stratz_response.headers.get('x-ratelimit-remaining-minute') || "-1",
	// 	'x-ratelimit-remaining-hour': stratz_response.headers.get('x-ratelimit-remaining-hour') || "-1",
	// 	'x-ratelimit-remaining-day': stratz_response.headers.get('x-ratelimit-remaining-day') || "-1"
	// });

	let newResponse = new Response(JSON.stringify({ status: 'success', data: stratz_data }), {
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
			
		}
	});

    return newResponse
}

export { query3rdPartyAPI }