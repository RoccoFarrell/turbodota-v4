import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';
import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	//if (session) throw redirect(302, "/");

	async function getRandomsForUser() {
		return await prisma.random.findMany({
			where: {
				AND: [
					{
						account_id: session.user.account_id
					}
				]
			},
			include: {
				match: true
			}
		});
	}

	let returnObj = {};

	type RandomsForUser = Prisma.PromiseReturnType<typeof getRandomsForUser>;
	let randomsForUser: RandomsForUser = [];
	let filteredMatchData: Match[] = [];
	let rawMatchData: Match[] = [];
	let flags: any = {
		mocked: false
	};
	let responseComplete: any = null;
	let matchesSinceRandom: Match[] = [];

	if (session && session.user) {
		randomsForUser = await getRandomsForUser();

		console.log(`active random length: ${randomsForUser.filter((random) => random.active).length}`);

		//user has at least 1 active random
		if (randomsForUser.length > 0 && randomsForUser.filter((random) => random.active).length > 0) {
			//fetch most recent matches
			const response = await fetch(`${url.origin}/api/updateMatchesForUser/${session.user.account_id}`, {
				method: 'GET'
			});

			let responseData = await response.json();

			if (responseData.mocked) flags.mocked = true;

			console.log([`[random+page.server.ts] found ${responseData.matchData.length} for user`]);

			//format big int dates
			responseData.matchData.forEach((element: Match) => {
				element.start_time = new Date(Number(element.start_time) * 1000);
			});

			rawMatchData = responseData.matchData;

			//a user should only ever have 1 active random, if not, sort by the oldest one for evaluation
			let activeRandoms = randomsForUser
				.filter((random) => random.active)
				.sort((a: any, b: any) => {
					if (a.date < b.date) return -1;
					else return 1;
				});

			let activeRandomDate = activeRandoms[0].date;
			let activeRandomDate5Minutes = new Date(activeRandoms[0].date.getTime() - 5 * 60 * 1000);
			matchesSinceRandom = rawMatchData.filter((match: Match) => {
				match.start_time > activeRandomDate5Minutes;
			});

			console.log(`activeRandomDate: ${activeRandomDate}, minus 5 minutes: ${activeRandomDate5Minutes}`)

			//filter all matches for games in the oldest active random
			//minus 5 minutes from the random start date to account for picking phase
			filteredMatchData = rawMatchData
				.filter(
					(match: Match) =>
						match.hero_id === activeRandoms[0].randomedHero && match.start_time > activeRandomDate5Minutes
				)
				.sort((a: any, b: any) => {
					if (a.start_time < b.start_time) return -1;
					else return 1;
				});

			if (filteredMatchData.length > 0) {
				let completeResponse = await fetch(`${url.origin}/api/random/${session.user.account_id}/complete`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						completedRandom: activeRandoms[0],
						completedMatch: filteredMatchData[0],
						session: session
					})
				});
				let completeResponseData = await completeResponse.json();
				responseComplete = completeResponseData;
				randomsForUser = await getRandomsForUser();
			} else {
				responseComplete = { error: 'couldnt complete random' };
			}
		}
	}

	return {
		...parentData,
		randoms: randomsForUser,
		rawMatchData,
		randomAttempts: filteredMatchData,
		matchesSinceRandom,
		flags,
		responseComplete
	};
};
