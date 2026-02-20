import winOrLoss from '$lib/helpers/winOrLoss';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail, redirect, json, error } from '@sveltejs/kit';
import { MATCH_CUTOFF_START_TIME } from '$lib/constants/matches';

export const load: PageServerLoad = async ({ locals }) => {
	const authUser = locals.user;
	if (!authUser) {
		redirect(302, '/');
	}

	// Get user data
	const user = await prisma.user.findUnique({
		where: { id: authUser.id }
	});

	console.log("Loading for account:", authUser.account_id);
	const seasonUser = await prisma.seasonUser.findFirst({
		where: {
			accountId: authUser.account_id!,
			season: {
				active: true
			}
		},
		include: {
			user: true,  // Include user data
			heroDraws: {
				where: {
					matchResult: null  // Only get active draws
				},
				orderBy: {
					drawnAt: 'desc'
				},
				take: 3  // Limit to hand size
			},
			cardHistory: true
		}
	});

	//console.log("Found hero draws:", seasonUser?.heroDraws);

	const heroDescriptions = await prisma.hero.findMany();

	// Get recent matches (site-wide cutoff: no matches before 2026-01-01)
	const recentMatches = await prisma.match.findMany({
		where: {
			account_id: authUser.account_id!,
			start_time: { gte: MATCH_CUTOFF_START_TIME }
		},
		orderBy: {
			start_time: 'desc'
		},
		take: 5
	});

	const matchTableData = recentMatches.map(m => ({
		match_id: m.match_id,
		result: winOrLoss(m.player_slot, m.radiant_win),
		hero: m.hero_id,
		win: winOrLoss(m.player_slot, m.radiant_win),
		kills: m.kills,
		deaths: m.deaths,
		assists: m.assists,
		kda: ((m.kills + m.assists) / (m.deaths || 1)).toFixed(2),
		start_time: new Date(Number(m.start_time) * 1000).toLocaleString()
	}));

	const activeDeck = await prisma.deck.findFirst({
		where: {
			seasonId: seasonUser?.seasonId,
			isActive: true
		},
		include: {
			cards: true
		}
	});

	// Get all held cards in the active season
	const heldCards = await prisma.card.findMany({
		where: {
			deck: {
				seasonId: seasonUser?.seasonId,
				isActive: true
			},
			heroDraws: {
				some: {
					matchResult: null,  // Only count active draws
					seasonUser: {
						season: {
							active: true
						}
					}
				}
			}
		},
		include: {
			heroDraws: true
		}
	});

	console.log('Found held cards:', heldCards);

	// Calculate totals from card history
	const totals = seasonUser?.cardHistory.reduce((acc, h) => ({
		gold: acc.gold + (h.action === 'QUEST_WIN' ? h.goldMod : 0),
		xp: acc.xp + (h.action === 'QUEST_WIN' ? h.xpMod : 0)
	}), { gold: 0, xp: 0 });

	return {
		seasonUser,
		activeDeck,
		heroDescriptions,
		heldHeroIds: heldCards.map(card => card.heroId),
		matchTableData,
		user,  // Pass user data to the client
		stats: {
			totalGold: totals?.gold ?? 0,
			totalXP: totals?.xp ?? 0
		}
	};
};

export const actions: Actions = {
	addFakeMatch: async ({ request, locals }) => {
		console.log('received createFakeMatch post in turbotown page server');
		const authUser = locals.user;
		if (!authUser) return fail(400, { message: 'Not logged in, cannot use item' });
		const formData = await request.formData();
		let account_id: number = parseInt(formData.get('account_id')?.toString() || '-1');
		let heroID: number = parseInt(formData.get('heroID')?.toString() || '-1');
		let win: string = formData.get('win')?.toString() || 'true';
		let timestamp: number = parseInt(formData.get('matchTS')?.toString() || '0');
		let fakeMatchID: number = parseInt('999999' + Math.floor(Math.random() * 9999));
		//let activeOptionID = parseInt(formData.get('activeOptionID')?.toString() || '-1')
		//console.log('active option ID:', activeOptionID);
		console.log("account_id, heroID, win, timestamp, fakeMatchID", account_id, heroID, win, timestamp, fakeMatchID);

		if (account_id === -1) return fail(400, { account_id, missing: true });
		if (heroID === -1) return fail(400, { heroID, missing: true });
		if (timestamp === 0) return fail(400, { timestamp, missing: true });

		let winVal: boolean = false;
		if (win === '1') winVal = true;

		console.log('[admin] - user trying to add fake match', authUser.account_id);
		let fakeMatch = {
			match_id: fakeMatchID,
			account_id: account_id,
			player_slot: 2,
			radiant_win: winVal,
			game_mode: 23,
			hero_id: heroID,
			start_time: timestamp,
			duration: 1323,
			lobby_type: 0,
			version: null,
			kills: 10,
			deaths: 2,
			assists: 13,
			skill: null,
			average_rank: 35,
			leaver_status: 0,
			party_size: null
		};

		try {
			// Wrap all operations in a transaction
			const result = await prisma.$transaction(async (tx) => {
				// First create match detail
				await tx.matchDetail.createMany({
					data: [{
						match_id: BigInt(fakeMatch.match_id),
						radiant_win: fakeMatch.radiant_win,
						duration: fakeMatch.duration,
						pre_game_duration: 120,
						start_time: BigInt(fakeMatch.start_time),
						tower_status_radiant: 0,
						tower_status_dire: 0,
						barracks_status_radiant: 0,
						barracks_status_dire: 0,
						first_blood_time: 100,
						patch: 51,
						radiant_score: 25,
						dire_score: 15,
						average_rank: 35
					}],
					skipDuplicates: true
				});

				// Then create player match detail
				await tx.playersMatchDetail.createMany({
					data: [{
						match_id: BigInt(fakeMatch.match_id),
						account_id: fakeMatch.account_id,
						player_slot: fakeMatch.player_slot,
						hero_id: fakeMatch.hero_id,
						item_0: 0,
						item_1: 0,
						item_2: 0,
						item_3: 0,
						item_4: 0,
						item_5: 0,
						backpack_0: 0,
						backpack_1: 0,
						backpack_2: 0,
						item_neutral: 0,
						kills: fakeMatch.kills,
						deaths: fakeMatch.deaths,
						assists: fakeMatch.assists,
						last_hits: 50,
						denies: 10,
						gold_per_min: 450,
						xp_per_min: 550,
						level: 18,
						net_worth: 12000,
						aghanims_scepter: 0,
						aghanims_shard: 0,
						moonshard: 0,
						hero_damage: 15000,
						tower_damage: 2000,
						hero_healing: 0,
						gold: 12000,
						gold_spent: 11000,
						win: winVal,
						lose: !winVal,
						total_gold: 12000,
						total_xp: 15000,
						kda: (fakeMatch.kills + fakeMatch.assists) / (fakeMatch.deaths || 1),
						benchmarks: '{}'
					}],
					skipDuplicates: true
				});

				// Finally create match
				return await tx.match.upsert({
					where: {
						matchPlusAccount: { match_id: fakeMatch.match_id, account_id: fakeMatch.account_id }
					},
					update: { ...fakeMatch },
					create: { ...fakeMatch }
				});
			});

			return { success: true, result };
		} catch (error) {
			console.error('Error creating fake match:', error);
			return fail(500, { message: 'Failed to create fake match' });
		}
	},
};