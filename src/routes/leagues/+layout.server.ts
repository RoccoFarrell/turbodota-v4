import type { LayoutServerLoad } from './$types'
import { fail, redirect, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';


export const load: LayoutServerLoad = async ({ locals, url, parent }) => {
	const parentData = await parent();
	const user = locals.user;
	if (!user) {
		redirect(302, '/');
	}

	const leagues = await prisma.league.findMany({
		include: {
			members: {
				include: {
					user: true
				}
			},
			creator: true,
			seasons: {
				include: {
					members: true
				}
			}
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