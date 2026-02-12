/**
 * Action registry: each action has a speed (duration per completion) and a reward.
 * The idle timer is generic; this module defines action types and applies rewards.
 */

import type { TrainingStatKey } from './constants';
import { TRAINING_STAT_KEYS } from './constants';
import { getRewardMultiplier } from '../stats/upgrade-formulas';
import { getUpgradeLevel } from '../upgrades/upgrade-service';

export type ActionId = string;

/** Params stored/used when this action is active (e.g. training = { heroId, statKey }). */
export type ActionParams = Record<string, unknown>;

export interface ActionDef {
	id: ActionId;
	/** Seconds per completion (bar 0→1). */
	durationPerCompletionSec: number;
	/** Optional rate modifier source (e.g. from talents); default 1. */
	rateModifier?: number;
}

/** All registered actions. Add new actions here; rewards are applied in applyRewards. */
const ACTIONS: ActionDef[] = [
	{ id: 'mining', durationPerCompletionSec: 3 },
	{ id: 'training', durationPerCompletionSec: 5 }
];

const byId = new Map(ACTIONS.map((a) => [a.id, a]));

export function getActionDef(actionId: ActionId): ActionDef | undefined {
	return byId.get(actionId);
}

export function getDurationSec(actionId: ActionId, _params?: ActionParams): number {
	const def = byId.get(actionId);
	if (!def) return 5; // fallback
	return def.durationPerCompletionSec / Math.max(0.01, def.rateModifier ?? 1);
}

/** Context for applying rewards (Prisma transaction client). */
export interface RewardContext {
	saveId: string;
	tx: {
		incrementalSave: {
			findUnique: (args: { where: { id: string }; select: { essence: true } }) => Promise<{ essence: number | null } | null>;
			update: (args: { where: { id: string }; data: { essence: number } }) => Promise<unknown>;
		};
		incrementalHeroTraining: {
			upsert: (args: {
				where: { saveId_heroId_statKey: { saveId: string; heroId: number; statKey: string } };
				create: { saveId: string; heroId: number; statKey: string; value: number };
				update: { value: { increment: number } };
			}) => Promise<unknown>;
		};
	};
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
		// Load mining level to calculate essence multiplier
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
		const value = completions * 1; // value per completion
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

function isValidStatKey(key: unknown): key is TrainingStatKey {
	return typeof key === 'string' && (TRAINING_STAT_KEYS as readonly string[]).includes(key);
}

export const MINING_ACTION_ID = 'mining' as const;
export const TRAINING_ACTION_ID = 'training' as const;
