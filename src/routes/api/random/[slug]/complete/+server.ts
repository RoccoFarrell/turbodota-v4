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

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	//const session = await locals.auth.validate();

    let requestData = await request.json();
    let { completedRandom, completedMatch, session } = requestData

	console.log(`session in API call: `, JSON.stringify(session), `params.slug: `, params.slug);
	//reject the call if the user is not authenticated
	if (params.slug?.toString() !== session.user.account_id.toString())
		return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

	console.log(`params: ${JSON.stringify(params)}`);

	let account_id: number = parseInt(params.slug || '0');
	console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);

	//check if user was updated recently, otherwise use the database
	// const randomsForUser = await prisma.random.findMany({
	// 	where: {
	// 		account_id: session.user.account_id
	// 	}
	// });

    console.log(`[api/random/${account_id}/complete] completing random for: randomID - ${completedRandom.id} randomedHero - ${completedRandom.randomedHero} in match - ${completedMatch.match_id}`);

	let completedRandomWithoutMatch = { ...completedRandom }
	delete completedRandomWithoutMatch.match

	const randomCompleteResults = await prisma.random.update({
        where: {
            id: completedRandom.id
        },
		data: {
            ...completedRandomWithoutMatch,
            active: false,
            status: 'completed',
			win: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win),
            endDate: new Date(),
            endMatchID: completedMatch.id,
			endGold: winOrLoss(completedMatch.player_slot, completedMatch.radiant_win) ? completedRandomWithoutMatch.expectedGold : 0
			// account_id: session.user.account_id,
			// active: true,
			// status: 'active',
			// date: new Date(),
			// availableHeroes: randomStoreValues.availableHeroes.toString(),
			// bannedHeroes: randomStoreValues.bannedHeroes.toString(),
			// selectedRoles: randomStoreValues.selectedRoles.toString(),
			// expectedGold: randomStoreValues.expectedGold,
			// modifierAmount: randomStoreValues.modifierAmount,
			// modifierTotal: randomStoreValues.modifierTotal,
			// randomedHero: randomStoreValues.randomedHero
		}
	});

	let newResponse = new Response(JSON.stringify({"status": "success", "update": randomCompleteResults}));
	return newResponse;
};
