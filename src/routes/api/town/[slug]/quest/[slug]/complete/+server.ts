import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
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

	let requestData = await request.json();

	console.log(
		`[/quest/complete] session in API call: `,
		JSON.stringify(session),
		`params.slug: `,
		params,
		`request.url: `,
		url
	);
	//reject the call if the user is not authenticated

	let account_id: number = parseInt(url.pathname.split('/api/town/')[1].split('/quest')[0]);
	let questID: number = parseInt(params.slug || '0');

	console.log('[/quest/complete] account_id, questID: ', account_id, questID);
	if (session) {
		if (account_id !== session.user.account_id)
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		console.log(
			`\n-----------\n[api/town/${account_id}/quest/${questID}/complete] account_id: ${account_id}, questID: ${questID}\n-------------\n`
		);

		console.log('[api/town/${account_id}/quest/${questID}/complete] requestData: ', requestData);



		console.log(`[api/town/${account_id}/quest/${questID}/complete] - checking random for: ${session.user.account_id}`);
		const response = await fetch(`/api/players/${session.user.account_id}/randoms/${requestData.random.id}/complete`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({random: requestData.random})
		});
		console.log(`[api/town/${account_id}/quest/${questID}/complete] check random response: `, response);

		//check if user was updated recently, otherwise use the database
		// const randomsForUser = await prisma.random.findMany({
		// 	where: {
		// 		account_id: session.user.account_id
		// 	}
		// });

		// console.log(`[api/town/${account_id}/quest/${}/complete] completing quest for: randomID - ${completedRandom.id} randomedHero - ${completedRandom.randomedHero} in match - ${completedMatch.match_id}`);

		// let completedRandomWithoutMatch = { ...completedRandom }
		// delete completedRandomWithoutMatch.match
		// delete completedRandomWithoutMatch.id

		// const randomCompleteResults = await prisma.random.update({
		//     where: {
		//         id: completedRandom.id
		//     },
		// 	data: {
		//         active: false,
		//         status: 'completed',
		// 		win: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win),
		//         endDate: new Date(),
		//         endMatchID: completedMatch.id,
		// 		endGold: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win) ? completedRandomWithoutMatch.expectedGold : 0
		// 		// account_id: session.user.account_id,
		// 		// active: true,
		// 		// status: 'active',
		// 		// date: new Date(),
		// 		// availableHeroes: randomStoreValues.availableHeroes.toString(),
		// 		// bannedHeroes: randomStoreValues.bannedHeroes.toString(),
		// 		// selectedRoles: randomStoreValues.selectedRoles.toString(),
		// 		// expectedGold: randomStoreValues.expectedGold,
		// 		// modifierAmount: randomStoreValues.modifierAmount,
		// 		// modifierTotal: randomStoreValues.modifierTotal,
		// 		// randomedHero: randomStoreValues.randomedHero
		// 	}
		// });
	}

	let newResponse = new Response(JSON.stringify({ status: 'success' }));
	return newResponse;
};
