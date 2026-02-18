import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/');
	const user = locals.user;

	// --- Incremental saves with currencies + roster ---
	const rawSaves = await prisma.incrementalSave.findMany({
		where: { userId: user.id },
		include: {
			bankCurrencies: { select: { currencyKey: true, amount: true } },
			rosterHeroes: { select: { heroId: true } },
			lineups: { select: { id: true } }
		},
		orderBy: { updatedAt: 'desc' }
	});

	const saves = rawSaves.map((s) => ({
		id: s.id,
		name: s.name,
		account_id: s.account_id,
		updatedAt: s.updatedAt.toISOString(),
		currencies: Object.fromEntries(s.bankCurrencies.map((c) => [c.currencyKey, c.amount])),
		rosterCount: s.rosterHeroes.length,
		lineupCount: s.lineups.length
	}));

	// --- Match stats (requires account_id) ---
	let matchStats: {
		totalGames: number;
		wins: number;
		losses: number;
		winRate: number;
		totalKills: number;
		totalDeaths: number;
		totalAssists: number;
		kdaRatio: number;
		topHeroes: { heroId: number; games: number; name: string; internalName: string }[];
		avgNetWorth: number | null;
		avgHeroDamage: number | null;
		detailCount: number;
	} | null = null;

	if (user.account_id) {
		const allMatches = await prisma.match.findMany({
			where: { account_id: user.account_id },
			select: {
				kills: true,
				deaths: true,
				assists: true,
				hero_id: true,
				player_slot: true,
				radiant_win: true
			}
		});

		if (allMatches.length > 0) {
			const totalGames = allMatches.length;
			// slot < 128 = radiant; win when player side matches winning side
			const wins = allMatches.filter((m) => (m.player_slot < 128) === m.radiant_win).length;
			const totalKills = allMatches.reduce((s, m) => s + m.kills, 0);
			const totalDeaths = allMatches.reduce((s, m) => s + m.deaths, 0);
			const totalAssists = allMatches.reduce((s, m) => s + m.assists, 0);
			const kdaRatio =
				totalDeaths > 0
					? (totalKills + totalAssists) / totalDeaths
					: totalKills + totalAssists;

			// Hero frequency map → top 5
			const heroCounts: Record<number, number> = {};
			for (const m of allMatches) {
				heroCounts[m.hero_id] = (heroCounts[m.hero_id] ?? 0) + 1;
			}
			const topHeroEntries = Object.entries(heroCounts)
				.sort((a, b) => Number(b[1]) - Number(a[1]))
				.slice(0, 5)
				.map(([id, count]) => ({ heroId: parseInt(id), games: count }));

			const heroData = await prisma.hero.findMany({
				where: { id: { in: topHeroEntries.map((h) => h.heroId) } },
				select: { id: true, localized_name: true, name: true }
			});

			const topHeroes = topHeroEntries.map(({ heroId, games }) => {
				const hero = heroData.find((h) => h.id === heroId);
				return {
					heroId,
					games,
					name: hero?.localized_name ?? 'Unknown',
					internalName: hero?.name ?? ''
				};
			});

			// Avg networth + damage from detailed matches (recent 100)
			const details = await prisma.playersMatchDetail.findMany({
				where: { account_id: user.account_id },
				select: { net_worth: true, hero_damage: true },
				orderBy: { match_id: 'desc' },
				take: 100
			});

			const avgNetWorth =
				details.length > 0
					? Math.round(details.reduce((s, d) => s + d.net_worth, 0) / details.length)
					: null;
			const avgHeroDamage =
				details.length > 0
					? Math.round(details.reduce((s, d) => s + (d.hero_damage ?? 0), 0) / details.length)
					: null;

			matchStats = {
				totalGames,
				wins,
				losses: totalGames - wins,
				winRate: Math.round((wins / totalGames) * 100),
				totalKills,
				totalDeaths,
				totalAssists,
				kdaRatio: Math.round(kdaRatio * 100) / 100,
				topHeroes,
				avgNetWorth,
				avgHeroDamage,
				detailCount: details.length
			};
		}
	}

	return { user, saves, matchStats };
};

export const actions: Actions = {
	updateUsername: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Not authenticated');

		const data = await request.formData();
		const username = data.get('username')?.toString().trim() ?? '';

		if (username.length < 3 || username.length > 30) {
			return fail(400, { updateUsername: { error: 'Username must be 3–30 characters' } });
		}
		if (!/^[a-zA-Z0-9_\-. ]+$/.test(username)) {
			return fail(400, {
				updateUsername: { error: 'Only letters, numbers, spaces, _ - . allowed' }
			});
		}

		const existing = await prisma.user.findUnique({ where: { username } });
		if (existing && existing.id !== locals.user.id) {
			return fail(400, { updateUsername: { error: 'Username already taken' } });
		}

		await prisma.user.update({
			where: { id: locals.user.id },
			data: { username }
		});

		return { updateUsername: { success: true, username } };
	},

	setAccountId: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Not authenticated');

		const data = await request.formData();
		const accountIdStr = data.get('account_id');

		if (!accountIdStr || typeof accountIdStr !== 'string') {
			return { success: false, error: 'Account ID is required' };
		}

		const account_id = parseInt(accountIdStr, 10);
		if (isNaN(account_id) || account_id <= 0) {
			return { success: false, error: 'Invalid account ID' };
		}

		const existing = await prisma.user.findUnique({ where: { account_id } });
		if (existing && existing.id !== locals.user.id) {
			return { success: false, error: 'This account ID is already in use' };
		}

		// User.account_id is a FK → DotaUser.account_id.
		// Ensure a DotaUser row exists before setting the FK, otherwise PostgreSQL
		// will reject the update with a foreign-key constraint violation.
		await prisma.dotaUser.upsert({
			where: { account_id },
			create: { account_id, lastUpdated: new Date() },
			update: {}
		});

		await prisma.user.update({
			where: { id: locals.user.id },
			data: { account_id }
		});

		return { success: true };
	}
};
