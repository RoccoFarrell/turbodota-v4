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

	const leagues = await prisma.league.findMany({
		include: {
			members: true,
			creator: true
		}
	});

	const mostCommonFriends: any = await prisma.$queryRaw`
	SELECT
		t1.account_id as account1,
		t2.account_id as account2,
		COUNT(*)
	FROM "Match" t1
	JOIN "Match" t2
	ON t1.match_id = t2.match_id
	AND t1.account_id != t2.account_id
	WHERE t1.account_id = 65110965
	GROUP BY
		t1.account_id,
		t2.account_id
	ORDER BY 3 DESC
	LIMIT 10`;

	const commonFriendUsers = await prisma.user.findMany({
		where: {
			account_id: { in: mostCommonFriends.map((friend: any) => friend.account2) }
		}
	});

	return {
		leagues,
		common: {
			mostCommonFriends,
			commonFriendUsers,
			commonCombined: [
				...commonFriendUsers,
				...mostCommonFriends
					.filter(
						(friend: any) =>
							commonFriendUsers.filter((userFriend) => userFriend.account_id === friend.account2).length === 0
					)
					.map((f: any) => f.account2)
			]
		}
	};
};

export const actions: Actions = {
	createLeague: async ({ request, locals }) => {
		const session = await locals.auth.validate();

		if (!session.user.roles.includes('dev')) return fail(400, { message: 'Not an admin' });
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
