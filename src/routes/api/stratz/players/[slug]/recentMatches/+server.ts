import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { Match } from '@prisma/client';

import { env } from '$env/dynamic/private';

//import { STRATZ_TOKEN } from '$env/static/private';

//helpers
import winOrLoss from '$lib/helpers/winOrLoss';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const GET: RequestHandler = async ({ request, params, url, locals, fetch, setHeaders }) => {
	// const session = await locals.auth.validate();

	// console.log(`session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
	// //reject the call if the user is not authenticated
	// if(params.slug?.toString() !== session.user.account_id.toString()) return new Response(JSON.stringify({"status": "unauthorized"}),{status: 401})

	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[stratz] account_id: ${account_id}\n-------------\n`);

	//let requestBody = await request.json();

	//console.log(requestBody);

	//generate gql

	const query = `
	query {player(steamAccountId:${account_id}) {
		steamAccountId
		matches(request: {
		  take: 100,
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

	let newResponse = new Response(JSON.stringify({ status: 'success', response: stratz_data }), {
		headers: {
			'cache-control': `max-age=${cacheTimeoutSeconds}`
			
		}
	});
	return newResponse;
};
