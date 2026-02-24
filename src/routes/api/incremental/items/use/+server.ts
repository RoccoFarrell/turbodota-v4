/**
 * POST /api/incremental/items/use – use a consumable item from inventory.
 *
 * Body: { saveId?, itemId, targetType, targetHeroId?, targetStatKey? }
 *
 * Extensible: new usageTypes are handled by adding branches to the switch below.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { resolveIncrementalSave } from '$lib/server/incremental-save';
import {
	getBankItemQuantity,
	removeBankItem,
	getBankBalances,
	getBankItems,
	type BankTx
} from '$lib/incremental/bank/bank.service.server';
import { getItemDef } from '$lib/incremental/constants/item-definitions';
import { pointsToEffectiveStat } from '$lib/incremental/stats/training-curve';
import { getActionDef } from '$lib/incremental/actions/action-definitions';
import { applyRewards } from '$lib/incremental/actions/action-rewards.server';
import { getRateModifier } from '$lib/incremental/actions/talent-rate-modifier';
import { TRAINING_STAT_KEYS, type TrainingStatKey } from '$lib/incremental/actions/constants';

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: {
		saveId?: string;
		itemId?: string;
		targetType?: string;
		targetHeroId?: number;
		targetStatKey?: string;
	};
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { saveId } = await resolveIncrementalSave(event, { saveId: body.saveId });

	const itemId = body.itemId;
	if (!itemId) error(400, 'itemId is required');

	const itemDef = getItemDef(itemId);
	if (!itemDef) error(400, `Unknown item: ${itemId}`);

	const targetType = body.targetType;
	if (!targetType) error(400, 'targetType is required');

	// Check user has at least 1 of this item
	const qty = await getBankItemQuantity(saveId, itemId);
	if (qty < 1) error(400, `You don't have any ${itemDef.name}`);

	// Validate target is allowed for this item
	if (!itemDef.applicableTargets.includes(targetType as 'mining' | 'training')) {
		error(400, `${itemDef.name} cannot be applied to ${targetType}`);
	}

	// Dispatch based on usageType
	switch (itemDef.usageType) {
		case 'idle_instant_1h': {
			return await handleIdleInstant1h(saveId, itemId, targetType, body, event);
		}
		default:
			error(400, `Item ${itemDef.name} is not usable`);
	}
};

/**
 * Handle 'idle_instant_1h' usage: grant 1 hour of idle completions for the given action type.
 */
async function handleIdleInstant1h(
	saveId: string,
	itemId: string,
	targetType: string,
	body: { targetHeroId?: number; targetStatKey?: string },
	_event: Parameters<RequestHandler>[0]
) {
	const ONE_HOUR_SEC = 3600;

	if (targetType === 'mining') {
		const actionDef = getActionDef('mining');
		const durationPerCompletion = actionDef?.durationPerCompletionSec ?? 3;
		const rateModifier = await getRateModifier(saveId, 'mining');
		const effectiveDuration = durationPerCompletion / Math.max(0.01, rateModifier);
		const completions = Math.floor(ONE_HOUR_SEC / effectiveDuration);

		const now = new Date();
		await prisma.$transaction(async (tx) => {
			await applyRewards('mining', {}, completions, { saveId, tx });
			await removeBankItem(saveId, itemId, 1, tx as unknown as BankTx);
			if (completions > 0) {
				await tx.incrementalActionHistory.create({
					data: {
						saveId,
						slotIndex: -1,
						actionType: 'mining',
						completions,
						source: 'item',
						itemId,
						startedAt: now,
						endedAt: now
					}
				});
			}
		});

		const [balances, inventory] = await Promise.all([
			getBankBalances(saveId),
			getBankItems(saveId)
		]);

		return json({
			success: true,
			itemId,
			targetType: 'mining',
			completions,
			essenceEarned: completions, // mining grants 1 essence per completion (before multipliers applied in applyRewards)
			essence: balances.essence ?? 0,
			currencies: balances,
			inventory
		});
	}

	if (targetType === 'training') {
		const heroId = body.targetHeroId;
		const statKey = body.targetStatKey;
		if (typeof heroId !== 'number') error(400, 'targetHeroId is required for training');
		if (!isValidStatKey(statKey)) error(400, 'targetStatKey must be a valid training stat');

		// Validate hero is on roster
		const rosterHero = await prisma.incrementalRosterHero.findUnique({
			where: { saveId_heroId: { saveId, heroId } }
		});
		if (!rosterHero) error(400, 'Hero is not on your roster');

		const actionDef = getActionDef('training');
		const durationPerCompletion = actionDef?.durationPerCompletionSec ?? 5;
		const rateModifier = await getRateModifier(saveId, 'training', statKey);
		const effectiveDuration = durationPerCompletion / Math.max(0.01, rateModifier);
		const completions = Math.floor(ONE_HOUR_SEC / effectiveDuration);

		const now = new Date();
		await prisma.$transaction(async (tx) => {
			await applyRewards(
				'training',
				{ heroId, statKey },
				completions,
				{ saveId, tx }
			);
			await removeBankItem(saveId, itemId, 1, tx as unknown as BankTx);
			if (completions > 0) {
				await tx.incrementalActionHistory.create({
					data: {
						saveId,
						slotIndex: -1,
						actionType: 'training',
						actionHeroId: heroId,
						actionStatKey: statKey,
						completions,
						source: 'item',
						itemId,
						startedAt: now,
						endedAt: now
					}
				});
			}
		});

		// Fetch updated training value for this hero+stat
		const training = await prisma.incrementalHeroTraining.findUnique({
			where: { saveId_heroId_statKey: { saveId, heroId, statKey } },
			select: { totalPoints: true }
		});

		const [balances, inventory] = await Promise.all([
			getBankBalances(saveId),
			getBankItems(saveId)
		]);

		const totalPoints = training?.totalPoints ?? 0;
		return json({
			success: true,
			itemId,
			targetType: 'training',
			completions,
			heroId,
			statKey,
			totalPoints,
			effectiveStat: pointsToEffectiveStat(totalPoints, statKey as TrainingStatKey),
			newTrainingValue: totalPoints, // backward compat
			essence: balances.essence ?? 0,
			currencies: balances,
			inventory
		});
	}

	error(400, `Unsupported target type: ${targetType}`);
}
