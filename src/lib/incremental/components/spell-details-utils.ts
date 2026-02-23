import type { AbilityDef } from '$lib/incremental/types';
import { abilityIconPath } from './game-icons';

/** Display name for an ability, with fallbacks. */
export function abilityDisplayName(ability: AbilityDef): string {
	return (
		ability.abilityName ??
		ability.effect?.replace(/_/g, ' ') ??
		ability.id.replace(/_/g, ' ')
	);
}

/** Get the SVG icon path for an ability (replaces old sprite-sheet approach). */
export function getAbilityIconPath(abilityIdOrDef: string | AbilityDef): string {
	if (typeof abilityIdOrDef === 'string') {
		return abilityIconPath(abilityIdOrDef);
	}
	return abilityIconPath(abilityIdOrDef.id, abilityIdOrDef.effect);
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
		case 'attack_speed_slow':
			return 'Slows attack speed';
		case 'attack_damage_reduce':
			return 'Reduces attack damage';
		case 'evasion':
			return 'Grants evasion';
		case 'shield':
		case 'damage_block':
			return 'Grants HP shield';
		case 'magic_dot':
			return 'Magic damage over time';
		case 'physical_dot':
			return 'Physical damage over time';
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