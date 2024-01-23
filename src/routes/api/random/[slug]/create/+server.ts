import type { RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs'

//constants
import { constant_questGold, constant_questXP } from '$lib/constants/turbotown';
import type { Session } from 'lucia';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	let tx_startTime = dayjs()
	console.log('tx_startTime: ', tx_startTime.unix())

	//read request data 
	let randomRequestBody = await request.json();
	let session: Session | null;
	if(randomRequestBody.session){
		console.log('[random create] - found session in request body, skipping locals auth validate')
		session = randomRequestBody.session
	} else {
		console.log('[random create] - session wasnt found in request body, validating auth locally')
		session = await locals.auth.validate();
	}
	
	console.log('[random create] - locals auth validate: ', dayjs().diff(tx_startTime, "millisecond"))

	console.log(
		`[/api/random/${params.slug}/create] session in API call: `,
		JSON.stringify(session),
		`params.slug: `,
		params.slug
	);
	//reject the call if the user is not authenticated

	let randomCreateResult;

	if (session && session.user) {
		if (params.slug?.toString() !== session.user.account_id.toString())
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		console.log(`params: ${JSON.stringify(params)}`);

		let account_id: number = parseInt(params.slug || '0');
		console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);

		//let randomRequestBody = await request.json();
		//console.log('request json: ', randomRequestBody);

		console.log(`[api/random/${account_id}/create] creating random for: ${randomRequestBody.randomedHero}`);

		console.log('[random create] -find first dota user: ', account_id, dayjs().diff(tx_startTime, "millisecond"))
		//check if user was updated recently, otherwise use the database
		const userResult = await prisma.dotaUser.findFirst({
			where: {
				account_id
			},
			include: {
				seasons: {
					where: {
						active: true
					},
					include: {
						turbotowns: {
							where: { account_id }
						}
					}
				}
			}
		});

		let timeMarker1 = dayjs().diff(tx_startTime, "millisecond")
		console.log('[random create] time to user result lookup: ', timeMarker1)

		let season = null;
		if (userResult && userResult.seasons) {
			let randomSeasonIndex = userResult.seasons.findIndex((season) => season.type === 'random' && season.active);
			if (randomSeasonIndex !== -1) {
				season = userResult.seasons[randomSeasonIndex]
			} else {
				console.warn('randomSeasonIndex was -1');
			}
		}

		if (season && season.turbotowns.length > 0) {
			randomCreateResult = await prisma.random.create({
				data: {
					account_id: session.user.account_id,
					active: true,
					status: 'active',
					date: new Date(),
					availableHeroes: randomRequestBody.availableHeroes.toString(),
					bannedHeroes: randomRequestBody.bannedHeroes.toString(),
					selectedRoles: randomRequestBody.selectedRoles.toString(),
					expectedGold: randomRequestBody.expectedGold,
					modifierAmount: randomRequestBody.modifierAmount,
					modifierTotal: randomRequestBody.modifierTotal,
					randomedHero: randomRequestBody.randomedHero,
					seasons: {
						connect: { id: season.id }
					},
					quests: {
						create: {
							turbotownID: season.turbotowns[0].id,
                            questSlot: randomRequestBody.questSlot,
                            type: "random",
                            active: true,
                            status: "active",
                            xp: constant_questXP,
                            gold: constant_questGold,
							createdDate: new Date()
						}
					}
				}
			});
		} else {
			randomCreateResult = await prisma.random.create({
				data: {
					account_id: session.user.account_id,
					active: true,
					status: 'active',
					date: new Date(),
					availableHeroes: randomRequestBody.availableHeroes.toString(),
					bannedHeroes: randomRequestBody.bannedHeroes.toString(),
					selectedRoles: randomRequestBody.selectedRoles.toString(),
					expectedGold: randomRequestBody.expectedGold,
					modifierAmount: randomRequestBody.modifierAmount,
					modifierTotal: randomRequestBody.modifierTotal,
					randomedHero: randomRequestBody.randomedHero
				}
			});
		}

		let timeMarker2 = dayjs().diff(tx_startTime, "millisecond")
		console.log('[random create] time to random create: ', timeMarker2)
	} else {
		return new Response(JSON.stringify({ status: 'unauthorized to create random for this user' }), { status: 401 });
	}

	let tx_endTime = dayjs()
	let executionTime = tx_endTime.diff(tx_startTime, 'millisecond')
	let newResponse = new Response(JSON.stringify({ status: 'success', insert: randomCreateResult, executionTime }));
	return newResponse;
};
