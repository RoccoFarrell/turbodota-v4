import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { User } from '@prisma/client';
import prisma from '$lib/server/prisma';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	if (!session) {
		redirect(302, '/');
	}

	return {
		...parentData
	};
};

export const actions: Actions = {
	createLeague: async ({ request, locals }) => {
		const session = await locals.auth.validate();

		if (!session || !session.user.roles.includes('dev')) return fail(400, { message: 'Not an admin' });
		const { leagueName, dotaUsersList } = Object.fromEntries(await request.formData()) as Record<string, string>;

		try {
			console.log(leagueName, dotaUsersList);

			let parsedDUList = dotaUsersList.split(',');
			if (!parsedDUList.length || parsedDUList.length === 0) return fail(400, { dotaUsersList, missing: true });

			//create dotauser list

			interface createUser {
				account_id: number;
				lastUpdated: Date;
			}

			let createdUserList: createUser[] = parsedDUList.map((userID) => {
				let userObj: createUser = {
					account_id: parseInt(userID) | 0,
					lastUpdated: new Date()
				};

				if (parseInt(userID) > 0) {
					userObj = {
						account_id: parseInt(userID),
						lastUpdated: new Date()
					};
				}
				return userObj;
			});

			createdUserList = createdUserList.filter((cu) => cu.account_id !== 0);

			//add user creating league to league
			createdUserList.push({
				account_id: session.user.account_id,
				lastUpdated: new Date()
			})

			console.log(`dota user list: `, createdUserList);
			if (createdUserList.length < 1) {
				console.log('form failed');
				return fail(400, { dotaUsersList, missing: true });
			}
			let leagueCreateResult = await prisma.league.create({
				data: {
					name: leagueName,
					lastUpdated: new Date(),
					creatorID: session.user.account_id,
					members: {
						connectOrCreate: createdUserList.map((user) => {
							return {
								where: { account_id: user.account_id },
								create: user
							};
						})
					}
				}
			});

			console.log(leagueCreateResult);
			if (leagueCreateResult) return { success: true };
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not create league' });
		}
		console.log('league created');
		//console.log('username:', username, ' password:', password)
		redirect(302, '/leagues');
	}
};
