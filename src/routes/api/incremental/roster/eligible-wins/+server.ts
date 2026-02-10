import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';

/** Player slot: 0-4 radiant, 128-132 dire. Win = (radiant_win && slot < 128) || (!radiant_win && slot >= 128) */
function isWin(player_slot: number, radiant_win: boolean): boolean {
	return (radiant_win && player_slot < 128) || (!radiant_win && player_slot >= 128);
}

function gameModeLabel(game_mode: number): 'Turbo' | 'Ranked' | 'Other' {
	if (game_mode === GAME_MODE_TURBO) return 'Turbo';
	if (GAME_MODES_RANKED.includes(game_mode)) return 'Ranked';
	return 'Other';
}

/** GET /api/incremental/roster/eligible-wins – last 10 games with flags for UI. Query: saveId (optional). */
export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session) return new Response(null, { status: 401 });
	const saveId = event.url.searchParams.get('saveId') ?? undefined;
	const { saveId: resolvedSaveId } = await resolveIncrementalSave(event, { saveId });
	const accountId = session.user.account_id;

	const [matches, converted, roster, heroes] = await Promise.all([
		prisma.match.findMany({
			where: { account_id: accountId },
			orderBy: { start_time: 'desc' },
			take: 10,
			select: { match_id: true, hero_id: true, player_slot: true, radiant_win: true, start_time: true, game_mode: true }
		}),
		prisma.incrementalConvertedMatch.findMany({
			where: { saveId: resolvedSaveId },
			select: { matchId: true }
		}),
		prisma.incrementalRosterHero.findMany({
			where: { saveId: resolvedSaveId },
			select: { heroId: true }
		}),
		prisma.hero.findMany({ select: { id: true, localized_name: true } })
	]);

	const heroNames = new Map(heroes.map((h) => [h.id, h.localized_name]));
	const convertedSet = new Set(converted.map((c) => c.matchId.toString()));
	const rosterHeroIds = new Set(roster.map((r) => r.heroId));

	const recentMatches = matches.map((m) => {
		const win = isWin(m.player_slot, m.radiant_win);
		const alreadyRecruited = convertedSet.has(m.match_id.toString());
		const onRoster = rosterHeroIds.has(m.hero_id);
		const isDuplicateHero = win && !alreadyRecruited && onRoster;
		const eligible = win && !alreadyRecruited && !onRoster;

		return {
			matchId: m.match_id.toString(),
			heroId: m.hero_id,
			heroName: heroNames.get(m.hero_id) ?? `Hero ${m.hero_id}`,
			startTime: Number(m.start_time),
			gameModeLabel: gameModeLabel(m.game_mode),
			win,
			alreadyRecruited,
			isDuplicateHero,
			eligible
		};
	});

	const eligibleWins = recentMatches.filter((m) => m.eligible);

	return json({
		recentMatches,
		eligibleWins,
		saveId: resolvedSaveId
	});
};
