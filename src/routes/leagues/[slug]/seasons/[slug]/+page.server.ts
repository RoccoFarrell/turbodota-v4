import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Season } from '@prisma/client';
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client'
 
//import { createDotaUser } from '../api/helpers';
import { calculateRandomLeaderboard } from '$lib/helpers/leaderboardFromSeason';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	if (!session) {
		redirect(302, '/');
	}

	let selectedSeason: Season | null = parentData.selectedLeague.seasons.filter((season: Season) => season.id === parseInt(params.slug))[0] || null

	const allRandoms =  await prisma.random.findMany({
		include: { seasons: true }
	});

	type QuestWithRandom = Prisma.TurbotownQuestGetPayload<{
		include: {
			random: true;
		};
	}>;

	type TownWithIncludes = Prisma.TurbotownGetPayload<{
		include: {
			metrics: true,
			quests: {
				include: {
					random: true
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
	}>;
	let filteredMatchData: Match[] = [];
	let rawMatchData: Match[] = [];
	let flags: any = {
		mocked: false
	};
	let responseCompleteRandom: any = null;
	let matchesSinceRandom: Match[] = [];
	let leagueAndSeasonsResult: any = null;
	let currentSeason: Season | null = null;
	let currentSeasonLeaderboard: any = [];
	let currentTown: TownWithIncludes | null = null;
	let quests: QuestWithRandom[] = [];
	let questChecks: any = null;

	if (session && session.user) {
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
	
	}
	return {
		...parentData,
		league: {
			leagueAndSeasonsResult,
			currentSeason
		},
		random: {
			allRandoms
		}
	};
};

export const actions: Actions = {
	updateSeasonRandoms: async ({ request, locals, url}) => {
		const session = await locals.auth.validate();
		const formData = await request.formData()
		console.log("FORM DATA: ", formData)

		let inputIDs = formData.get('selectedDataIds')?.toString() || ""
		let seasonID = parseInt(formData.get('seasonID')?.toString() || "0")

		let randomsList: number[] = JSON.parse(`[${inputIDs}]`)

		console.log(`[updateSeasonRandoms] FOUND ${randomsList.length} randoms to add to season ${seasonID}`)

		if(session && session.user && session.user.roles.includes('dev')){
			let randomUpdateResult = await prisma.season.update({
				where: {
					id: seasonID
				},
				data: {
					randoms: {
							connect: randomsList.map((randomID: any) => {return {id: randomID}})
						}	
					}
			})

			console.log(`[updateSeasonRandoms] randomUpdateResult:`, randomUpdateResult)
		} else {
			return fail(400, { message: 'not an admin'})
		}
	}}