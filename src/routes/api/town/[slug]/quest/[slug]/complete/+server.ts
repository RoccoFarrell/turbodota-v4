import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import winOrLoss from '$lib/helpers/winOrLoss';
import dayjs from 'dayjs';
import type { Random } from '@prisma/client';

//constants
import {
	questWin_xpMultiplier,
	questWin_goldMultiplier,
	questLoss_goldMultiplier,
	questLoss_xpMultiplier
} from '$lib/constants/turbotown';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): number {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	return this.toString();
};

export const POST: RequestHandler = async ({ request, params, url, locals, fetch }) => {
	const user = locals.user;

	let requestData = await request.json();

	let account_id: number = parseInt(url.pathname.split('/api/town/')[1].split('/quest')[0]);
	let questID: number = parseInt(params.slug || '0');

	console.log('[/quest/complete] account_id, questID: ', account_id, questID);
	if (user) {
		if (account_id !== user.account_id)
			return new Response(JSON.stringify({ status: 'unauthorized' }), { status: 401 });

		console.log(
			`\n-----------\n[api/town/${account_id}/quest/${questID}/complete] account_id: ${account_id}, questID: ${questID}\n-------------\n`
		);

		console.log(`[api/town/${account_id}/quest/${questID}/complete] - checking random for: ${user.account_id}`);

		let randomStatusComplete: boolean = false;
		let completedRandom: Random | null = null;

		let completedQuest = requestData.quest
		let currentTown = requestData.currentTown
		let currentTownID = currentTown.id

		if (completedQuest.random.status === 'active') {
			const response = await fetch(
				`/api/players/${user.account_id}/randoms/${completedQuest.random.id}/complete`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ random: completedQuest.random })
				}
			);
			//console.log(`[api/town/${account_id}/quest/${questID}/complete] check random response: `, response);

			let responseData = await response.json();
			if (responseData.success) {
				randomStatusComplete = true;
				completedRandom = responseData.randomCompleteResults;
			}
		} else {
			if (completedQuest.random.status === 'completed') {
				randomStatusComplete = true;
				completedRandom = completedQuest.random;
			}
		}

		if (randomStatusComplete) {
			console.log('random was completed, time to complete quest');

			const tx_result = await prisma.$transaction(
				async (tx) => {
					let tx_startTime = dayjs()
					const quest = await tx.turbotownQuest.findFirst({
						where: {
							AND: [{ id: questID }, { status: 'active' }]
						}
					});

					//console.log('quest: ', quest);
					//console.log('completedRandom: ', completedRandom);

					if (quest && completedRandom) {
						const townQuestUpdateResult = await tx.turbotown.update({
							where: {
								id: currentTownID
							},
							data: {
								quests: {
									update: {
										where: {
											id: questID
										},
										data: {
											active: false,
											status: 'completed',
											win: completedRandom.win ? true : false,
											endDate: dayjs().toDate(),
											endXp: completedRandom.win ? quest.xp * questWin_xpMultiplier : quest.xp * questLoss_xpMultiplier,
											endGold: completedRandom.win
												? quest.gold * questWin_goldMultiplier
												: quest.gold * questLoss_goldMultiplier
										}
									}
								}
							},
							include: {
								metrics: true,
								quests: {
									orderBy: {
										endDate: 'asc'
									}
								}
							}
						});

						//console.log('townQuestUpdateResult: ', townQuestUpdateResult);

						let metrics_gold = townQuestUpdateResult.metrics.filter((metric) => metric.label === 'gold')[0];
						let metrics_xp = townQuestUpdateResult.metrics.filter((metric) => metric.label === 'xp')[0];
						let completedQuest = townQuestUpdateResult.quests.filter((quest) => quest.id === questID)[0];

						if (
							(completedQuest.endGold || completedQuest.endGold === 0) &&
							(completedQuest.endXp || completedQuest.endXp === 0)
						) {
							const townGoldUpdateResult = await tx.turbotown.update({
								where: {
									id: currentTownID
								},
								data: {
									metrics: {
										update: {
											where: {
												id: metrics_gold.id
											},
											data: {
												value: metrics_gold.value + completedQuest.endGold
											}
										}
									}
								}
							});

							const townXPUpdateResult = await tx.turbotown.update({
								where: {
									id: currentTownID
								},
								data: {
									metrics: {
										update: {
											where: {
												id: metrics_xp.id
											},
											data: {
												value: metrics_xp.value + completedQuest.endXp
											}
										}
									}
								},
								include: {
									metrics: true,
									quests: true
								}
							});

							let tx_endTime = dayjs()
							let executionTime = tx_endTime.diff(tx_startTime, 'millisecond')
							console.log(`[/quest/complete] execution time: ${executionTime}`)
							return { town: townXPUpdateResult, quest, executionTime };
						} else {
							let newResponse = new Response(
								JSON.stringify({ status: 'fail', message: 'no endXp or endGold', success: false })
							);
							return newResponse;
						}
					} else {
						let newResponse = new Response(
							JSON.stringify({ status: 'fail', message: 'no quest or completedRandom', success: false })
						);
						return newResponse;
					}
				},
				{
					maxWait: 9500, // default: 2000
					timeout: 9500 // default: 5000
				}
			);

			if (tx_result) {
				//if (tx_result.town) console.log('added gold and xp to town', tx_result.town.id, tx_result.town.metrics);
				let newResponse = new Response(JSON.stringify({ status: 'success', success: true, tx_result }));
				return newResponse;
			} else {
				let newResponse = new Response(JSON.stringify({ status: 'fail', message: 'no tx_result', success: false }));
				return newResponse;
			}
		} else {
			let newResponse = new Response(
				JSON.stringify({
					status: 'fail',
					message: 'random was not completed',
					success: false,
					random: completedQuest.random,
					questID
				})
			);
			return newResponse;
		}
	}

	let newResponse = new Response(JSON.stringify({ status: 'fail', message: 'couldnt update town', success: false }));
	return newResponse;
};
