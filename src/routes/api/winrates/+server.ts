import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import type { Match } from '@prisma/client';

//helpers
import winOrLoss from '$lib/helpers/winOrLoss';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals, fetch }) => {
	const session = await locals.auth.validate();

	console.log(`session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
	//reject the call if the user is not authenticated
	// if(params.slug?.toString() !== session.user.account_id.toString()) return new Response(JSON.stringify({"status": "unauthorized"}),{status: 401})

	let requestBody = await request.json();
	let accountIdsForCalc = requestBody.accountIdsForCalc;
	console.log('request json: ', accountIdsForCalc);

	console.log(`[api/winrates POST] account_ids received: ${accountIdsForCalc}`);

	let forceSource: string = url.searchParams.get('source') || ""

	

	if(forceSource === "db") console.log(`[/winrates] FORCING source DB, no Open Dota`)

	//update matches for each user
	const userUpdateResult = await Promise.all(
		accountIdsForCalc.map(async (account_id: number) => {
			let updateMatchesforUser_URL = `/api/updateMatchesForUser/${account_id}?account_id=${account_id}${forceSource === "db" ? "&source=db" : ""}`
			console.log(`[winrates] querying API ${updateMatchesforUser_URL}`)
			let response = await fetch(updateMatchesforUser_URL, {
				method: 'Get',
				headers: {
					'content-type': 'application/json'
				}
			});

			console.log(`[/winrates] - update user ${account_id} matches`);

            if(response.status === 200){
                let userMatchData = await response.json();

                //return { account_id, ...userMatchData };
                return { ...userMatchData, matchCount: userMatchData.matchData.length };
            } else {
                return { error: true, response, account_id}
            }
			
		})
	);

	console.log(`=== userUpdateResult: ${userUpdateResult}`);

	let responseArr: any = [];

	type HeroPushObj = {
		hero_id: number;
		games: number;
		wins: number;
	};

	userUpdateResult.forEach((player) => {
		if (!player.error) {
			let heroesArr: HeroPushObj[] = [];

			player.matchData.forEach((match: Match) => {
				//check if weve tracked this hero yet
				if (heroesArr.filter((heroObj) => heroObj.hero_id === match.hero_id).length === 0) {
					let heroPushObj: HeroPushObj = {
						hero_id: match.hero_id,
						games: 1,
						wins: winOrLoss(match.player_slot, match.radiant_win) ? 1 : 0
					};
					heroesArr.push(heroPushObj);
				}
				//add to hero
				else {
					let objIndex = heroesArr.findIndex((obj: HeroPushObj) => obj.hero_id === match.hero_id);

					heroesArr[objIndex].games += 1;
					heroesArr[objIndex].wins += winOrLoss(match.player_slot, match.radiant_win) ? 1 : 0;
				}
			});

            heroesArr = heroesArr.map(heroObj => {
                return {
                    ...heroObj,
                    winrate: heroObj.wins / heroObj.games
                }
            })

			responseArr.push({ account_id: player.account_id, heroesArr });
		} else {
            responseArr.push({...player})
        }
	});

	let newResponse = new Response(JSON.stringify({ status: 'success', insert: responseArr }));
	return newResponse;
};
