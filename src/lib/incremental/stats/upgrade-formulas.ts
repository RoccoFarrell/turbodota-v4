/**
 * Extensible upgrade formula system for Phase 13.6+.
 * Supports mining level, building upgrades, and future skills (woodcutting, crafting, etc.).
 * No level concept - upgrades directly modify action speed/rewards via multipliers.
 */

export interface UpgradeConfig {
	baseCost: number;
	costMultiplier?: number; // default 2
	rewardMultiplier?: (level: number) => number; // e.g., (l) => 1.15^l for mining
	speedBonus?: (level: number) => number; // e.g., (l) => 0.1 * l for buildings
}

/**
 * Upgrade type configurations. Add new skills here without schema changes.
 */
const UPGRADE_CONFIGS: Record<string, UpgradeConfig> = {
	mining: {
		baseCost: 50,
		costMultiplier: 2,
		rewardMultiplier: (level) => 1.15 ** level // essence per strike multiplier
	},
	building_hp: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level // 10% faster training per level
	},
	building_attack_damage: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	},
	building_spell_power: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	},
	building_attack_speed: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	},
	building_spell_haste: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	},
	building_armor: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	},
	building_magic_resist: {
		baseCost: 100,
		costMultiplier: 2,
		speedBonus: (level) => 0.1 * level
	}
	// Future: woodcutting, crafting, etc. can be added here
};

/**
 * Generic progressive cost formula: baseCost * multiplier^level
 */
export function upgradeCostFormula(
	baseCost: number,
	level: number,
	multiplier: number = 2
): number {
	if (level < 0) return baseCost;
	return baseCost * multiplier ** level;
}

/**
 * Get upgrade configuration for a given upgrade type.
 * Returns default config if not found.
 */
export function getUpgradeConfig(upgradeType: string): UpgradeConfig {
	const config = UPGRADE_CONFIGS[upgradeType];
	if (config) return config;
	// Default config for unknown upgrade types
	return {
		baseCost: 100,
		costMultiplier: 2
	};
}

/**
 * Get cost to upgrade from current level to next level.
 */
export function getUpgradeCost(upgradeType: string, currentLevel: number): number {
	const config = getUpgradeConfig(upgradeType);
	return upgradeCostFormula(config.baseCost, currentLevel, config.costMultiplier ?? 2);
}

/**
 * Get cost to upgrade from currentLevel to currentLevel+1.
 */
export function getUpgradeCostForNextLevel(
	upgradeType: string,
	currentLevel: number
): number {
	return getUpgradeCost(upgradeType, currentLevel);
}

/**
 * Get reward multiplier for an upgrade type at a given level.
 * Returns 1 if no reward multiplier is configured.
 */
export function getRewardMultiplier(upgradeType: string, level: number): number {
	const config = getUpgradeConfig(upgradeType);
	if (!config.rewardMultiplier) return 1;
	return config.rewardMultiplier(level);
}

/**
 * Get speed bonus for an upgrade type at a given level.
 * Returns 0 if no speed bonus is configured.
 */
export function getSpeedBonus(upgradeType: string, level: number): number {
	const config = getUpgradeConfig(upgradeType);
	if (!config.speedBonus) return 0;
	return config.speedBonus(level);
}

/**
 * Get all registered upgrade types.
 */
export function getAllUpgradeTypes(): string[] {
	return Object.keys(UPGRADE_CONFIGS);
}

/**
 * Check if an upgrade type is registered.
 */
export function isUpgradeTypeRegistered(upgradeType: string): boolean {
	return upgradeType in UPGRADE_CONFIGS;
}
