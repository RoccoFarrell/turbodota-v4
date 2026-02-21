import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { getRecruitCost } from '$lib/incremental/actions';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getBankBalance, deductBankCurrency, type BankTx } from '$lib/incremental/bank/bank.service.server';

/** Player slot: 0-4 radiant, 128-132 dire */
function isWin(player_slot: number, radiant_win: boolean): boolean {
	return (radiant_win && player_slot < 128) || (!radiant_win && player_slot >= 128);
}

/** POST /api/incremental/roster/convert-win – body { saveId?, matchId }. Deduct Essence from Bank, add hero to roster. */
export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: { saveId?: string; matchId?: string | number };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const save = await resolveIncrementalSave(event, { saveId: body.saveId });
	const accountId = save.account_id;
	if (!accountId) {
		error(400, 'This save has no Dota account ID set. Please set one in your profile or save settings.');
	}

	const matchIdRaw = body.matchId;
	if (matchIdRaw === undefined || matchIdRaw === null) error(400, 'matchId is required');
	const matchId = typeof matchIdRaw === 'number' ? BigInt(matchIdRaw) : BigInt(String(matchIdRaw));

	const match = await prisma.match.findFirst({
		where: { account_id: accountId, match_id: matchId },
		select: { match_id: true, hero_id: true, player_slot: true, radiant_win: true }
	});
	if (!match) error(400, 'Match not found or not yours');
	if (!isWin(match.player_slot, match.radiant_win)) error(400, 'Only wins can be converted');

	const [essence, alreadyConverted, alreadyOnRoster, rosterCount] = await Promise.all([
		getBankBalance(save.saveId, 'essence'),
		prisma.incrementalConvertedMatch.findUnique({
			where: { saveId_matchId: { saveId: save.saveId, matchId } }
		}),
		prisma.incrementalRosterHero.findUnique({
			where: { saveId_heroId: { saveId: save.saveId, heroId: match.hero_id } }
		}),
		prisma.incrementalRosterHero.count({ where: { saveId: save.saveId } })
	]);

	const cost = getRecruitCost(rosterCount);

	if (alreadyConverted) error(400, 'This win was already converted');
	if (alreadyOnRoster) error(400, 'Hero already on roster');
	if (essence < cost) error(400, `Not enough Essence (need ${cost})`);

	await prisma.$transaction(async (tx) => {
		await deductBankCurrency(save.saveId, 'essence', cost, tx as unknown as BankTx);
		await tx.incrementalRosterHero.create({
			data: { saveId: save.saveId, heroId: match.hero_id }
		});
		await tx.incrementalConvertedMatch.create({
			data: { saveId: save.saveId, matchId }
		});
	});

	const [newEssence, roster] = await Promise.all([
		getBankBalance(save.saveId, 'essence'),
		prisma.incrementalRosterHero.findMany({
			where: { saveId: save.saveId },
			select: { heroId: true },
			orderBy: { createdAt: 'asc' }
		})
	]);

	return json({
		essence: newEssence,
		saveId: save.saveId,
		roster: roster.map((r) => r.heroId)
	});
};
