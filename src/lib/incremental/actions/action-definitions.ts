/**
 * Action registry: each action has a speed (duration per completion) and a reward.
 * Reward application lives in action-rewards.server.ts (server-only).
 */

import type { Prisma } from '@prisma/client';

export type ActionId = string;

/** Params stored/used when this action is active (e.g. training = { heroId, statKey }). */
export type ActionParams = Record<string, unknown>;

export interface ActionDef {
	id: ActionId;
	/** Seconds per completion (bar 0→1). */
	durationPerCompletionSec: number;
	/** Optional rate modifier source (e.g. from talents); default 1. */
	rateModifier?: number;
	/** Emoji icon for UI display. */
	icon: string;
	/** Human-readable label for this action. */
	label: string;
	/** Category: scavenging (resource collection) or training (hero stat improvement). */
	category: 'scavenging' | 'training';
}

/** All registered actions. Add new actions here; rewards are applied in action-rewards.server.ts. */
const ACTIONS: ActionDef[] = [
	{ id: 'mining', durationPerCompletionSec: 3, icon: '⛏️', label: 'Mining', category: 'scavenging' },
	{ id: 'woodcutting', durationPerCompletionSec: 3, icon: '🪵', label: 'Woodcutting', category: 'scavenging' },
	{ id: 'training', durationPerCompletionSec: 5, icon: '🏋️', label: 'Training', category: 'training' }
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

/**
 * Shared slot label utility — replaces duplicated implementations in layout, training page, and store.
 * Adding a new action type requires zero changes to this function.
 */
export function formatSlotLabel(
	slot: { actionType: string; actionHeroId?: number | null; actionStatKey?: string | null },
	resolvers: { heroName: (id: number) => string; statLabel: (key: string) => string }
): string {
	const def = getActionDef(slot.actionType);
	if (!def) return slot.actionType;
	if (def.category === 'training' && slot.actionHeroId != null && slot.actionStatKey) {
		return `${resolvers.heroName(slot.actionHeroId)} \u2013 ${resolvers.statLabel(slot.actionStatKey)}`;
	}
	return def.label;
}

/** All scavenging action defs (resource collection). */
export const SCAVENGING_ACTION_DEFS: ActionDef[] = ACTIONS.filter((a) => a.category === 'scavenging');

/** Context for applying rewards (Prisma transaction client). Used by action-rewards.server.ts. */
export interface RewardContext {
	saveId: string;
	tx: Prisma.TransactionClient;
}

export const MINING_ACTION_ID = 'mining' as const;
export const WOODCUTTING_ACTION_ID = 'woodcutting' as const;
export const TRAINING_ACTION_ID = 'training' as const;
