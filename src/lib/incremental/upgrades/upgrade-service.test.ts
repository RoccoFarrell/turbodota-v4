/**
 * Upgrade service tests: getUpgradeLevel, getAllUpgrades, canAffordUpgrade, purchaseUpgrade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getUpgradeLevel,
	getAllUpgrades,
	canAffordUpgrade,
	purchaseUpgrade
} from './upgrade-service';
import * as upgradeFormulas from '../stats/upgrade-formulas';

// Mock prisma
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock('$lib/server/prisma', () => ({
	default: {
		incrementalUpgrade: {
			findUnique: mockFindUnique,
			findMany: mockFindMany
		}
	}
}));

// Mock upgrade formulas
vi.mock('../stats/upgrade-formulas', () => ({
	getUpgradeCostForNextLevel: vi.fn()
}));

describe('upgrade-service', () => {

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getUpgradeLevel', () => {
		it('returns level from database when upgrade exists', async () => {
			mockFindUnique.mockResolvedValue({ level: 5 });
			const level = await getUpgradeLevel('save1', 'mining');
			expect(level).toBe(5);
			expect(mockFindUnique).toHaveBeenCalledWith({
				where: {
					saveId_upgradeType: {
						saveId: 'save1',
						upgradeType: 'mining'
					}
				},
				select: { level: true }
			});
		});

		it('returns 0 when upgrade does not exist', async () => {
			mockFindUnique.mockResolvedValue(null);
			const level = await getUpgradeLevel('save1', 'mining');
			expect(level).toBe(0);
		});
	});

	describe('getAllUpgrades', () => {
		it('returns map of upgradeType -> level', async () => {
			mockFindMany.mockResolvedValue([
				{ upgradeType: 'mining', level: 3 },
				{ upgradeType: 'building_hp', level: 2 }
			]);
			const upgrades = await getAllUpgrades('save1');
			expect(upgrades.get('mining')).toBe(3);
			expect(upgrades.get('building_hp')).toBe(2);
			expect(upgrades.size).toBe(2);
		});

		it('returns empty map when no upgrades exist', async () => {
			mockFindMany.mockResolvedValue([]);
			const upgrades = await getAllUpgrades('save1');
			expect(upgrades.size).toBe(0);
		});
	});

	describe('canAffordUpgrade', () => {
		it('returns true when essence >= cost', async () => {
			mockFindUnique.mockResolvedValue({ level: 0 });
			vi.spyOn(upgradeFormulas, 'getUpgradeCostForNextLevel').mockReturnValue(50);
			const canAfford = await canAffordUpgrade('save1', 'mining', 100);
			expect(canAfford).toBe(true);
		});

		it('returns false when essence < cost', async () => {
			mockFindUnique.mockResolvedValue({ level: 0 });
			vi.spyOn(upgradeFormulas, 'getUpgradeCostForNextLevel').mockReturnValue(100);
			const canAfford = await canAffordUpgrade('save1', 'mining', 50);
			expect(canAfford).toBe(false);
		});
	});

	describe('purchaseUpgrade', () => {
		it('increments level and deducts cost', async () => {
			const mockTx = {
				incrementalSave: {
					findUnique: vi.fn().mockResolvedValue({ essence: 100 }),
					update: vi.fn().mockResolvedValue({})
				},
				incrementalUpgrade: {
					findUnique: vi.fn().mockResolvedValue({ level: 0 }),
					upsert: vi.fn().mockResolvedValue({ level: 1 })
				}
			};
			vi.spyOn(upgradeFormulas, 'getUpgradeCostForNextLevel').mockReturnValue(50);

			const result = await purchaseUpgrade('save1', 'mining', mockTx as any);

			expect(result.newLevel).toBe(1);
			expect(result.cost).toBe(50);
			expect(mockTx.incrementalSave.update).toHaveBeenCalledWith({
				where: { id: 'save1' },
				data: { essence: 50 }
			});
			expect(mockTx.incrementalUpgrade.upsert).toHaveBeenCalled();
		});

		it('throws error when save not found', async () => {
			const mockTx = {
				incrementalSave: {
					findUnique: vi.fn().mockResolvedValue(null),
					update: vi.fn()
				},
				incrementalUpgrade: {
					findUnique: vi.fn(),
					upsert: vi.fn()
				}
			};
			vi.spyOn(upgradeFormulas, 'getUpgradeCostForNextLevel').mockReturnValue(50);

			await expect(purchaseUpgrade('save1', 'mining', mockTx as any)).rejects.toThrow(
				'Save not found'
			);
		});

		it('throws error when insufficient essence', async () => {
			const mockTx = {
				incrementalSave: {
					findUnique: vi.fn().mockResolvedValue({ essence: 30 }),
					update: vi.fn()
				},
				incrementalUpgrade: {
					findUnique: vi.fn(),
					upsert: vi.fn()
				}
			};
			vi.spyOn(upgradeFormulas, 'getUpgradeCostForNextLevel').mockReturnValue(50);

			await expect(purchaseUpgrade('save1', 'mining', mockTx as any)).rejects.toThrow(
				'Insufficient Essence'
			);
		});
	});
});
