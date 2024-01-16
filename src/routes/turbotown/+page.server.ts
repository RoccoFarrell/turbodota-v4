//lucia
import { auth } from '$lib/server/lucia';

//svelte
import { fail, redirect, json } from '@sveltejs/kit';
import { setContext, getContext, onMount } from 'svelte';
import type { Actions, PageServerLoad } from './$types';

//prisma
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';
import type { Hero } from '@prisma/client';

//dayjs
import dayjs from 'dayjs'

//stores
import { townStore } from '$lib/stores/townStore';

//constants
import { constant_questGold, constant_questXP } from '$lib/constants/turbotown';
//import { createDotaUser } from '../api/helpers';

export const actions: Actions = {
	useItem: async ({ request, locals, fetch }) => {
		console.log('received useItem post in turbotown page server');
		const session = await locals.auth.validate();
		if (!session) return fail(400, { message: 'Not logged in, cannot use item' });
		const formData = await request.formData();

		//this will need to change when there are more items
		//let hero = JSON.parse(formData.get('observerSelect')?.toString() || '');

		let turbotownID = parseInt(formData.get('turbotownID')?.toString() || '-1');
		let questStoreSlot = parseInt(formData.get('questStoreSlot')?.toString() || '')
		let questStore = JSON.parse(formData.get('questStore')?.toString() || '');
		//console.log('turbotownID: ', (turbotownID))
		//console.log('random hero select:', hero);

		console.log('user trying to use item', session.user.account_id);
		try {
			let tx_result = await prisma.$transaction(async (tx) => {
				// 1. Verify that the user has at least one of the item in inventory
				// look for itemID 0 (observer) for now - this will need to change when there are more items
				let itemCheck = await tx.turbotownItem.findFirstOrThrow({
					where: {
						// need to fix hardcoded values
						itemID: 0
					}
				});

				// 2. Decrement item from the user
				if (itemCheck) {
					const sender = await tx.turbotownItem.delete({
						where: {
							id: itemCheck.id
						}
					});

					if (!sender) {
						throw new Error(`${session.user.account_id} failed to delete item!`);
					}

					// 3. Enter the selected random hero into the quest slot
					let questData = {
						...questStore,
						availableHeroes: questStore.availableHeroes.map((hero: Hero) => hero.id),
						bannedHeroes: questStore.bannedHeroes.map((hero: Hero) => hero.id),
						randomedHero: questStore.randomedHero.id,
						questSlot: questStoreSlot
					};

					let response = await fetch(`/api/random/${session.user.account_id}/create`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(questData)
					});

					// 4. add resolvedDate to TurboTownStatus
					let statusUpdateResult = await prisma.turbotownStatus.update({
						where: {
							// need to fix hardcoded values
							townPlusName: { turbotownID, name: 'observer' }
						},
						data: {
							isActive: false,
							resolvedDate: new Date(),
						}
					})

					//5. Add new record for new set of heroes
					let randomHeroList: Array<Hero> = new Array<Hero>();
					// let heroes: Hero[] = getContext('heroes');


					// console.log('generating new randoms')
					// //generate 3 new random heroes
					// const generateRandomIndex = (exclude: number[] = []) => {
					// 	let randomIndex = Math.floor(Math.random() * heroes.length);
					// 	while (exclude.includes(randomIndex)) {
					// 		randomIndex = Math.floor(Math.random() * heroes.length);
					// 	}
					// 	return randomIndex;
					// };

					// let randomIndex1 = generateRandomIndex();
					// let generatedRandomHero1 = heroes[randomIndex1];
					// let randomIndex2 = generateRandomIndex([randomIndex1]);
					// let generatedRandomHero2 = heroes[randomIndex2];
					// let randomIndex3 = generateRandomIndex([randomIndex1, randomIndex2]);
					// let generatedRandomHero3 = heroes[randomIndex3];
					// console.log('random heroes:', generatedRandomHero1, generatedRandomHero2, generatedRandomHero3);

					// randomHeroList.push(generatedRandomHero1);
					// randomHeroList.push(generatedRandomHero2);
					// randomHeroList.push(generatedRandomHero3);

					let statusData = {
						item: 'observer',
						info: [1, 2, 3]
					};

					console.log('about to add new record')

					//not working
					// let statusResponse = await prisma.turbotown.update({
					// 	where: {
					// 		account_id: session.user.account_id,
					// 	},
					// 	data: {
					// 		statuses: {
					// 			create: {
					// 				name: "observer",
					// 				isActive: true,
					// 				appliedDate: new Date(),
					// 				value: JSON.stringify(statusData.info)
					// 			}
					// 		}
					// 	}
					// })

					//not working
					// let statusResponse = await fetch(`/api/town/${session.user.account_id}/status`, {
					// 	method: 'POST',
					// 	headers: {
					// 		'Content-Type': 'application/json'
					// 	},
					// 	body: JSON.stringify(statusData)
					// });

					// console.log('response', statusResponse.json());
				}

				const itemUseResponse = await tx.turbotownAction.create({
					// need to fix hardcoded values
					data: {
						action: 'observer'
					}
				});
				console.log(itemUseResponse);

				return itemUseResponse;
			});

			if (tx_result) {
				console.log('returning');
				return { action: 'use item', result: tx_result, success: true };
			} else console.error('no return from use item');
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not delete item' });
		}
	},
	addFakeMatch: async ({ request, locals }) => {
		console.log('received createFakeMatch post in turbotown page server');
		const session = await locals.auth.validate();
		if (!session) return fail(400, { message: 'Not logged in, cannot use item' });
		const formData = await request.formData();
		let account_id: number = parseInt(formData.get('account_id')?.toString() || '-1');
		let heroID: number = parseInt(formData.get('heroID')?.toString() || '-1');
		let win: string = (formData.get('win')?.toString() || 'true');
		let timestamp: number = parseInt(formData.get('matchTS')?.toString() || '0')
		//let activeOptionID = parseInt(formData.get('activeOptionID')?.toString() || '-1')
		//console.log('active option ID:', activeOptionID);
		console.log(account_id, heroID, win, timestamp)

		if (account_id === -1) return (fail(400, { account_id, missing: true }))
		if (heroID === -1) return (fail(400, { heroID, missing: true }))
		if (timestamp === 0) return (fail(400, { timestamp, missing: true }))

		let winVal: boolean = false
		if (win === "1") winVal = true

		console.log('[admin] - user trying to add fake match', session.user.account_id);
		let fakeMatch = {
			"match_id": parseInt("999999" + Math.floor(Math.random() * 9999)),
			"account_id": account_id,
			"player_slot": 2,
			"radiant_win": winVal,
			"game_mode": 23,
			"hero_id": heroID,
			"start_time": timestamp,
			"duration": 1323,
			"lobby_type": 0,
			"version": null,
			"kills": 10,
			"deaths": 2,
			"assists": 13,
			"skill": null,
			"average_rank": 35,
			"leaver_status": 0,
			"party_size": null
		}

		const matchInsertResult = await prisma.match.upsert({
			where: {
				matchPlusAccount: { match_id: fakeMatch.match_id, account_id: fakeMatch.account_id }
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: Unreachable code error
			update: { ...fakeMatch },
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: Unreachable code error
			create: { ...fakeMatch }
		})

		if (matchInsertResult) return { success: true, matchInsertResult }
	}
};
