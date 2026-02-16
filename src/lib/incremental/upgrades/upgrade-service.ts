/**
 * Upgrade service for Phase 13.6+.
 * Handles database operations for the extensible upgrade system.
 */

import prisma from '$lib/server/prisma';
import { getUpgradeCostForNextLevel } from '../stats/upgrade-formulas';
import { getBankBalance, deductBankCurrency, type BankTx } from '../bank/bank.service.server';

/**
 * Get upgrade level for a save and upgrade type.
 * Returns 0 if upgrade doesn't exist (default level).
 */
export async function getUpgradeLevel(
	saveId: string,
	upgradeType: string
): Promise<number> {
	const upgrade = await prisma.incrementalUpgrade.findUnique({
		where: {
			saveId_upgradeType: {
				saveId,
				upgradeType
			}
		},
		select: { level: true }
	});
	return upgrade?.level ?? 0;
}

/**
 * Get all upgrades for a save.
 * Returns a Map of upgradeType -> level.
 */
export async function getAllUpgrades(saveId: string): Promise<Map<string, number>> {
	const upgrades = await prisma.incrementalUpgrade.findMany({
		where: { saveId },
		select: { upgradeType: true, level: true }
	});
	const map = new Map<string, number>();
	for (const upgrade of upgrades) {
		map.set(upgrade.upgradeType, upgrade.level);
	}
	return map;
}

/**
 * Check if save can afford an upgrade.
 */
export async function canAffordUpgrade(
	saveId: string,
	upgradeType: string,
	currentEssence: number
): Promise<boolean> {
	const currentLevel = await getUpgradeLevel(saveId, upgradeType);
	const cost = getUpgradeCostForNextLevel(upgradeType, currentLevel);
	return currentEssence >= cost;
}

/**
 * Purchase an upgrade (increment level and deduct cost from Bank).
 * Must be called within a transaction.
 */
export async function purchaseUpgrade(
	saveId: string,
	upgradeType: string,
	tx: {
		incrementalUpgrade: {
			findUnique: (args: {
				where: { saveId_upgradeType: { saveId: string; upgradeType: string } };
			}) => Promise<{ level: number } | null>;
			upsert: (args: {
				where: { saveId_upgradeType: { saveId: string; upgradeType: string } };
				create: { saveId: string; upgradeType: string; level: number };
				update: { level: { increment: number } };
			}) => Promise<{ level: number }>;
		};
	} & Record<string, unknown>
): Promise<{ newLevel: number; cost: number }> {
	const currentLevel = await getUpgradeLevel(saveId, upgradeType);
	const cost = getUpgradeCostForNextLevel(upgradeType, currentLevel);

	// Deduct cost from Bank (throws if insufficient)
	await deductBankCurrency(saveId, 'essence', cost, tx as unknown as BankTx);

	// Increment upgrade level
	const result = await tx.incrementalUpgrade.upsert({
		where: {
			saveId_upgradeType: {
				saveId,
				upgradeType
			}
		},
		create: {
			saveId,
			upgradeType,
			level: currentLevel + 1
		},
		update: {
			level: { increment: 1 }
		}
	});

	return {
		newLevel: result.level,
		cost
	};
}
