import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { base } from '$app/paths';

export const config = {
	isr: {
		expiration: 600,
		bypassToken: 'fbybpmuenv4foogdrax2ab2u863gxtqa4p15or78'
	}
};

export const load: PageServerLoad = async ({ params, locals, url, setHeaders }) => {
	//session info
	const session = await locals.auth.validate()
	let user = null;
	if (!session) {
		error(401, 'Unauthorized');
	} else {
		console.log(session)
		user = session.user
		if(![34940151, 65110965, 68024789, 80636612, 113003047, 423076846].includes(user.account_id)) error(401, 'Hero stats for friends only!');
	}

	//test random number
	const randomNumber = async () => {
		const response = await fetch(`${url.origin}/api/randomNumber`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json'
			}
		});

		//(response)
		return await response.json();
	};

	//get heroes list
	const getHeroes = async () => {
		const response = await fetch(`${url.origin}/api/getHeroes`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json'
			}
		});

		let responseData = await response.json();

		return responseData;
	};

	//get match stats
	const getMatchStats = async () => {
		let userDataArray: MatchStats[] = [];

		const playersWeCareAbout = [
			{ playerID: 65110965, playerName: 'Rocco' },
			{ playerID: 34940151, playerName: 'Roberts' },
			{ playerID: 80636612, playerName: 'Martin' },
			{ playerID: 113003047, playerName: 'Danny' },
			{ playerID: 125251142, playerName: 'Matt' },
			{ playerID: 423076846, playerName: 'Chris' },
			{ playerID: 67762413, playerName: 'Walker' },
			{ playerID: 68024789, playerName: 'Ben' }
			//{ playerID: 123794823, playerName: 'Steven' },
			//{ playerID: 214308966, playerName: 'Andy' }
		];

		for (const player of playersWeCareAbout) {
			try {
				const response = await fetch(
					`${url.origin}/api/updateMatchesForUser/${player.playerID}?account_id=${player.playerID}`,
					{
						method: 'Get',
						headers: {
							'content-type': 'application/json'
						}
					}
				);

				// const response = await fetch(`${url.origin}/api/updateMatchesForUser?account_id=${player.playerID}`, {
				// 	method: 'Get',
				// 	headers: {
				// 		'content-type': 'application/json',
				// 	},
				// });

				let responseData = await response.json();

				//convert bigInt to Javascript Date
				responseData.matchData.forEach((element: Match) => {
					element.start_time = new Date(Number(element.start_time) * 1000);
				});

				userDataArray.push({
					playerID: player.playerID,
					playerName: player.playerName,
					matchData: responseData.matchData,
					dataSource: responseData.dataSource,
					od_url: responseData.od_url
				});
			} catch (e) {
				console.error(`Fetch match data for user ${player.playerID} failed: `, e);
			}

			//(`responseData: ${JSON.stringify(responseData)}`)
		}

		return userDataArray;
	};

	setHeaders({
		'cache-control': 'max-age=3600'
	});

	return {
		streamed: {
			matchStats: new Promise<MatchStats[]>((resolve, reject) => {
				getMatchStats()
					.then((data) => {
						let returnData: MatchStats[] = data;
						return resolve(returnData);
					})
					.catch((error) => {
						console.log(error);
						return reject(error);
					});
			}),
			//matchStats: await getMatchStats(),
			randomNumber: await randomNumber(),
			heroDescriptions: await getHeroes()
		}
	};
};
