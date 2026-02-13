/**
 * Action slot helpers: max slots from talent tree, slot validation.
 */

import prisma from '$lib/server/prisma';
import { TALENT_NODES } from '../constants/talent-nodes';

/** Base number of action slots every save starts with. */
export const BASE_SLOT_COUNT = 1;

/**
 * Get the maximum number of action slots for a save.
 * 1 base slot + 1 per purchased `unlock_slot` talent node.
 */
export async function getMaxSlots(saveId: string): Promise<number> {
	const purchased = await prisma.incrementalTalentNode.findMany({
		where: { saveId },
		select: { nodeId: true }
	});

	const purchasedIds = new Set(purchased.map((p) => p.nodeId));
	return computeMaxSlots(purchasedIds);
}

/**
 * Pure computation of max slots from purchased node IDs. Exported for testing.
 */
export function computeMaxSlots(purchasedNodeIds: Set<string>): number {
	let unlocked = 0;
	for (const node of TALENT_NODES) {
		if (node.type === 'unlock_slot' && purchasedNodeIds.has(node.id)) {
			unlocked += 1;
		}
	}
	return BASE_SLOT_COUNT + unlocked;
}
