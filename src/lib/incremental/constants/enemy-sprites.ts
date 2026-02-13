/**
 * Enemy sprite sheet configurations
 * Maps enemy IDs to their sprite sheet metadata and image paths, or static image.
 */

// Static images: transparent PNGs from lib/assets/enemies (matched by enemy id)
import armored_brute_transparent from '$lib/assets/enemies/armored_brute_transparent.png';
import arcane_wisp_transparent from '$lib/assets/enemies/arcane_wisp_transparent.png';
import frenzy_rat_transparent from '$lib/assets/enemies/frenzy_rat_transparent.png';
import skull_lord_transparent from '$lib/assets/enemies/skull_lord_transparent.png';

export interface EnemySpriteConfig {
	/** Path to sprite sheet image (optional when using static image) */
	spriteSheetSrc?: string;
	/** Path to sprite sheet metadata JSON (optional when using static image) */
	spriteSheetMetadataPath?: string;
	/** Static image path (used when no sprite sheet; e.g. lib/assets/enemies/*_transparent.png) */
	staticImageSrc?: string;
}

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
	// Static transparent PNGs from lib/assets/enemies (matched by file name)
	['armored_brute', { staticImageSrc: armored_brute_transparent }],
	['arcane_wisp', { staticImageSrc: arcane_wisp_transparent }],
	['frenzy_rat', { staticImageSrc: frenzy_rat_transparent }],
	['skull_lord', { staticImageSrc: skull_lord_transparent }],
	// No art yet — fallback to letter
	['lesser_skull', {}]
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
