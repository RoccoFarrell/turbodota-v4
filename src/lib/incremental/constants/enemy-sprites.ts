/**
 * Enemy sprite sheet configurations
 * Maps enemy IDs to their sprite sheet metadata and image paths
 */

import type { EnemyDef } from '../types';

export interface EnemySpriteConfig {
	/** Path to sprite sheet image */
	spriteSheetSrc: string;
	/** Path to sprite sheet metadata JSON */
	spriteSheetMetadataPath: string;
	/** Optional: static image fallback */
	staticImageSrc?: string;
}

// Placeholder: new enemy ids below use wolf spritesheet until specific art is added
const WOLF_SPRITESHEET = {
	spriteSheetSrc: '/spritesheets/wolf_spritesheet.png',
	spriteSheetMetadataPath: '/spritesheets/wolf_spritesheet.json'
} as const;

const enemySpriteConfigs: Map<string, EnemySpriteConfig> = new Map([
	['large_wolf', {
		spriteSheetSrc: '/spritesheets/wolf_spritesheet.png',
		spriteSheetMetadataPath: '/spritesheets/wolf_spritesheet.json'
	}],
	['small_wolf', {
		spriteSheetSrc: '/spritesheets/wolf_spritesheet.png',
		spriteSheetMetadataPath: '/spritesheets/wolf_spritesheet.json'
	}],
	// Placeholders — replace with specific art later
	['armored_brute', { ...WOLF_SPRITESHEET }],
	['arcane_wisp', { ...WOLF_SPRITESHEET }],
	['frenzy_rat', { ...WOLF_SPRITESHEET }],
	['lesser_skull', { ...WOLF_SPRITESHEET }],
	['skull_lord', { ...WOLF_SPRITESHEET }]
]);

/**
 * Get sprite sheet configuration for an enemy
 */
export function getEnemySpriteConfig(enemyId: string): EnemySpriteConfig | undefined {
	return enemySpriteConfigs.get(enemyId);
}

/**
 * Check if an enemy has a sprite sheet configured
 */
export function hasEnemySpriteSheet(enemyId: string): boolean {
	return enemySpriteConfigs.has(enemyId);
}
