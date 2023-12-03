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
		//console.log(`responseData: ${JSON.stringify(responseData)}`)
		return responseData
		
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
