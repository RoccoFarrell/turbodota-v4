import type { LayoutServerLoad } from './$types';
import type { Prisma, Turbotown, Season, TurbotownQuest } from '@prisma/client';
import prisma from '$lib/server/prisma';
import { error, fail, redirect } from '@sveltejs/kit';
import { calculateRandomLeaderboard, calculateTownLeaderboard } from '$lib/helpers/leaderboardFromSeason';
import dayjs from 'dayjs'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const load: LayoutServerLoad = async ({ locals, parent, url, fetch }) => {
	let tx_startTime = dayjs()
	const parentData = await parent();
	const user = locals.user;

	//get static list of items
	const items = await prisma.item.findMany();

	async function getRandomsForUser(seasonID: number) {
		return await prisma.random.findMany({
			where: {
				AND: [
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore: Unreachable code error
						account_id: user?.account_id!,
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

	type RandomsForUser = Prisma.PromiseReturnType<typeof getRandomsForUser>;
	type QuestWithRandom = Prisma.TurbotownQuestGetPayload<{
		include: {
			random: true;
		};
	}>;

	type TownWithIncludes = Prisma.TurbotownGetPayload<{
		include: {
			metrics: true;
			quests: {
				include: {
					random: true;
				};
			};
			season: true;
			statuses: true;
			items: {
				include: {
					item: true;
				};
			};
			user: true;
		};
	}>;
	let randomsForUser: RandomsForUser = [];
	let filteredMatchData: Match[] = [];
	let rawMatchData: Match[] = [];
	let flags: any = {
		mocked: false
	};
	let responseCompleteRandom: any = null;
	let matchesSinceRandom: Match[] = [];
	//let leagueAndSeasonsResult: any = null;

	//let currentSeason: Season | null = null;
	//let questsInSeason: number | null = null;
	//let currentSeasonLeaderboard: any = [];
	//let currentTownLeaderboard: any = [];
	let currentTown: TownWithIncludes | null = null;
	let quests: QuestWithRandom[] = [];
	let questChecks: any = null;

	//timers
	let updateMatches_startTime: number = -1;
	let updateMatches_endTime: number = -1;

	let getLeague_startTime: number = -1;
	let getLeague_endTime: number = -1;

	let getTown_startTime: number = -1;
	let getTown_endTime: number = -1;

	let checkQuests_startTime: number = -1;
	let checkQuests_endTime: number = -1;

	let getRandoms_startTime: number = -1;
	let getRandoms_endTime: number = -1;

	// let updateMatches_startTime: number = -1;
	// let updateMatches_endTime: number = -1;

	if (user) {
		/* Get raw match data for user */
		updateMatches_startTime = dayjs().diff(tx_startTime, "millisecond")
		const response = await fetch(`/api/updateMatchesForUser/${user.account_id}`, {
			method: 'GET'
		});

		let responseData = await response.json();
		updateMatches_endTime = dayjs().diff(tx_startTime, "millisecond")

		//user has at least 1 active random

		// if (!responseData.matchData || !responseData.matchData.length) {
		// 	error(500, {
		// 		message: `Open Dota Failed, no match data, returned length: ${JSON.stringify(responseData)}`
		// 	});
		// }

		rawMatchData = responseData.matchData;

		/* Get current Town Info */
		/* ------------------- */

		getTown_startTime = dayjs().diff(tx_startTime, "millisecond")
		if (parentData?.league?.currentSeason) {
			currentTown = await prisma.turbotown.findFirst({
				where: {
					AND: [
						{ account_id: user.account_id! },
						{
							season: {
								id: parentData.league.currentSeason.id
							}
						}
					]
				},
				include: {
					metrics: true,
					quests: {
						include: {
							random: true
						},
						orderBy: {
							endDate: 'asc'
						}
					},
					season: true,
					statuses: true,
					items: {
						include: {
							item: true
						}
					},
					user: true
				}
			});
		}
		getTown_endTime = dayjs().diff(tx_startTime, "millisecond")

		//console.log(`[turbotown page.server.ts] - current town: `, currentTown);

		if (!currentTown) {
			console.log(`[turbotown page.server.ts] - creating town for: ${user.account_id}`);
			const response = await fetch(`/api/town/${user.account_id}/create`, {
				method: 'POST'
			});
			//console.log('create town response: ', response);
		}

		//quests

		if (currentTown && currentTown?.quests?.length > 0) {
			quests = currentTown.quests;
			//console.log(`[random page.ts] found ${quests.length} quests`, quests);
		}

		//check for quest complete

		checkQuests_startTime = dayjs().diff(tx_startTime, "millisecond")
		let questCheckPromises = await quests
			.filter((quest) => quest.active)
			.map(async (quest, i) => {
				//console.log('checking quest ', quest.id);
				if (i > 0) await new Promise((resolve) => setTimeout(resolve, 100 * i));
				const questCompleteResponse = await fetch(`/api/town/${user.account_id}/quest/${quest.id}/complete`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						quest,
						currentTown
					})
				});

				//console.log(questCompleteResponse);
				let response = await questCompleteResponse.json();
				//console.log('questComplete response: ', response);
				return response;
			});

		questChecks = await Promise.all(questCheckPromises);

		checkQuests_endTime = dayjs().diff(tx_startTime, "millisecond")
		

		/* End town info */
		/* ------------------- */

		getRandoms_startTime = dayjs().diff(tx_startTime, "millisecond")

		if (parentData?.league.leagueAndSeasonsResult[0]?.seasons?.length > 0) {
			randomsForUser = await getRandomsForUser(parentData.league.leagueAndSeasonsResult[0].seasons[0].id);
		} else randomsForUser = [];

		getRandoms_endTime = dayjs().diff(tx_startTime, "millisecond")

		//console.log(`active random length: ${randomsForUser.filter((random) => random.active).length}`);
	}

	let tx_endTime = dayjs();
	let executionTime = tx_endTime.diff(tx_startTime, 'millisecond');

	return {
		...parentData,
		random: {
			randoms: randomsForUser,
			randomAttempts: filteredMatchData,
			matchesSinceRandom,
			responseCompleteRandom
		},
		match: {
			rawMatchData
		},
		meta: {
			flags,
			timers:{
				executionTime,
				updateMatches_startTime,
				updateMatches_endTime,
				getLeague_startTime,
				getLeague_endTime,
				getTown_startTime,
				getTown_endTime,
				checkQuests_startTime,
				checkQuests_endTime,
				getRandoms_startTime,
				getRandoms_endTime
			}
		},
		quests: {
			quests,
			questChecks
		},
		// league: {
		// 	leagueID: leagueAndSeasonsResult ? leagueAndSeasonsResult[0].id : null,
		// 	seasonID: currentSeason?.id,
		// 	leagueAndSeasonsResult,
		// 	currentSeason,
		// 	_counts: {
		// 		questsInSeason
		// 	},
		// 	//dont know why i have to do this, its a non POJO for some reason
		// 	currentSeasonLeaderboard: structuredClone(currentSeasonLeaderboard),
		// 	currentTownLeaderboard: structuredClone(currentTownLeaderboard)
		// },
		town: {
			turbotown: currentTown,
			items
		},
		
	};
};
