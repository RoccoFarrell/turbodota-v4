import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs'

//import { createDotaUser } from '../api/helpers';

export const actions: Actions = {
	useItem: async ({ request, locals }) => {
		console.log('received useItem post in turbotown page server');
		const session = await locals.auth.validate();
		if (!session) return fail(400, { message: 'Not logged in, cannot use item' });
		const formData = await request.formData();
		let hero = JSON.parse(formData.get('observerSelect')?.toString() || '');
		console.log('random hero select:', hero);

		console.log('user trying to use item', session.user.account_id);
		try {
			let tx_result = await prisma.$transaction(async (tx) => {
				// 1. Verify that the user has at least one of the item in inventory
				let itemCheck = await tx.turbotownItem.findFirstOrThrow({
					where: {
						itemID: 0
					}
				});
				//console.log('itemCheck:', itemCheck)

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

        if(account_id === -1) return(fail(400, {account_id, missing: true} ))
        if(heroID === -1) return(fail(400, {heroID, missing: true} ))
        if(timestamp === 0) return(fail(400, {timestamp, missing: true} ))

        let winVal: boolean = false
        if(win === "true") winVal = true

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

        if(matchInsertResult) return {success: true, matchInsertResult}
	}
};
