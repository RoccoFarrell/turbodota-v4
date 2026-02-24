/**
 * Game icon path helpers.
 * All icons come from game-icons.net, served from /game-icons/ in static/.
 * White (#ffffff) on transparent background, 1:1 aspect ratio SVGs.
 */

const BASE = '/game-icons/ffffff/transparent/1x1';

/** Build a full static path for a game-icons.net SVG. */
export function gi(author: string, name: string): string {
	return `${BASE}/${author}/${name}.svg`;
}

// ── Training building icons ──────────────────────────────────────────────────
export const TRAINING_ICONS = {
	hp: gi('delapouite', 'medieval-barracks'),
	attack_damage: gi('lorc', 'sword-smithing'),
	spell_power: gi('lorc', 'magic-swirl'),
	attack_speed: gi('lorc', 'lightning-frequency'),
	spell_haste: gi('lorc', 'hourglass'),
	armor: gi('delapouite', 'blacksmith'),
	magic_resist: gi('lorc', 'magic-shield')
} as const;

// ── Status effect icons ──────────────────────────────────────────────────────
export const STATUS_ICONS = {
	stun: gi('delapouite', 'knocked-out-stars'),
	poison: gi('sbed', 'poison'),
	heal: gi('zeromancer', 'heart-plus'),
	generic: gi('lorc', 'power-lightning')
} as const;

// ── Spell stat pill icons (used in SpellDetails) ────────────────────────────
export const STAT_PILL_ICONS = {
	trigger: gi('lorc', 'stopwatch'),
	target: gi('delapouite', 'crosshair'),
	damage: gi('sbed', 'fire'),
	reflect: gi('lorc', 'shield-reflect'),
	effect: gi('delapouite', 'bolt-spell-cast'),
	statusEffect: gi('delapouite', 'angry-eyes')
} as const;

// ── Item / misc icons ────────────────────────────────────────────────────────
export const MISC_ICONS = {
	sparkle: gi('delapouite', 'sparkles'),
	crossedSwords: gi('lorc', 'crossed-swords'),
	magicResist: gi('lorc', 'magic-shield'),
	shield: gi('lorc', 'edged-shield'),
	timer: gi('lorc', 'stopwatch'),
	affinity: gi('lorc', 'power-lightning')
} as const;

// ── Ability icon mapping (replaces the old sprite-sheet approach) ────────────
// Maps ability effect/properties to a representative icon.

/** Pool of generic spell icons — hashed by ability id for variety. */
const SPELL_ICON_POOL = [
	gi('lorc', 'fireball'),
	gi('lorc', 'magic-swirl'),
	gi('lorc', 'lightning-helix'),
	gi('lorc', 'lightning-storm'),
	gi('lorc', 'fire-ray'),
	gi('lorc', 'focused-lightning'),
	gi('lorc', 'ice-bolt'),
	gi('lorc', 'burning-meteor'),
	gi('lorc', 'crystal-wand'),
	gi('lorc', 'death-zone'),
	gi('lorc', 'dripping-blade'),
	gi('lorc', 'energy-breath'),
	gi('lorc', 'fire-ring'),
	gi('lorc', 'frostfire'),
	gi('lorc', 'gooey-sword'),
	gi('lorc', 'grenade'),
	gi('lorc', 'lightning-arc'),
	gi('lorc', 'magic-palm'),
	gi('lorc', 'plasma-bolt'),
	gi('lorc', 'spinning-sword'),
	gi('delapouite', 'sword-brandish'),
	gi('lorc', 'thrown-spear'),
	gi('lorc', 'triple-corn'),
	gi('lorc', 'wolf-howl'),
	gi('lorc', 'bleeding-wound'),
] as const;

/** Effect-specific icon overrides. */
const EFFECT_ICONS: Record<string, string> = {
	stun: gi('delapouite', 'knocked-out-stars'),
	return_damage: gi('lorc', 'shield-reflect'),
	heal: gi('zeromancer', 'heart-plus'),
	poison: gi('sbed', 'poison'),
	armor_reduce: gi('delapouite', 'armor-downgrade'),
	magic_resist_reduce: gi('lorc', 'magic-shield'),
	attack_speed_slow: gi('lorc', 'snail'),
	attack_damage_reduce: gi('lorc', 'breaking-chain'),
	evasion: gi('delapouite', 'dodging'),
	shield: gi('lorc', 'edged-shield'),
	damage_block: gi('lorc', 'edged-shield'),
	magic_dot: gi('lorc', 'fire-ring'),
	physical_dot: gi('lorc', 'bleeding-wound'),
	bonus_damage: gi('lorc', 'bloody-sword'),
	lifesteal: gi('lorc', 'health-decrease'),
	attack_speed_bonus: gi('lorc', 'lightning-frequency'),
};

/** Simple hash of a string to a number. */
function hashStr(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return h;
}

/**
 * Get an appropriate game-icon path for an ability.
 * If the ability has a known effect, returns a specific icon.
 * Otherwise, hashes the ability ID to pick from a pool of generic spell icons.
 */
export function abilityIconPath(abilityId: string, effect?: string): string {
	if (effect && EFFECT_ICONS[effect]) return EFFECT_ICONS[effect];
	return SPELL_ICON_POOL[hashStr(abilityId) % SPELL_ICON_POOL.length];
}
