import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { CONVERT_WIN_ESSENCE_COST } from '$lib/incremental/actions';
import { resolveIncrementalSave } from '$lib/server/incremental-save';

/** Player slot: 0-4 radiant, 128-132 dire */
function isWin(player_slot: number, radiant_win: boolean): boolean {
	return (radiant_win && player_slot < 128) || (!radiant_win && player_slot >= 128);
}

/** POST /api/incremental/roster/convert-win – body { saveId?, matchId }. Deduct Essence from save, add hero to that save's roster. */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: { saveId?: string; matchId?: string | number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');
	const accountId = session.user.account_id;

	const matchIdRaw = body.matchId;
	if (matchIdRaw === undefined || matchIdRaw === null) error(400, 'matchId is required');
	const matchId = typeof matchIdRaw === 'number' ? BigInt(matchIdRaw) : BigInt(String(matchIdRaw));

	const match = await prisma.match.findFirst({
		where: { account_id: accountId, match_id: matchId },
		select: { match_id: true, hero_id: true, player_slot: true, radiant_win: true }
	});
	if (!match) error(400, 'Match not found or not yours');
	if (!isWin(match.player_slot, match.radiant_win)) error(400, 'Only wins can be converted');

	const [save, alreadyConverted, alreadyOnRoster] = await Promise.all([
		prisma.incrementalSave.findUnique({
			where: { id: saveId },
			select: { essence: true }
		}),
		prisma.incrementalConvertedMatch.findUnique({
			where: { saveId_matchId: { saveId, matchId } }
		}),
		prisma.incrementalRosterHero.findUnique({
			where: { saveId_heroId: { saveId, heroId: match.hero_id } }
		})
	]);

	if (!save) error(404, 'Save not found');
	if (alreadyConverted) error(400, 'This win was already converted');
	if (alreadyOnRoster) error(400, 'Hero already on roster');
	const essence = save.essence ?? 0;
	if (essence < CONVERT_WIN_ESSENCE_COST) error(400, 'Not enough Essence');

	await prisma.$transaction(async (tx) => {
		await tx.incrementalSave.update({
			where: { id: saveId },
			data: { essence: essence - CONVERT_WIN_ESSENCE_COST }
		});
		await tx.incrementalRosterHero.create({
			data: { saveId, heroId: match.hero_id }
		});
		await tx.incrementalConvertedMatch.create({
			data: { saveId, matchId }
		});
	});

	const [newSave, roster] = await Promise.all([
		prisma.incrementalSave.findUnique({ where: { id: saveId }, select: { essence: true } }),
		prisma.incrementalRosterHero.findMany({
			where: { saveId },
			select: { heroId: true },
			orderBy: { createdAt: 'asc' }
		})
	]);

	return json({
		essence: newSave?.essence ?? 0,
		saveId,
		roster: roster.map((r) => r.heroId)
	});
};
