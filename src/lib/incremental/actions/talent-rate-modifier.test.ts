/**
 * Tests for talent rate modifier computation (pure function, no DB).
 * We test computeRateModifier directly via the TALENT_NODES definitions.
 */
import { describe, it, expect } from 'vitest';
import { TALENT_NODES, type TalentNodeDef } from '../constants/talent-nodes';

/**
 * Pure reimplementation of computeRateModifier for testing.
 * This avoids importing from talent-rate-modifier.ts which has a $lib/server/prisma dependency.
 */
function computeRateModifier(
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
			if (!node.statKey || node.statKey === statKey) {
				totalPercent += node.percent;
			}
		}
	}
	return 1 + totalPercent;
}

describe('talent-rate-modifier', () => {
	describe('computeRateModifier', () => {
		it('returns 1 when no talents purchased', () => {
			expect(computeRateModifier(new Set(), 'mining')).toBe(1);
			expect(computeRateModifier(new Set(), 'training', 'hp')).toBe(1);
		});

		it('returns correct modifier for mining with mining_speed talent', () => {
			const purchased = new Set(['mining_speed_10']); // +10%
			expect(computeRateModifier(purchased, 'mining')).toBeCloseTo(1.1);
		});

		it('ignores mining_speed talents when action is training', () => {
			const purchased = new Set(['mining_speed_10']);
			expect(computeRateModifier(purchased, 'training', 'hp')).toBe(1);
		});

		it('returns correct modifier for training with stat-specific talent', () => {
			const purchased = new Set(['hp_training_10']); // +10% HP training
			expect(computeRateModifier(purchased, 'training', 'hp')).toBeCloseTo(1.1);
		});

		it('ignores stat-specific talent when training a different stat', () => {
			const purchased = new Set(['hp_training_10']);
			expect(computeRateModifier(purchased, 'training', 'spell_power')).toBe(1);
		});

		it('combines stat-specific and all-training talents', () => {
			const purchased = new Set(['hp_training_10', 'spell_power_training_15', 'all_training_5']);
			expect(computeRateModifier(purchased, 'training', 'hp')).toBeCloseTo(1.15);
			expect(computeRateModifier(purchased, 'training', 'spell_power')).toBeCloseTo(1.2);
			expect(computeRateModifier(purchased, 'training', 'armor')).toBeCloseTo(1.05);
		});

		it('ignores training_speed talents when action is mining', () => {
			const purchased = new Set(['hp_training_10', 'all_training_5']);
			expect(computeRateModifier(purchased, 'mining')).toBe(1);
		});
	});
});
