import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import dayjs from 'dayjs';
import { initializeDotaDeckSeason } from '$lib/server/dotadeck';
import {
	GAME_MODE_TURBO,
	GAME_MODES_RANKED,
	RECENT_MATCH_DAYS
} from '$lib/constants/matches';
import { fetchOpenDotaPlayerProfile, OPENDOTA_DELAY_MS } from '$lib/server/opendota';
import { createDotaUser } from '../../api/helpers';
import { computeDarkRiftLeaderboard, type DarkRiftLeaderboardRow } from '$lib/server/league-leaderboard';

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const user = locals.user;
	if (!user) {
		redirect(302, '/');
	}

	const allUsers = await prisma.user.findMany({
		orderBy: { username: 'asc' },
		select: { id: true, username: true, account_id: true, avatar_url: true }
	});

	// Recent match counts (turbo vs ranked) for this league's members
	const selectedLeague = parentData.selectedLeague as
		| { id: number; members: { account_id: number }[] }
		| null
		| undefined;
	let memberMatchCounts: Record<number, { turbo: number; ranked: number }> = {};
	let memberLastRanked: Record<number, Date | null> = {};
	if (selectedLeague?.members?.length) {
		const accountIds = selectedLeague.members.map((m) => m.account_id);
		const recentCutoffSec = Math.floor(Date.now() / 1000) - RECENT_MATCH_DAYS * 24 * 60 * 60;
		const recentCutoff = BigInt(recentCutoffSec);
		const matches = await prisma.match.findMany({
			where: {
				account_id: { in: accountIds },
				start_time: { gte: recentCutoff }
			},
			select: { account_id: true, game_mode: true }
		});
		for (const account_id of accountIds) {
			memberMatchCounts[account_id] = { turbo: 0, ranked: 0 };
		}
		for (const m of matches) {
			if (!memberMatchCounts[m.account_id]) continue;
			if (m.game_mode === GAME_MODE_TURBO) memberMatchCounts[m.account_id].turbo += 1;
			else if (GAME_MODES_RANKED.includes(m.game_mode)) memberMatchCounts[m.account_id].ranked += 1;
		}

		// Last ranked match date per member (most recent ranked match by start_time)
		const rankedMatches = await prisma.match.findMany({
			where: {
				account_id: { in: accountIds },
				game_mode: { in: GAME_MODES_RANKED }
			},
			select: { account_id: true, start_time: true },
			orderBy: { start_time: 'desc' }
		});
		for (const m of rankedMatches) {
			if (memberLastRanked[m.account_id] === undefined) {
				memberLastRanked[m.account_id] = new Date(Number(m.start_time) * 1000);
			}
		}
		for (const account_id of accountIds) {
			if (memberLastRanked[account_id] === undefined) memberLastRanked[account_id] = null;
		}
	}

	// Dark Rift leaderboard: find active darkrift season and compute leaderboard
	let darkRiftLeaderboard: DarkRiftLeaderboardRow[] = [];
	let activeDarkRiftSeason: { id: number; name: string; startDate: Date; endDate: Date } | null = null;

	if (selectedLeague && 'seasons' in selectedLeague) {
		const seasons = (selectedLeague as any).seasons ?? [];
		const season = seasons.find((s: any) => s.active && s.type === 'darkrift');
		if (season) {
			activeDarkRiftSeason = {
				id: season.id,
				name: season.name,
				startDate: season.startDate,
				endDate: season.endDate
			};
			darkRiftLeaderboard = await computeDarkRiftLeaderboard(
				{ members: (selectedLeague as any).members },
				{ startDate: season.startDate, endDate: season.endDate }
			);
		}
	}

	return {
		...parentData,
		allUsers,
		memberMatchCounts,
		memberLastRanked,
		darkRiftLeaderboard,
		activeDarkRiftSeason
	};
};

