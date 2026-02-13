/**
 * Server-only reward application. Uses DB (getUpgradeLevel) so must not run in browser.
 */

import { getUpgradeLevel } from '../upgrades/upgrade-service';
import { getRewardMultiplier } from '../stats/upgrade-formulas';
import type { ActionId, ActionParams, RewardContext } from './action-definitions';
import { TRAINING_STAT_KEYS, type TrainingStatKey } from './constants';

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

/**
 * Apply rewards for the given action and completions. No timer logic – pure reward side effects.
 */
export async function applyRewards(
	actionId: ActionId,
	params: ActionParams,
	completions: number,
	ctx: RewardContext
): Promise<void> {
	if (completions <= 0) return;

	if (actionId === 'mining') {
		const miningLevel = await getUpgradeLevel(ctx.saveId, 'mining');
		const baseEssencePerStrike = 1;
		const multiplier = getRewardMultiplier('mining', miningLevel);
		const amount = completions * baseEssencePerStrike * multiplier;

		const save = await ctx.tx.incrementalSave.findUnique({
			where: { id: ctx.saveId },
			select: { essence: true }
		});
		if (!save) throw new Error('Save not found');
		await ctx.tx.incrementalSave.update({
			where: { id: ctx.saveId },
			data: { essence: (save.essence ?? 0) + amount }
		});
		return;
	}

	if (actionId === 'training') {
		const heroId = params.heroId as number | undefined;
		const statKey = params.statKey as string | undefined;
		if (typeof heroId !== 'number' || !isValidStatKey(statKey)) return;
		const value = completions * 1;
		await ctx.tx.incrementalHeroTraining.upsert({
			where: {
				saveId_heroId_statKey: { saveId: ctx.saveId, heroId, statKey }
			},
			create: { saveId: ctx.saveId, heroId, statKey, value },
			update: { value: { increment: value } }
		});
		return;
	}
}
