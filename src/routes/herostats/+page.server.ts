import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail } from '@sveltejs/kit'
import { env } from "$env/dynamic/private"

import { base } from '$app/paths' 

console.log(base)
export const load: PageServerLoad = async ({ params, locals, url }) => {
	const session = await locals.auth.validate()
	let user = null;
	if (!session) {
		throw error(401, 'Unauthorized')
	} else {
		console.log(session)
		user = session.user
	}

	//console.log(url)
	const randomNumber = async () => {
		const response = await fetch(`${url.origin}/api/randomNumber`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json',
			},
		});
	
		//console.log(response)
		return await response.json();
	 }

	const getMatchStats = async () => {

		const playersWeCareAbout = [
			{ playerID: 113003047, playerName: 'Danny' },
			//{ playerID: 123794823, playerName: 'Steven' },
			{ playerID: 125251142, playerName: 'Matt' },
			{ playerID: 34940151, playerName: 'Roberts' },
			{ playerID: 423076846, playerName: 'Chris' },
			{ playerID: 65110965, playerName: 'Rocco' },
			{ playerID: 67762413, playerName: 'Walker' },
			{ playerID: 68024789, playerName: 'Ben' },
			{ playerID: 80636612, playerName: 'Martin' }
			//{ playerID: 214308966, playerName: 'Andy' }
		];

		const response = await fetch(`${url.origin}/api/updateMatchesForUser?account_id=${80636612}`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json',
			},
		});

		let responseData = await response.json()
		responseData = processPlayerInfo(responseData)
		responseData.playerID = 80636612
		responseData.playerName = 'Martin'
		//console.log(`responseData: ${JSON.stringify(responseData)}`)
		return responseData
		
	}

	function processPlayerInfo(matchStats) {

		let totals = {'kills': 0, 'deaths': 0, 'assists': 0, 'wins':0, 'losses':0, 'kda:':0 }
		let allHeroesGames = {}
		for(let i = 0; i < matchStats.length; i++) {
	
			//check if hero slot is 0, indicating bad match data
			if(matchStats[i].hero_id === 0 || matchStats[i].hero_id === '0') i++
	
			//sum all KDA
			totals.kills += matchStats[i].kills
			totals.deaths += matchStats[i].deaths
			totals.assists += matchStats[i].assists
			totals.kda += (totals.kills + totals.assists) / totals.deaths
	
			//sum total wins
			if(winOrLoss(matchStats[i].player_slot, matchStats[i].radiant_win) === true){
			totals.wins += 1
			} else {
			totals.losses += 1
			}
	
			let heroID = matchStats[i].hero_id
			
			if(allHeroesGames[heroID] === undefined){
			allHeroesGames[heroID] = {
				games: 0,
				wins: 0,
				losses: 0,
				kills: 0,
				deaths: 0,
				assists: 0,
				partysize: {
				1: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				}, 
				2: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				},
				3: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				},
				4: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				},
				5: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				},
				99: {
					games: 0,
					wins: 0,
					losses: 0,
					kills: 0,
					deaths: 0,
					assists: 0
				}
				}
			}
			}
	
			//add KDA stats to allHeroesGames
			allHeroesGames[heroID].kills += matchStats[i].kills
			allHeroesGames[heroID].deaths += matchStats[i].deaths
			allHeroesGames[heroID].assists += matchStats[i].assists
			allHeroesGames[heroID].games += 1
	
			let tempPartySize = matchStats[i].party_size
			if(tempPartySize === null || tempPartySize === 0) tempPartySize = 99
			//console.log('error')
			//console.log("temp party size: ", tempPartySize , matchStats[i])
			//console.log(allHeroesGames[heroID])
			allHeroesGames[heroID].partysize[tempPartySize].games += 1
			allHeroesGames[heroID].partysize[tempPartySize].kills += matchStats[i].kills
			allHeroesGames[heroID].partysize[tempPartySize].deaths += matchStats[i].deaths
			allHeroesGames[heroID].partysize[tempPartySize].assists += matchStats[i].assists
	
			if(winOrLoss(matchStats[i].player_slot, matchStats[i].radiant_win) === true){
			allHeroesGames[heroID].wins += 1
			allHeroesGames[heroID].partysize[tempPartySize].wins += 1
			} else {
			allHeroesGames[heroID].losses += 1
			allHeroesGames[heroID].partysize[tempPartySize].losses += 1
			}
		}
	
		totals.games =(matchStats.length)
		let avgObj = {'kills': (totals.kills / matchStats.length).toFixed(2), 'deaths': (totals.deaths / matchStats.length).toFixed(2), 'assists': (totals.assists / matchStats.length).toFixed(2)}
		//console.log(allHeroesGames)
		return ({"averages": avgObj, "totals": totals, "allHeroRecord": allHeroesGames })
	}
	
	function winOrLoss (slot, win) {
		if (slot > 127){
			if (win === false){
				return true
			}
			else return false
		}
		else {
			if (win === false){
				return false
			}
			else return true
		}
	}

	return {
		matchStats: await getMatchStats(),
		randomNumber: await randomNumber()
	}
}

// export const actions: Actions = {
// 	updateArticle: async ({ request, params, locals }) => {
// 		const { session, user } = await locals.auth.validateUser()
// 		if (!session || !user) {
// 			throw error(401, 'Unauthorized')
// 		}

// 		const { title, content } = Object.fromEntries(await request.formData()) as Record<
// 			string,
// 			string
// 		>

// 		try {
// 			const article = await prisma.article.findUniqueOrThrow({
// 				where: {
// 					id: Number(params.articleId)
// 				}
// 			})

// 			if (article.userId !== user.userId) {
// 				throw error(403, 'Forbidden to edit this article.')
// 			}
// 			await prisma.article.update({
// 				where: {
// 					id: Number(params.articleId)
// 				},
// 				data: {
// 					title,
// 					content
// 				}
// 			})
// 		} catch (err) {
// 			console.error(err)
// 			return fail(500, { message: 'Could not update article' })
// 		}

// 		return {
// 			status: 200
// 		}
// 	}
// }
