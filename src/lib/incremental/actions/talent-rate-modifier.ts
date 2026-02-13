/**
 * Compute rate modifiers from purchased talent nodes.
 * Used by the action API to speed up mining/training based on talent tree purchases.
 */

import prisma from '$lib/server/prisma';
import { TALENT_NODES, type TalentNodeDef } from '../constants/talent-nodes';

/**
 * Get rate modifier for an action based on purchased talent nodes.
 * Returns 1 + sum(applicable percent bonuses). E.g., with +10% and +5% → 1.15.
 *
 * - Mining: sums all `mining_speed` nodes.
 * - Training: sums `training_speed` nodes matching `statKey`, plus
 *   `training_speed` nodes with no statKey (apply to all training).
 */
export async function getRateModifier(
	saveId: string,
	actionType: string,
	statKey?: string | null
): Promise<number> {
	const purchased = await prisma.incrementalTalentNode.findMany({
		where: { saveId },
		select: { nodeId: true }
	});

	const purchasedIds = new Set(purchased.map((p) => p.nodeId));
	return computeRateModifier(purchasedIds, actionType, statKey);
}

/**
 * Pure computation of rate modifier from a set of purchased node IDs.
 * Exported for testing without DB.
 */
export function computeRateModifier(
	purchasedNodeIds: Set<string>,
	actionType: string,
	statKey?: string | null
): number {
	let totalPercent = 0;

	for (const node of TALENT_NODES) {
		if (!purchasedNodeIds.has(node.id)) continue;
		if (!node.percent) continue;

		if (actionType === 'mining' && node.type === 'mining_speed') {
			totalPercent += node.percent;
		} else if (actionType === 'training' && node.type === 'training_speed') {
			// Matches if node has no statKey (applies to all training) or statKey matches
			if (!node.statKey || node.statKey === statKey) {
				totalPercent += node.percent;
			}
		}
	}

	return 1 + totalPercent;
}

/**
 * Get reward multiplier from purchased talent nodes (for future "double XP" etc.).
 * Currently returns 1 (no reward multiplier talent nodes yet).
 */
export async function getTalentRewardMultiplier(
	_saveId: string,
	_actionType?: string
): Promise<number> {
	return 1;
}
