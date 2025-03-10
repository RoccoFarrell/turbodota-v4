import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import type { Prisma, Turbotown, Season } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';
import { calculateRandomLeaderboard } from '$lib/helpers/leaderboardFromSeason';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const load: PageServerLoad = async ({ locals, parent, url, fetch }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	console.log('[random page.server] - session in page server: ', session)
	//if (session) throw redirect(302, "/");

	async function getRandomsForUser(seasonID: number) {
		return await prisma.random.findMany({
			where: {
				AND: [
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore: Unreachable code error
						account_id: session.user.account_id,
						seasons: {
							some: {
								id: seasonID
							}
						}
					}
				]
			},
			include: {
				match: true,
				user: true,
				seasons: {
					include: {
						_count: {
							select: { randoms: true }
						}
					}
				}
			}
		});
	}

	let returnObj = {};

	type RandomsForUser = Prisma.PromiseReturnType<typeof getRandomsForUser>;
	let randomsForUser: RandomsForUser = [];
	let filteredMatchData: Match[] = [];
	let rawMatchData: Match[] = [];
	let flags: any = {
		mocked: false
	};
	let responseComplete: any = null;
	let matchesSinceRandom: Match[] = [];
	let leagueAndSeasonsResult: any = null;
	let currentSeason: Season | null = null;
	let currentSeasonLeaderboard: any = [];
	let currentTown: Turbotown | null = null;

	if (session && session.user) {
		/* 
			Get season info
		*/

		leagueAndSeasonsResult = await prisma.league.findMany({
			where: {
				members: {
					some: {
						account_id: session.user.account_id
					}
				}
			},
			include: {
				members: {
					include: {
						_count: true
					}
				},
				seasons: {
					where: {
						AND: [{ type: 'random', active: true }]
					},
					include: {
						randoms: {
							include: {
								user: true,
								match: true
							}
						},
						turbotowns: {
							include: {
								quests: {
									include: {
										random: true
									}
								}
							}
						},
						_count: {
							select: { randoms: true }
						}
					}
				}
			}
		});

		/* current season leaderboard */
		if (leagueAndSeasonsResult && leagueAndSeasonsResult[0] && leagueAndSeasonsResult[0].seasons.length > 0) {
			//set season
			currentSeason = leagueAndSeasonsResult[0].seasons[0];
			// calculate leaderboard
			currentSeasonLeaderboard = calculateRandomLeaderboard(
				leagueAndSeasonsResult[0].members,
				leagueAndSeasonsResult[0].seasons[0].randoms
			);
		} else console.error('could not load season leaderboard in server');

		/* End get season info */
		/* ------------------- */

		/* Get current Town Info */
		/* ------------------- */

		if (currentSeason) {
			currentTown = await prisma.turbotown.findFirst({
				where: {
					AND: [
						{ account_id: session.user.account_id },
						{
							season: {
								id: currentSeason.id
							}
						}
					]
				}
			});
		}

		console.log(`[random page.server.ts] - current town: `, currentTown)

		if(!currentTown){
			console.log(`[random page.server.ts] - creating town for: ${session.user.account_id}`)
			const response = await fetch(`/api/town/${session.user.account_id}/create`, {
				method: 'POST'
			});
			//console.log("create town response: ", response)
		}

		/* End town info */
		/* ------------------- */

		if (leagueAndSeasonsResult[0] && leagueAndSeasonsResult[0].seasons.length > 0) {
			randomsForUser = await getRandomsForUser(leagueAndSeasonsResult[0].seasons[0].id);
		} else randomsForUser = [];

		console.log(`active random length: ${randomsForUser.filter((random) => random.active).length}`);

		const response = await fetch(`/api/updateMatchesForUser/${session.user.account_id}`, {
			method: 'GET'
		});

		let responseData = await response.json();
		//console.log(responseData);

		//user has at least 1 active random

		if (!responseData.matchData || !responseData.matchData.length) {
			error(500, {
				message: `Open Dota Failed, no match data, returned length: ${JSON.stringify(responseData)}`
			});
		}

		rawMatchData = responseData.matchData;

		if (randomsForUser.length > 0 && randomsForUser.filter((random) => random.active).length > 0) {
			//fetch most recent matches

			if (responseData.mocked) flags.mocked = true;

			console.log([`[random+page.server.ts] found ${responseData.matchData.length} for user`]);

			//format big int dates
			responseData.matchData.forEach((element: Match) => {
				element.start_time = new Date(Number(element.start_time) * 1000);
			});

			//a user should only ever have 1 active random, if not, sort by the oldest one for evaluation
			let activeRandoms = randomsForUser
				.filter((random) => random.active)
				.sort((a: any, b: any) => {
					if (a.date < b.date) return -1;
					else return 1;
				});

			let activeRandomDate = activeRandoms[0].date;
			let activeRandomDate5Minutes = new Date(activeRandoms[0].date.getTime() - 5 * 60 * 1000);
			matchesSinceRandom = rawMatchData.filter((match: Match) => {
				match.start_time > activeRandomDate5Minutes;
			});

			console.log(`activeRandomDate: ${activeRandomDate}, minus 5 minutes: ${activeRandomDate5Minutes}`);

			//filter all matches for games in the oldest active random
			//minus 5 minutes from the random start date to account for picking phase
			filteredMatchData = rawMatchData
				.filter(
					(match: Match) =>
						match.hero_id === activeRandoms[0].randomedHero && match.start_time > activeRandomDate5Minutes
				)
				.sort((a: any, b: any) => {
					if (a.start_time < b.start_time) return -1;
					else return 1;
				});

			if (filteredMatchData.length > 0) {
				let completeResponse = await fetch(`/api/random/${session.user.account_id}/complete`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						completedRandom: activeRandoms[0],
						completedMatch: filteredMatchData[0],
						session: session
					})
				});
				let completeResponseData = await completeResponse.json();
				responseComplete = completeResponseData;
				randomsForUser = await getRandomsForUser(leagueAndSeasonsResult[0].seasons[0].id);
			} else {
				responseComplete = { error: 'couldnt complete random' };
			}
		}

		/* End get randoms */
	}
	return {
		...parentData,
		randoms: randomsForUser,
		rawMatchData,
		randomAttempts: filteredMatchData,
		matchesSinceRandom,
		flags,
		responseComplete,
		leagueAndSeasonsResult,
		currentSeason,
		//dont know why i have to do this, its a non POJO for some reason
		currentSeasonLeaderboard: structuredClone(currentSeasonLeaderboard)
	};
};
