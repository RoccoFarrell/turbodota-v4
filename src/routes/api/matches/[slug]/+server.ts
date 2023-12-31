import type { RequestHandler } from '@sveltejs/kit';
import type { MatchDetail, PlayersMatchDetail } from '@prisma/client';
import prisma from '$lib/server/prisma';
//import type { Config } from '@sveltejs/adapter-vercel';

// export const config: Config = {
// 	runtime: 'edge',
// };

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	console.log(`[api] - received GET to ${url.href}`);
	console.log(`params: ${JSON.stringify(params)}`);

	let newResponse = new Response(JSON.stringify({ status: 'success', update: 'test' }));
	return newResponse;
};

export const GET: RequestHandler = async ({ params, url }) => {
	console.log(`[api] - received GET to ${url.href}`);
	console.log(`params: ${JSON.stringify(params)}`);

	//parse match id from params
	let match_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[matches] match_id: ${match_id}\n-------------\n`);
	//let match_id: number = parseInt(url.searchParams.get('match_id') || "80636612")

	//parse league if it exists
	let inputLeagueID: number = -1;
	if (url.search && url.search.includes('league=') && url.searchParams.get('league')) {
		inputLeagueID = parseInt(url.searchParams.get('league') || '-1');
		console.log(`parsed league ID: ${inputLeagueID}`);
	}

	// if(inputLeagueID > 0){
	// 	const leagueResult = await prisma.league.findUnique({
	// 		where: {}
	// 	})
	// }

	//check if user was updated recently, otherwise use the database
	const matchDetailResult = await prisma.matchDetail.findFirst({
		where: {
			match_id
		},
		include: { players: true }
	});

	//console.log(matchDetailResult);

	let returnObj: any;
	let forceUpdate: boolean = false;
	type MatchDetailKeys = keyof typeof returnObj;

	if (matchDetailResult && !forceUpdate) {
		//return found match
		returnObj = {
			matchDetail: matchDetailResult,
			source: 'db',
			status: 'success'
		};
	}
	//match not found, get from API
	else {
		let matchDetailsResponse = await fetch(encodeURI(`https://api.opendota.com/api/matches/${match_id}`), {
			method: 'get',
			headers: { 'Content-Type': 'application/json' }
		})

		console.log(`[api /matches calling open dota/matches for ${match_id}] status: ${matchDetailsResponse.status}`);
		if (matchDetailsResponse.status !== 200) {
			console.error('Open Dota shit the bed ');
			returnObj = {
				status: "fail",
				source: "opendota",
				fetchObj: matchDetailsResponse
			}
		}
		
		else {
			let matchDetailsFetch = await matchDetailsResponse.json()

			let matchDetailObj = {
				match_id: matchDetailsFetch.match_id,
				radiant_win: matchDetailsFetch.radiant_win,
				duration: matchDetailsFetch.duration,
				pre_game_duration: matchDetailsFetch.pre_game_duration,
				start_time: matchDetailsFetch.start_time,
				tower_status_radiant: matchDetailsFetch.tower_status_radiant,
				tower_status_dire: matchDetailsFetch.tower_status_dire,
				barracks_status_radiant: matchDetailsFetch.barracks_status_radiant,
				barracks_status_dire: matchDetailsFetch.barracks_status_dire,
				first_blood_time: matchDetailsFetch.first_blood_time,
				patch: matchDetailsFetch.patch,
				radiant_score: matchDetailsFetch.radiant_score,
				dire_score: matchDetailsFetch.dire_score,
				average_rank: matchDetailsFetch.average_rank
			};

			let playersArr: PlayersMatchDetail[] = [];
			const result_tx = await prisma.$transaction(
				async (tx) => {
					try {
						//upsert match Details
						// no update value behaves as findOrCreate
						// https://www.prisma.io/docs/orm/prisma-client/queries/crud#update-or-create-records
						let matchDetailsWrite = await tx.matchDetail.upsert({
							where: { match_id: matchDetailsFetch.match_id },
							update: { ...matchDetailObj },
							create: { ...matchDetailObj }
						});

						playersArr = matchDetailsFetch.players
							.filter((player: any) => player.account_id)
							.map((player: any) => {
								//console.log(player);
								return {
									match_id: matchDetailsFetch.match_id,
									account_id: player.account_id,
									player_slot: player.player_slot,
									hero_id: player.hero_id,
									item_0: player.item_0,
									item_1: player.item_1,
									item_2: player.item_2,
									item_3: player.item_3,
									item_4: player.item_4,
									item_5: player.item_5,
									backpack_0: player.backpack_0,
									backpack_1: player.backpack_1,
									backpack_2: player.backpack_2,
									item_neutral: player.item_neutral,
									kills: player.kills,
									deaths: player.deaths,
									assists: player.assists,
									last_hits: player.last_hits,
									denies: player.denies,
									gold_per_min: player.gold_per_min,
									xp_per_min: player.xp_per_min,
									level: player.level,
									net_worth: player.net_worth,
									aghanims_scepter: player.aghanims_scepter,
									aghanims_shard: player.aghanims_shard,
									moonshard: player.moonshard,
									hero_damage: player.hero_damage,
									tower_damage: player.tower_damage,
									hero_healing: player.hero_healing,
									gold: player.gold,
									gold_spent: player.gold_spent,
									win: !!player.win,
									lose: !!player.lose,
									total_gold: player.total_gold,
									total_xp: player.total_xp,
									kda: player.kda,
									benchmarks: JSON.stringify(player.benchmarks)
								};
							});

						//upsert
						let result_playerMatchDetails = await Promise.all(
							playersArr.map(async (player: PlayersMatchDetail) => {
								return await tx.playersMatchDetail.upsert({
									where: {
										matchPlusAccount: { match_id, account_id: player.account_id }
									},
									update: { ...player },
									create: { ...player }
								});
							})
						);

						console.log(
							`result_matchDetails: ${matchDetailsWrite} result_playerMatchDetails: ${JSON.stringify(
								result_playerMatchDetails
							)}`
						);

						if (result_playerMatchDetails.length < 1)
							throw new Error(`player match details for ${match_id} failed to write`);
						else return { matchDetailsWrite, playerMatchDetailsCount: result_playerMatchDetails.length };
					} catch (e) {
						console.error(e);
						//throw new Error(`player match details for ${match_id} failed to write`)
					}
				},
				{
					maxWait: 10000, // default: 2000
					timeout: 20000 // default: 5000
				}
			);
			console.log('result_tx: ', result_tx);
			returnObj = {
				status: 'success',
				matchDetail: {
					...matchDetailObj,
					players: playersArr
				},
				inserts: {
					playerMatchDetails_count: result_tx?.playerMatchDetailsCount,
					matchDetails_count: result_tx?.matchDetailsWrite
				},
				source: 'opendota'
			};
		}
	}

	return new Response(JSON.stringify({ matchDetailResult: returnObj }));
};
