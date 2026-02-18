import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';

//constants
import { constant_questGold, constant_questXP } from '$lib/constants/turbotown';
import type { User } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals }) => {
	let tx_startTime = dayjs();
	console.log('tx_startTime: ', tx_startTime.unix());

	//read request data
	let randomRequestBody = await request.json();
	const user = locals.user;

	console.log('[random create] - auth check: ', dayjs().diff(tx_startTime, 'millisecond'));

	console.log(
		`[/api/random/${params.slug}/create] user: `,
		JSON.stringify(user),
		`params.slug: `,
		params.slug
	);

	let randomCreateResult;

	if (user) {
		if (params.slug?.toString() !== user.account_id?.toString())
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		console.log(`params: ${JSON.stringify(params)}`);

		let account_id: number = parseInt(params.slug || '0');
		console.log(`\n-----------\n[matches] account_id: ${account_id}\n-------------\n`);

		//let randomRequestBody = await request.json();
		//console.log('request json: ', randomRequestBody);

		console.log(`[api/random/${account_id}/create] creating random for: ${randomRequestBody.randomedHero}`);

		console.log('[random create] -find first dota user: ', account_id, dayjs().diff(tx_startTime, 'millisecond'));
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
							where: { account_id },
							include: {
								quests: {
									where: {
										active: true
									}
								}
							}
						}
					}
				}
			}
		});

		let timeMarker1 = dayjs().diff(tx_startTime, 'millisecond');
		console.log('[random create] time to user result lookup: ', timeMarker1);

		let season = null;
		if (userResult && userResult.seasons) {
			let randomSeasonIndex = userResult.seasons.findIndex((season) => season.type === 'random' && season.active);
			if (randomSeasonIndex !== -1) {
				season = userResult.seasons[randomSeasonIndex];
			} else {
				console.warn('randomSeasonIndex was -1');
			}
		}

		if (season && season.turbotowns.length > 0) {
			if (season.turbotowns[0].quests.length < 3) {
			randomCreateResult = await prisma.random.create({
				data: {
					account_id: user.account_id!,
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
							type: 'random',
							active: true,
							status: 'active',
							xp: constant_questXP,
							gold: constant_questGold,
							createdDate: new Date()
						}
					}
				}
			});
		} else {
			return new Response(JSON.stringify({ status: 'already have 3 quests, try refreshing' }), { status: 401 });
		}
	} else {
		randomCreateResult = await prisma.random.create({
			data: {
				account_id: user.account_id!,
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

		let timeMarker2 = dayjs().diff(tx_startTime, 'millisecond');
		console.log('[random create] time to random create: ', timeMarker2);
	} else {
		return new Response(JSON.stringify({ status: 'unauthorized to create random for this user' }), { status: 401 });
	}

	let tx_endTime = dayjs();
	let executionTime = tx_endTime.diff(tx_startTime, 'millisecond');
	let newResponse = new Response(JSON.stringify({ status: 'success', insert: randomCreateResult, executionTime }));
	return newResponse;
};
