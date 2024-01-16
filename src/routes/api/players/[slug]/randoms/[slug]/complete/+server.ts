import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import winOrLoss from '$lib/helpers/winOrLoss';
import dayjs from 'dayjs';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals, fetch }) => {
	const session = await locals.auth.validate();

	let requestData = await request.json();
	let { random } = requestData;

	let account_id: number = parseInt(url.pathname.split('/api/players/')[1].split('/randoms')[0]);
	let randomID: number = parseInt(params.slug || '0');

	console.log(`[/random/complete] account_id: ${account_id}, randomID: ${randomID}`);

	if (session) {
		//console.log(`[/random/complete] session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
		//reject the call if the user is not authenticated
		if (account_id !== session.user.account_id)
			return new Response(JSON.stringify({ success: false, status: 'unauthorized' }), { status: 401 });

		console.log('ready to check if random was completed');

		const matchesResponse = await prisma.match.findFirst({
			where: {
				AND: [
					{ account_id },
					{ hero_id: random.randomedHero },
					{
						start_time: {
							gt: dayjs(random.date).subtract(5, 'minute').unix()
						}
					}
				]
			}
		});

		if (matchesResponse) {
			console.log('matches to check for random: ', matchesResponse);
			console.log(
				`[/random/complete] completing random for: randomID - ${random.id} randomedHero - ${random.randomedHero} in match - ${matchesResponse.match_id}`
			);

			//do stuff here
			console.log('[/random/complete] here is where we will complete the random');

			const randomCompleteResults = await prisma.random.update({
				where: {
					id: random.id
				},
				data: {
					active: false,
					status: 'completed',
					win: winOrLoss(matchesResponse.player_slot, matchesResponse.radiant_win),
					endDate: new Date(),
					endMatchID: Number(matchesResponse.id),
					endGold: winOrLoss(matchesResponse.player_slot, matchesResponse.radiant_win)
						? random.expectedGold
						: 0
				}
			});

			let newResponse = new Response(
				JSON.stringify({ status: 'success', success: true, message: 'completed random', random, randomCompleteResults })
			);
			return newResponse;
		} else {
			return new Response(
				JSON.stringify({
					status: 'failed',
					success: false,
					message: 'no match with this account_id and hero_id found after random start date',
					random
				})
			);
		}
	} else return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });
};

//old
// export const POST: RequestHandler = async ({ request, params, url, locals }) => {
// 	//const session = await locals.auth.validate();

//     let requestData = await request.json();
//     let { completedRandom, completedMatch, session } = requestData

// 	console.log(`session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
// 	//reject the call if the user is not authenticated
// 	if (params.slug?.toString() !== session.user.account_id.toString())
// 		return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

// 	console.log(`params: ${JSON.stringify(params)}`);

// 	let account_id: number = parseInt(params.slug || '0');
// 	console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);

// 	//check if user was updated recently, otherwise use the database
// 	// const randomsForUser = await prisma.random.findMany({
// 	// 	where: {
// 	// 		account_id: session.user.account_id
// 	// 	}
// 	// });

//     console.log(`[api/random/${account_id}/complete] completing random for: randomID - ${completedRandom.id} randomedHero - ${completedRandom.randomedHero} in match - ${completedMatch.match_id}`);

// 	let completedRandomWithoutMatch = { ...completedRandom }
// 	delete completedRandomWithoutMatch.match
// 	delete completedRandomWithoutMatch.id

// 	const randomCompleteResults = await prisma.random.update({
//         where: {
//             id: completedRandom.id
//         },
// 		data: {
//             active: false,
//             status: 'completed',
// 			win: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win),
//             endDate: new Date(),
//             endMatchID: completedMatch.id,
// 			endGold: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win) ? completedRandomWithoutMatch.expectedGold : 0
// 			// account_id: session.user.account_id,
// 			// active: true,
// 			// status: 'active',
// 			// date: new Date(),
// 			// availableHeroes: randomStoreValues.availableHeroes.toString(),
// 			// bannedHeroes: randomStoreValues.bannedHeroes.toString(),
// 			// selectedRoles: randomStoreValues.selectedRoles.toString(),
// 			// expectedGold: randomStoreValues.expectedGold,
// 			// modifierAmount: randomStoreValues.modifierAmount,
// 			// modifierTotal: randomStoreValues.modifierTotal,
// 			// randomedHero: randomStoreValues.randomedHero
// 		}
// 	});

// 	let newResponse = new Response(JSON.stringify({"status": "success", "update": randomCompleteResults}));
// 	return newResponse;
// };
