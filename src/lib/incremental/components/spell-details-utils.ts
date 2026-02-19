import type { AbilityDef } from '$lib/incremental/types';

/** Display name for an ability, with fallbacks. */
export function abilityDisplayName(ability: AbilityDef): string {
	return (
		ability.abilityName ??
		ability.effect?.replace(/_/g, ' ') ??
		ability.id.replace(/_/g, ' ')
	);
}

/** Human-readable trigger label. */
export function humanizeTrigger(trigger: string): string {
	switch (trigger) {
		case 'timer':
			return 'Timed cast';
		case 'on_damage_taken':
			return 'When hit';
		case 'on_attack':
			return 'On attack';
		default:
			return trigger.replace(/_/g, ' ');
	}
}

/** Human-readable target label, or null if no target. */
export function humanizeTarget(target: string | undefined): string | null {
	if (!target) return null;
	switch (target) {
		case 'self':
			return 'Self';
		case 'single_enemy':
			return 'Single enemy';
		case 'attacker':
			return 'Attacker';
		case 'all_enemies':
			return 'All enemies';
		default:
			return target.replace(/_/g, ' ');
	}
}

/** Human-readable effect label, or null if no effect. */
export function humanizeEffect(effect: string | undefined): string | null {
	if (!effect) return null;
	switch (effect) {
		case 'stun':
			return 'Stuns target';
		case 'return_damage':
			return 'Reflects damage';
		case 'heal':
			return 'Heals';
		case 'poison':
			return 'Poisons target';
		case 'armor_reduce':
			return 'Reduces armor';
		case 'magic_resist_reduce':
			return 'Strips magic resist';
		default:
			return effect.replace(/_/g, ' ');
	}
}

/** CSS class for damage type coloring. */
export function damageTypeColor(dt: string): string {
	switch (dt) {
		case 'physical':
			return 'spell-dmg--physical';
		case 'magical':
			return 'spell-dmg--magical';
		case 'pure':
			return 'spell-dmg--pure';
		default:
			return '';
	}
}

/** Spell icon atlas: 9×6 grid, 45 valid positions. */
export const SPELL_ICONS: [number, number][] = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2],
	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
	[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5]
];

/** CSS style string for positioning a spell icon in the sprite sheet. */
export function spellIconStyle(abilityId: string): string {
	let h = 0;
	for (let i = 0; i < abilityId.length; i++) h = (h * 31 + abilityId.charCodeAt(i)) >>> 0;
	const [x, y] = SPELL_ICONS[h % SPELL_ICONS.length];
	return `--spell-x: ${x}; --spell-y: ${y};`;
}
