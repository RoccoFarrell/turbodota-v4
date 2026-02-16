/**
 * Grant Arcane Runes for new turbo/ranked matches.
 * Called after match records are written to the database.
 *
 * For each match with a qualifying game_mode that hasn't already been granted,
 * adds 1 Arcane Rune to the user's primary incremental save.
 */

import prisma from '$lib/server/prisma';
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';
import { addBankItem, type BankTx } from './bank.service.server';

/** All game modes that grant an Arcane Rune (turbo + ranked). */
const RUNE_GRANTING_GAME_MODES = new Set([GAME_MODE_TURBO, ...GAME_MODES_RANKED]);

interface MatchForRune {
	match_id: bigint | number;
	game_mode: number;
}

/**
 * Grant Arcane Runes for qualifying matches that haven't been granted yet.
 * Call this after writing match records for a user.
 *
 * @param accountId – The user's Dota 2 account_id.
 * @param matches – The matches that were just written (from the current sync).
 * @returns Number of runes granted.
 */
export async function grantRunesForNewMatches(
	accountId: number,
	matches: MatchForRune[]
): Promise<number> {
	// Filter to qualifying game modes
	const qualifying = matches.filter((m) => RUNE_GRANTING_GAME_MODES.has(m.game_mode));
	if (qualifying.length === 0) return 0;

	// Resolve user → primary save
	const user = await prisma.user.findUnique({
		where: { account_id: accountId },
		select: { id: true }
	});
	if (!user) {
		console.log(`[grantRunes] No User found for account_id ${accountId}, skipping rune grant`);
		return 0;
	}

	const save = await prisma.incrementalSave.findFirst({
		where: { userId: user.id },
		select: { id: true },
		orderBy: { createdAt: 'asc' }
	});
	if (!save) {
		console.log(`[grantRunes] No IncrementalSave found for user ${user.id}, skipping rune grant`);
		return 0;
	}

	// Check which matches have already been granted
	const matchIds = qualifying.map((m) => BigInt(m.match_id));
	const alreadyGranted = await prisma.incrementalRuneGrantedMatch.findMany({
		where: {
			account_id: accountId,
			matchId: { in: matchIds }
		},
		select: { matchId: true }
	});
	const grantedSet = new Set(alreadyGranted.map((r) => r.matchId.toString()));

	const toGrant = qualifying.filter((m) => !grantedSet.has(BigInt(m.match_id).toString()));
	if (toGrant.length === 0) return 0;

	// Grant runes in a single transaction
	await prisma.$transaction(async (tx) => {
		// Insert grant records
		for (const m of toGrant) {
			await tx.incrementalRuneGrantedMatch.create({
				data: {
					matchId: BigInt(m.match_id),
					account_id: accountId
				}
			});
		}
		// Add items to bank
		await addBankItem(save.id, 'arcane_rune', toGrant.length, tx as unknown as BankTx);
	});

	console.log(
		`[grantRunes] Granted ${toGrant.length} Arcane Rune(s) for account_id ${accountId} (save ${save.id})`
	);
	return toGrant.length;
}
