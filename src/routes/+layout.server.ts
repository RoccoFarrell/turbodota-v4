import type { LayoutServerLoad } from './$types';
import type { Hero, Season } from '@prisma/client';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';

import { calculateRandomLeaderboard, calculateTownLeaderboard } from '$lib/helpers/leaderboardFromSeason';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	let tx_startTime = dayjs();

	const getHeroes = async () => {
		const response = await fetch(`${url.origin}/api/getHeroes`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json'
			}
		});

		let responseData = await response.json();

		//console.log(Object.keys(responseData))
		responseData = {
			...responseData,
			allHeroes: responseData.allHeroes.sort((a: Hero, b: Hero) => {
				if (a.localized_name < b.localized_name) return -1;
				else return 1;
			})
		};

		return responseData;
	};

	const session = await locals.auth.validate();
	console.log(`session: ${session}`);

	//get user prefs if user is logged in
	let userPreferences = [];
	if (session && session.user) {
		const prefsResponse = await fetch(`${url.origin}/api/preferences/${session.user.account_id}`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		let responseData = await prefsResponse.json();
		userPreferences = responseData;
	}

	let leagueAndSeasonsResult: any = null;

	let getLeague_startTime: number = -1;
	let getLeague_endTime: number = -1;

	let currentSeason: Season | null = null;
	let questsInSeason: number | null = null;
	let currentSeasonLeaderboard: any = [];
	let currentTownLeaderboard: any = [];

	/* 
			Get season info
		*/

	if (session) {
		getLeague_startTime = dayjs().diff(tx_startTime, 'millisecond');

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
						user: true,
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
								},
								metrics: true,
								user: true
							}
						},
						_count: {
							select: { randoms: true }
						}
					}
				}
			}
		});

		getLeague_endTime = dayjs().diff(tx_startTime, 'millisecond');

		/* current season leaderboard */
		if (leagueAndSeasonsResult && leagueAndSeasonsResult[0] && leagueAndSeasonsResult[0].seasons.length > 0) {
			//set season
			currentSeason = leagueAndSeasonsResult[0].seasons[0];

			//count total quests
			let questsInSeasonRaw = leagueAndSeasonsResult[0].seasons[0].turbotowns.map((town: any) => town.quests.length);
			if (questsInSeasonRaw.length > 0)
				questsInSeason = questsInSeasonRaw.reduce((acc: number, curr: number) => (acc += curr));
			// calculate leaderboard
			currentSeasonLeaderboard = calculateRandomLeaderboard(
				leagueAndSeasonsResult[0].members,
				leagueAndSeasonsResult[0].seasons[0].randoms
			);

			currentTownLeaderboard = calculateTownLeaderboard(
				leagueAndSeasonsResult[0].seasons[0].turbotowns,
				leagueAndSeasonsResult[0].seasons[0].randoms,
				leagueAndSeasonsResult[0].members
			);
		} else console.error('could not load season leaderboard in server');
	}

	return {
		session,
		heroDescriptions: await getHeroes(),
		userPreferences,
		league: {
			leagueID: leagueAndSeasonsResult ? leagueAndSeasonsResult[0].id : null,
			seasonID: currentSeason?.id,
			leagueAndSeasonsResult,
			currentSeason,
			_counts: {
				questsInSeason
			},
			//dont know why i have to do this, its a non POJO for some reason
			currentSeasonLeaderboard: structuredClone(currentSeasonLeaderboard),
			currentTownLeaderboard: structuredClone(currentTownLeaderboard)
		}
	};
};
