/**
 * Action registry: each action has a speed (duration per completion) and a reward.
 * Reward application lives in action-rewards.server.ts (server-only).
 */

import type { TrainingStatKey } from './constants';
import { TRAINING_STAT_KEYS } from './constants';

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

/** All registered actions. Add new actions here; rewards are applied in action-rewards.server.ts. */
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

/** Context for applying rewards (Prisma transaction client). Used by action-rewards.server.ts. */
export interface RewardContext {
	saveId: string;
	tx: {
		incrementalBankCurrency: {
			findUnique: (args: { where: { saveId_currencyKey: { saveId: string; currencyKey: string } }; select?: { amount: true } }) => Promise<{ amount: number } | null>;
			findMany: (args: { where: { saveId: string }; select?: { currencyKey: true; amount: true } }) => Promise<{ currencyKey: string; amount: number }[]>;
			upsert: (args: {
				where: { saveId_currencyKey: { saveId: string; currencyKey: string } };
				create: { saveId: string; currencyKey: string; amount: number };
				update: { amount: { increment: number } };
			}) => Promise<unknown>;
			update: (args: { where: { saveId_currencyKey: { saveId: string; currencyKey: string } }; data: { amount: number } }) => Promise<unknown>;
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

export const MINING_ACTION_ID = 'mining' as const;
export const TRAINING_ACTION_ID = 'training' as const;
