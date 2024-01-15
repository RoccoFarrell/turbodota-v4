import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';

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
	adminAction: async ({ request, locals }) => {
		console.log('received createFakeMatch post in turbotown page server');
		const session = await locals.auth.validate();
		if (!session) return fail(400, { message: 'Not logged in, cannot use item' });
		const formData = await request.formData();
		let test = JSON.stringify(formData.get('userID')?.toString() || '');
		//let activeOptionID = parseInt(formData.get('activeOptionID')?.toString() || '-1')
		//console.log('active option ID:', activeOptionID);
		console.log(test)

		// if (activeOptionID == 0) {
		// 	//console.log('Add a fake match')


		// }

		console.log('user trying to add fake match', session.user.account_id);
	}
};
