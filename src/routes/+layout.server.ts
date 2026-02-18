import type { LayoutServerLoad } from './$types';
import type { Hero, Season } from '@prisma/client';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';

import { calculateRandomLeaderboard, calculateTownLeaderboard } from '$lib/helpers/leaderboardFromSeason';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	let tx_startTime = dayjs();

	// Load heroes from DB so layout always has a full list on every route (including /incremental).
	// Avoids server-to-self fetch to /api/getHeroes during SSR, which can fail or return empty.
	const getHeroDescriptions = async (): Promise<{ allHeroes: Hero[] }> => {
		const allHeroes = await prisma.hero.findMany({
			orderBy: { localized_name: 'asc' }
		});
		return { allHeroes };
	};

	const user = locals.user;
	const session = locals.session;
	console.log(`session: ${session}`);

	//get user prefs if user is logged in
	let userPreferences = [];
	if (user && user.account_id) {
		const prefsResponse = await fetch(`${url.origin}/api/preferences/${user.account_id}`, {
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

	if (user && user.account_id) {
		getLeague_startTime = dayjs().diff(tx_startTime, 'millisecond');

		leagueAndSeasonsResult = await prisma.league.findMany({
			where: {
				members: {
					some: {
						account_id: user.account_id
					}
				}
			},
			include: {
				members: {
					include: {
						user: true
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
								user: true,
								actions: true
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

	const heroDescriptions = await getHeroDescriptions();

	// Dota connection status for header indicator: connected = has account_id or Steam, last parsed match from DotaUser
	let dotaAccountStatus: {
		connected: boolean;
		lastMatchesFetched: string | null;
		lastMatchId: string | null;
	} = {
		connected: !!(user?.account_id ?? user?.steam_id),
		lastMatchesFetched: null,
		lastMatchId: null
	};
	if (user?.account_id) {
		const dotaUser = await prisma.dotaUser.findUnique({
			where: { account_id: user.account_id },
			select: { lastUpdated: true, newestMatchID: true }
		});
		if (dotaUser) {
			dotaAccountStatus.lastMatchesFetched = dotaUser.lastUpdated.toISOString();
			dotaAccountStatus.lastMatchId = dotaUser.newestMatchID?.toString() ?? null;
		}
	}

	return {
		user,
		session,
		dotaAccountStatus,
		heroDescriptions,
		userPreferences,
		league: {
			leagueID: leagueAndSeasonsResult?.[0]?.id ?? null,
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
