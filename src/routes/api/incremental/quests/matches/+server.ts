import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { ensureMatchDetails } from '$lib/server/ensure-match-details';
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';

const QUALIFYING_GAME_MODES = [GAME_MODE_TURBO, ...GAME_MODES_RANKED];

/** Max match-detail fetches per request to avoid rate limits. */
const MAX_DETAIL_FETCHES = 5;

function isWin(player_slot: number, radiant_win: boolean): boolean {
	return (radiant_win && player_slot < 128) || (!radiant_win && player_slot >= 128);
}

/**
 * GET /api/incremental/quests/matches?saveId=...&limit=5
 *
 * Returns the last N qualifying matches (turbo/ranked) for the current user with
 * hero, date, win/loss, and quest-relevant stats.
 */
export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');

	const save = await resolveIncrementalSave(event, { saveId: event.url.searchParams.get('saveId') ?? undefined });
	const accountId = save.account_id;
	if (!accountId) {
		error(400, 'This save has no Dota account ID set. Please set one in your profile or save settings.');
	}

	const limit = Math.min(20, Math.max(1, parseInt(event.url.searchParams.get('limit') ?? '5', 10) || 5));

	const matches = await prisma.match.findMany({
		where: {
			account_id: accountId,
			game_mode: { in: QUALIFYING_GAME_MODES },
			start_time: { gte: save.matchCutoff }
		},
		orderBy: { start_time: 'desc' },
		take: limit,
		select: {
			match_id: true,
			hero_id: true,
			player_slot: true,
			radiant_win: true,
			start_time: true
		}
	});

	if (matches.length === 0) {
		return json({ matches: [], heroNames: {} });
	}

	const matchIds = matches.map((m) => m.match_id);

	// Ensure we have PlayersMatchDetail for returned matches (stats come from there)
	const existingDetails = await prisma.playersMatchDetail.findMany({
		where: {
			account_id: accountId,
			match_id: { in: matchIds }
		},
		select: { match_id: true }
	});
	const existingMatchIds = new Set(existingDetails.map((d) => d.match_id.toString()));
	const missingMatchIds = matchIds.filter((m) => !existingMatchIds.has(m.toString()));
	let fetched = 0;
	for (const mid of missingMatchIds) {
		if (fetched >= MAX_DETAIL_FETCHES) break;
		const ok = await ensureMatchDetails(Number(mid));
		if (ok) fetched++;
		await new Promise((r) => setTimeout(r, 400));
	}

	const [details, heroes] = await Promise.all([
		prisma.playersMatchDetail.findMany({
			where: {
				account_id: accountId,
				match_id: { in: matchIds }
			},
			select: {
				match_id: true,
				last_hits: true,
				denies: true,
				net_worth: true,
				hero_damage: true,
				tower_damage: true,
				hero_healing: true
			}
		}),
		prisma.hero.findMany({
			where: { id: { in: [...new Set(matches.map((m) => m.hero_id))] } },
			select: { id: true, localized_name: true }
		})
	]);

	const detailByMatch = new Map(details.map((d) => [d.match_id.toString(), d]));
	const heroNames: Record<number, string> = Object.fromEntries(
		heroes.map((h) => [h.id, h.localized_name ?? `Hero ${h.id}`])
	);

	const matchesOut = matches.map((m) => {
		const detail = detailByMatch.get(m.match_id.toString());
		const win = isWin(m.player_slot, m.radiant_win);

		return {
			matchId: m.match_id.toString(),
			heroId: m.hero_id,
			heroName: heroNames[m.hero_id] ?? `Hero ${m.hero_id}`,
			startTime: Number(m.start_time),
			win,
			last_hits: detail?.last_hits ?? 0,
			denies: detail?.denies ?? 0,
			net_worth: detail?.net_worth ?? 0,
			hero_damage: detail?.hero_damage ?? 0,
			tower_damage: detail?.tower_damage ?? 0,
			hero_healing: detail?.hero_healing ?? 0
		};
	});

	return json({ matches: matchesOut, heroNames });
};