export const actions: Actions = {
	addLeagueMembers: async ({ request, locals, params }) => {
		const user = locals.user;
		if (!user || !user.roles?.includes('dev')) return fail(403, { message: 'Not an admin' });

		const leagueID = parseInt(params.slug, 10);
		if (Number.isNaN(leagueID)) return fail(400, { message: 'Invalid league' });

		const formData = await request.formData();
		const accountIdsRaw = formData.get('account_ids')?.toString() ?? '';
		const accountIds = accountIdsRaw
			.split(',')
			.map((s) => parseInt(s.trim(), 10))
			.filter((id) => Number.isNaN(id) === false && id > 0);

		if (accountIds.length === 0) return fail(400, { message: 'No valid account IDs' });

		try {
			for (let i = 0; i < accountIds.length; i++) {
				const account_id = accountIds[i];
				await createDotaUser(account_id);
				// Fetch OpenDota profile for display name/avatar (no Steam login)
				const profile = await fetchOpenDotaPlayerProfile(account_id);
				if (profile && (profile.personaname || profile.avatarfull)) {
					await prisma.dotaUser.update({
						where: { account_id },
						data: {
							display_name: profile.personaname ?? undefined,
							avatar_url: profile.avatarfull ?? undefined
						}
					});
				}
				// Rate limit: delay before next OpenDota call
				if (i < accountIds.length - 1) await sleep(OPENDOTA_DELAY_MS);
			}
			await prisma.league.update({
				where: { id: leagueID },
				data: {
					members: {
						connect: accountIds.map((account_id) => ({ account_id }))
					}
				}
			});
			return { addMembersSuccess: true };
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not add members' });
		}
	},

	removeLeagueMember: async ({ request, locals, params }) => {
		const user = locals.user;
		if (!user || !user.roles?.includes('dev')) return fail(403, { message: 'Not an admin' });

		const leagueID = parseInt(params.slug, 10);
		if (Number.isNaN(leagueID)) return fail(400, { message: 'Invalid league' });

		const formData = await request.formData();
		const account_id = parseInt(formData.get('account_id')?.toString() ?? '', 10);
		if (Number.isNaN(account_id) || account_id < 1) return fail(400, { message: 'Invalid account ID' });

		try {
			await prisma.league.update({
				where: { id: leagueID },
				data: {
					members: {
						disconnect: [{ account_id }]
					}
				}
			});
			return { removeMemberSuccess: true };
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not remove member' });
		}
	},

	createSeason: async ({ request, locals }) => {
		const user = locals.user;

		if (!user || !user.roles?.includes('dev')) return fail(400, { message: 'Not an admin' });

		const formData = await request.formData()

		try {
			let seasonType = formData.get('seasonType')?.toString() || ""
			let seasonStartDate = formData.get('seasonStartDate')?.toString() || ""
			let seasonEndDate = formData.get('seasonEndDate')?.toString() || ""
			let leagueName = formData.get('leagueName')?.toString() || ""
			let seasonMembers = JSON.parse(`[${formData.get('members')?.toString()}]`|| "[]")
			let seasonCreatorID = parseInt(formData.get('creatorID')?.toString() || "0")
			let leagueID = parseInt(formData.get('leagueID')?.toString() || "0")

			let seasonName = leagueName.split(' ').map(word => word[0].toUpperCase()).join("")

			let seasonNameFormatted = seasonName + ' - ' + seasonType[0].toUpperCase() + seasonType.slice(1) + ' - ' + dayjs(seasonStartDate).format("MMM YYYY")

			if (!seasonType || !seasonStartDate || !seasonEndDate) {
				return fail(400, { missing: true });
			}

			const seasonCreateResult = await prisma.season.create({
				data: {
					name: seasonNameFormatted,
					creatorID: seasonCreatorID,
					leagueID,
					startDate: dayjs(seasonStartDate).toDate(),
					endDate: dayjs(seasonEndDate).toDate(),
					type: seasonType,
					members: {
						connect: seasonMembers.map((account_id: any) => ({
							account_id
						}))
					}
				}
			});

			// Initialize DotaDeck data if needed
			if (seasonType === 'dotadeck') {
				await initializeDotaDeckSeason(seasonCreateResult);
			}

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not create season' });
		}
	}
};
