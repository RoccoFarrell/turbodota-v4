/**
 * Server-only reward application. Uses DB (getUpgradeLevel) so must not run in browser.
 * Mining rewards go through the Bank (IncrementalBankCurrency); training writes to IncrementalHeroTraining.
 *
 * Adding a new resource = one new entry in REWARD_HANDLERS. Forgotten entries now warn instead of silently no-op.
 */

import { getUpgradeLevel } from '../upgrades/upgrade-service';
import { getRewardMultiplier } from '../stats/upgrade-formulas';
import type { ActionId, ActionParams, RewardContext } from './action-definitions';
import { TRAINING_STAT_KEYS, MINING_ESSENCE_PER_STRIKE, WOODCUTTING_WOOD_PER_STRIKE, type TrainingStatKey } from './constants';
import { addBankCurrency, type BankTx } from '../bank/bank.service.server';

export interface RewardOptions {
	/** Multiplier from scavenging party bonus (default 1). */
	rewardMultiplier?: number;
}

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

/**
 * Round a fractional reward to an integer using probabilistic rounding.
 * e.g. 1.5 → 1 (50% of the time) or 2 (50% of the time).
 * Expected value equals the input exactly, so bonuses like +50% work correctly
 * even when the base reward is 1 and the result would otherwise always floor to 1.
 */
function stochasticRound(value: number): number {
	const floor = Math.floor(value);
	return floor + (Math.random() < value - floor ? 1 : 0);
}

type RewardHandler = (
	completions: number,
	params: ActionParams,
	options: RewardOptions,
	ctx: RewardContext
) => Promise<Record<string, number>>;

const REWARD_HANDLERS: Record<string, RewardHandler> = {
	mining: async (completions, _params, options, ctx) => {
		const miningLevel = await getUpgradeLevel(ctx.saveId, 'mining');
		const multiplier = getRewardMultiplier('mining', miningLevel) * (options.rewardMultiplier ?? 1);
		const amount = stochasticRound(completions * MINING_ESSENCE_PER_STRIKE * multiplier);
		await addBankCurrency(ctx.saveId, 'essence', amount, ctx.tx as unknown as BankTx);
		return { essence: amount };
	},

	woodcutting: async (completions, _params, options, ctx) => {
		const amount = stochasticRound(completions * WOODCUTTING_WOOD_PER_STRIKE * (options.rewardMultiplier ?? 1));
		await addBankCurrency(ctx.saveId, 'wood', amount, ctx.tx as unknown as BankTx);
		return { wood: amount };
	},

	training: async (completions, params, _options, ctx) => {
		const heroId = params.heroId as number | undefined;
		const statKey = params.statKey as string | undefined;
		if (typeof heroId !== 'number' || !isValidStatKey(statKey)) return {};
		const pointsEarned = completions * 1; // 1 raw point per completion
		await ctx.tx.incrementalHeroTraining.upsert({
			where: { saveId_heroId_statKey: { saveId: ctx.saveId, heroId, statKey } },
			create: { saveId: ctx.saveId, heroId, statKey, totalPoints: pointsEarned },
			update: { totalPoints: { increment: pointsEarned } }
		});
		return {};
	}
};

/**
 * Apply rewards for the given action and completions. No timer logic – pure reward side effects.
 * Returns a dict of currencies earned (e.g. { essence: 5 } or { wood: 3 } or {} for training).
 */
export async function applyRewards(
	actionId: ActionId,
	params: ActionParams,
	completions: number,
	ctx: RewardContext,
	options: RewardOptions = {}
): Promise<Record<string, number>> {
	if (completions <= 0) return {};

	const handler = REWARD_HANDLERS[actionId];
	if (!handler) {
		console.warn(`No reward handler for action: ${actionId}`);
		return {};
	}
	return handler(completions, params, options, ctx);
}
