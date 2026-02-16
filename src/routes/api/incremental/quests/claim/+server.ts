import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getQuestProgress } from '$lib/incremental/quests/quest-progress.server';
import { getQuestDef } from '$lib/incremental/quests/quest-definitions';
import { addBankCurrency, addBankItem, type BankTx } from '$lib/incremental/bank/bank.service.server';

/**
 * POST /api/incremental/quests/claim
 * Body: { saveId?, questId }
 *
 * Claims a completed quest for the given save, granting its reward.
 * Quests are repeatable: increments claimCount, progress resets.
 */
export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session) error(401, 'Unauthorized');

	let body: { saveId?: string; questId?: string };
	try {
		body = await event.request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const questId = body.questId?.trim();
	if (!questId) error(400, 'questId is required');

	const questDef = getQuestDef(questId);
	if (!questDef) error(400, `Unknown quest: ${questId}`);

	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });
	const accountId = session.user.account_id;

	// Load current save-quest row (may not exist if they never loaded the quests page)
	const now = new Date();
	const existing = await prisma.incrementalSaveQuest.findUnique({
		where: { saveId_questId: { saveId, questId } },
		select: { claimCount: true }
	});
	const claimCount = existing?.claimCount ?? 0;

	// Recompute progress to verify completion server-side
	const progress = await getQuestProgress(accountId);
	const questProgress = progress.find((p) => p.questId === questId);
	const rawTotal = questProgress?.current ?? 0;
	const currentProgress = rawTotal - questDef.threshold * claimCount;

	if (currentProgress < questDef.threshold) {
		error(400, 'Quest not yet completed');
	}

	// Claim in a transaction: upsert save quest (reset period start, increment claim) + grant reward
	await prisma.$transaction(async (tx) => {
		await tx.incrementalSaveQuest.upsert({
			where: { saveId_questId: { saveId, questId } },
			create: {
				saveId,
				questId,
				startedAt: now,
				claimCount: 1,
				claimedAt: now
			},
			update: {
				startedAt: now,
				claimCount: { increment: 1 },
				claimedAt: now
			}
		});

		if (questDef.reward?.currency) {
			await addBankCurrency(
				saveId,
				questDef.reward.currency.key,
				questDef.reward.currency.amount,
				tx as unknown as BankTx
			);
		}
		if (questDef.reward?.item) {
			await addBankItem(
				saveId,
				questDef.reward.item.itemId,
				questDef.reward.item.quantity,
				tx as unknown as BankTx
			);
		}
	});

	return json({ success: true, questId, saveId });
};
