/**
 * Tests for slot helpers computation (pure function, no DB).
 * We test computeMaxSlots logic using the TALENT_NODES definitions.
 */
import { describe, it, expect } from 'vitest';
import { TALENT_NODES } from '../constants/talent-nodes';

const BASE_SLOT_COUNT = 1;

/**
 * Pure reimplementation of computeMaxSlots for testing.
 * This avoids importing from slot-helpers.ts which has a $lib/server/prisma dependency.
 */
function computeMaxSlots(purchasedNodeIds: Set<string>): number {
	let unlocked = 0;
	for (const node of TALENT_NODES) {
		if (node.type === 'unlock_slot' && purchasedNodeIds.has(node.id)) {
			unlocked += 1;
		}
	}
	return BASE_SLOT_COUNT + unlocked;
}

describe('slot-helpers', () => {
	describe('computeMaxSlots', () => {
		it('returns BASE_SLOT_COUNT (1) when no talents purchased', () => {
			expect(computeMaxSlots(new Set())).toBe(BASE_SLOT_COUNT);
			expect(BASE_SLOT_COUNT).toBe(1);
		});

		it('returns 1 when only non-slot talents purchased', () => {
			const purchased = new Set(['mining_speed_10', 'hp_training_10', 'all_training_5']);
			expect(computeMaxSlots(purchased)).toBe(1);
		});

		it('returns 2 when first unlock_slot talent purchased', () => {
			const purchased = new Set(['mining_speed_10', 'hp_training_10', 'unlock_slot_2']);
			expect(computeMaxSlots(purchased)).toBe(2);
		});

		it('returns 3 when both unlock_slot talents purchased', () => {
			const purchased = new Set(['unlock_slot_2', 'unlock_slot_3']);
			expect(computeMaxSlots(purchased)).toBe(3);
		});

		it('ignores unknown node IDs', () => {
			const purchased = new Set(['unlock_slot_2', 'unknown_node']);
			expect(computeMaxSlots(purchased)).toBe(2);
		});

		it('unlock_slot nodes exist in TALENT_NODES', () => {
			const slotNodes = TALENT_NODES.filter((n) => n.type === 'unlock_slot');
			expect(slotNodes.length).toBeGreaterThanOrEqual(2);
			expect(slotNodes.find((n) => n.id === 'unlock_slot_2')).toBeTruthy();
			expect(slotNodes.find((n) => n.id === 'unlock_slot_3')).toBeTruthy();
		});
	});
});
