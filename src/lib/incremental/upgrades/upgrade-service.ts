/**
 * Upgrade service for Phase 13.6+.
 * Handles database operations for the extensible upgrade system.
 */

import prisma from '$lib/server/prisma';
import { getUpgradeCostForNextLevel } from '../stats/upgrade-formulas';

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
 * Purchase an upgrade (increment level and deduct cost).
 * Must be called within a transaction.
 */
export async function purchaseUpgrade(
	saveId: string,
	upgradeType: string,
	tx: {
		incrementalSave: {
			findUnique: (args: {
				where: { id: string };
				select: { essence: true };
			}) => Promise<{ essence: number | null } | null>;
			update: (args: {
				where: { id: string };
				data: { essence: number };
			}) => Promise<unknown>;
		};
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
	}
): Promise<{ newLevel: number; cost: number }> {
	const currentLevel = await getUpgradeLevel(saveId, upgradeType);
	const cost = getUpgradeCostForNextLevel(upgradeType, currentLevel);

	// Check if save has enough essence
	const save = await tx.incrementalSave.findUnique({
		where: { id: saveId },
		select: { essence: true }
	});
	if (!save) throw new Error('Save not found');
	if ((save.essence ?? 0) < cost) {
		throw new Error(`Insufficient Essence: need ${cost}, have ${save.essence ?? 0}`);
	}

	// Deduct cost
	await tx.incrementalSave.update({
		where: { id: saveId },
		data: { essence: (save.essence ?? 0) - cost }
	});

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
