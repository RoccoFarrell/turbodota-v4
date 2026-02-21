import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import { getQuestProgress } from '$lib/incremental/quests/quest-progress.server';
import { getOnboardingProgress } from '$lib/incremental/quests/onboarding-progress.server';
import { getQuestDef, type QuestReward } from '$lib/incremental/quests/quest-definitions';
import { addBankCurrency, addBankItem, type BankTx } from '$lib/incremental/bank/bank.service.server';

/**
 * POST /api/incremental/quests/claim
 * Body: { saveId?, questId }
 *
 * Claims a completed quest for the given save, granting its reward.
 * Supports both recurring (repeatable) and onboarding (one-time) quest types.
 */
export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) error(401, 'Unauthorized');

	let body: { saveId?: string; questId?: string };
	try {
		body = await event.request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const questId = body.questId?.trim();
	if (!questId) error(400, 'questId is required');

	const def = getQuestDef(questId);
	if (!def) error(400, `Unknown quest: ${questId}`);

	const save = await resolveIncrementalSave(event, { saveId: body.saveId });
	const now = new Date();

	if (def.type === 'recurring') {
		const accountId = save.account_id;
		if (!accountId) {
			error(
				400,
				'This save has no Dota account ID set. Please set one in your profile or save settings.'
			);
		}

		const existing = await prisma.incrementalSaveQuest.findUnique({
			where: { saveId_questId: { saveId: save.saveId, questId } },
			select: { claimCount: true }
		});
		const claimCount = existing?.claimCount ?? 0;

		// Recompute progress to verify completion server-side
		const progress = await getQuestProgress(accountId);
		const questProgress = progress.find((p) => p.questId === questId);
		const rawTotal = questProgress?.current ?? 0;
		const currentProgress = rawTotal - def.threshold * claimCount;

		if (currentProgress < def.threshold) {
			error(400, 'Quest not yet completed');
		}

		await prisma.$transaction(async (tx) => {
			await tx.incrementalSaveQuest.upsert({
				where: { saveId_questId: { saveId: save.saveId, questId } },
				create: {
					saveId: save.saveId,
					questId,
					type: 'recurring',
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
			await grantReward(save.saveId, def.reward, tx as unknown as BankTx);
		});
	} else if (def.type === 'onboarding') {
		// Onboarding: one-time only
		const existing = await prisma.incrementalSaveQuest.findUnique({
			where: { saveId_questId: { saveId: save.saveId, questId } },
			select: { claimCount: true }
		});
		if ((existing?.claimCount ?? 0) > 0) {
			error(400, 'Onboarding quest already claimed');
		}

		// Verify game-state completion server-side
		const allProgress = await getOnboardingProgress(save.saveId);
		const thisProgress = allProgress.find((p) => p.questId === questId);
		if (!thisProgress?.completed) {
			error(400, 'Onboarding milestone not yet reached');
		}

		await prisma.$transaction(async (tx) => {
			await tx.incrementalSaveQuest.upsert({
				where: { saveId_questId: { saveId: save.saveId, questId } },
				create: {
					saveId: save.saveId,
					questId,
					type: 'onboarding',
					startedAt: now,
					claimCount: 1,
					claimedAt: now
				},
				update: {
					claimCount: { increment: 1 },
					claimedAt: now
				}
			});
			await grantReward(save.saveId, def.reward, tx as unknown as BankTx);
		});
	} else {
		error(400, 'Unsupported quest type');
	}

	return json({ success: true, questId, saveId: save.saveId });
};

/** Grant currency + item rewards within a transaction. */
async function grantReward(
	saveId: string,
	reward: QuestReward | undefined,
	tx: BankTx
): Promise<void> {
	if (!reward) return;
	if (reward.currency) {
		await addBankCurrency(saveId, reward.currency.key, reward.currency.amount, tx);
	}
	if (reward.item) {
		await addBankItem(saveId, reward.item.itemId, reward.item.quantity, tx);
	}
}
