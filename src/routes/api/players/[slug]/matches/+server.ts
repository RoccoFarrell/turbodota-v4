import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import type { Match } from '@prisma/client';

import { env } from '$env/dynamic/private';

//import { STRATZ_TOKEN } from '$env/static/private';

//helpers
import winOrLoss from '$lib/helpers/winOrLoss';
import { writeRecordsChunked } from '../../../helpers';
import { write } from 'fs';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[players/${account_id}/matches] account_id: ${account_id}\n-------------\n`);

	//console.log(url)

	let afterMatchID: number = parseInt(url.searchParams.get('afterMatchID') || "-1")

	if(afterMatchID === -1) return new Response(JSON.stringify({
		status: "fail",
		message: "must supply afterMatchID"
	}))

	//build query for stratz
	// const query = `
	// query {player(steamAccountId:${account_id}) {
	// 	steamAccountId
	// 	matches(request: {
	// 	  take: 10,
	// 	  after: ${afterMatchID}
	// 	  gameModeIds:[23]
	// 		}) {
	// 	  id
	// 	  gameMode
	// 	  startDateTime
	// 	  endDateTime
	// 	  durationSeconds
	// 	  isStats
	// 	  players(steamAccountId:${account_id}){
	// 		steamAccountId
	// 		isRadiant
	// 		isVictory
	// 		partyId
	// 		heroId
	// 		kills
	// 		assists
	// 		deaths
			
	// 	  }
	// 	}
	//   }
	// }
	// `;

	const query = `
	{
		player(steamAccountId: ${account_id}) {
			steamAccountId
			matches(request: { take: 100, after: ${afterMatchID}, gameModeIds: [23] }) {
				id
				gameMode
				startDateTime
				endDateTime
				durationSeconds
				isStats
				averageRank
				didRadiantWin
				players(steamAccountId: ${account_id}) {
					steamAccountId
					isRadiant
					isVictory
					partyId
					heroId
					kills
					assists
					deaths
					leaverStatus
					partyId
					playerSlot
					award
					imp
					heroDamage
					towerDamage
					heroHealing
				}
			}
		}
	}
	`

	const stratz_response = await fetch('https://api.stratz.com/graphql', {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.STRATZ_TOKEN}`
		}),
		body: JSON.stringify({
			query
		})
	});

	const headers = stratz_response.headers;
	const stratz_data = await stratz_response.json();

	interface stratzPlayerResponse {
		steamAccountId: number,
		matches: stratzPlayerMatch[]
	}

	interface stratzPlayerMatch {
		id: number,
		gameMode: string,
		didRadiantWin: boolean,
		startDateTime: number,
		endDateTime: number,
		durationSeconds: number,
		isStats: boolean,
		players: stratzPlayerMatchPlayers[]
	}

	interface stratzPlayerMatchPlayers {
		steamAccountId: number,
		isRadiant: boolean,
		isVictory: boolean,
		partyId: number,
		heroId: number,
		kills: number,
		assists: number,
		deaths: number,
		leaverStatus: string,
		playerSlot: number
	}

	/* 
		Add matches to DB
	*/

	let matchesForDB: Match[] = stratz_data.data.player.matches.map((match: stratzPlayerMatch) => {
		return {
			match_id: match.id,
			account_id: stratz_data.data.player.steamAccountId,
			kills: match.players[0].kills,
			assists: match.players[0].assists,
			deaths: match.players[0].deaths,
			duration: match.durationSeconds,
			game_mode: match.gameMode === "TURBO" ? 23 : -1,
			hero_id: match.players[0].heroId,
			leaver_status: match.players[0].leaverStatus === "NONE" ? 0 : 1,
			player_slot: match.players[0].playerSlot,
			radiant_win: match.didRadiantWin,
			start_time: match.startDateTime
		}
	})


	let dbWrite = await writeRecordsChunked(matchesForDB, account_id)

	//console.log(dbWrite)
	/* 
		Generate response
	*/

	
	//console.log(headers)
	let cacheTimeoutSeconds = 60;
	setHeaders({
		'cache-control': `max-age=${cacheTimeoutSeconds}`,
		'x-ratelimit-remaining-minute': stratz_response.headers.get('x-ratelimit-remaining-minute') || "-1",
		'x-ratelimit-remaining-hour': stratz_response.headers.get('x-ratelimit-remaining-hour') || "-1",
		'x-ratelimit-remaining-day': stratz_response.headers.get('x-ratelimit-remaining-day') || "-1"
	});

	return new Response(JSON.stringify({
		"test": "test",
		"afterMatchID": afterMatchID,
		"status": 'success',
		response: stratz_data,
		matchesForDB,
		dbWrite
	}), {
		status: 200,
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
			
		}
	})
}

export const POST: RequestHandler = async ({ request, params, url, locals, fetch, setHeaders }) => {
	// const session = await locals.auth.validate();

	// console.log(`session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
	// //reject the call if the user is not authenticated
	// if(params.slug?.toString() !== session.user.account_id.toString()) return new Response(JSON.stringify({"status": "unauthorized"}),{status: 401})

	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[stratz] account_id: ${account_id}\n-------------\n`);

	let requestBody = await request.json();

	console.log(requestBody);

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
			Authorization: `Bearer ${env.STRATZ_TOKEN}`
		}),
		body: JSON.stringify({
			query
		})
	});

	const headers = stratz_response.headers;
	//console.log(headers)
	let cacheTimeoutSeconds = 60;
	const stratz_data = await stratz_response.json();
	setHeaders({
		'cache-control': `max-age=${cacheTimeoutSeconds}`,
		'x-ratelimit-remaining-minute': stratz_response.headers.get('x-ratelimit-remaining-minute') || "-1",
		'x-ratelimit-remaining-hour': stratz_response.headers.get('x-ratelimit-remaining-hour') || "-1",
		'x-ratelimit-remaining-day': stratz_response.headers.get('x-ratelimit-remaining-day') || "-1"
	});

	let newResponse = new Response(JSON.stringify({ status: 'success', body: requestBody, response: stratz_data }), {
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
			
		}
	});
	return newResponse;
};
