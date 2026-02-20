import { describe, it, expect } from 'vitest';
import {
	abilityDisplayName,
	humanizeTrigger,
	humanizeTarget,
	humanizeEffect,
	damageTypeColor,
	getAbilityIconPath
} from './spell-details-utils';
import type { AbilityDef } from '$lib/incremental/types';

function makeAbility(overrides: Partial<AbilityDef> & { id: string; type: 'active' | 'passive'; trigger: string }): AbilityDef {
	return { ...overrides };
}

describe('abilityDisplayName', () => {
	it('returns abilityName when present', () => {
		const a = makeAbility({ id: 'lina_1', type: 'active', trigger: 'timer', abilityName: 'Dragon Slave' });
		expect(abilityDisplayName(a)).toBe('Dragon Slave');
	});

	it('falls back to humanized effect when no abilityName', () => {
		const a = makeAbility({ id: 'lina_1', type: 'active', trigger: 'timer', effect: 'fire_blast' });
		expect(abilityDisplayName(a)).toBe('fire blast');
	});

	it('falls back to humanized id when no abilityName or effect', () => {
		const a = makeAbility({ id: 'some_hero_ability', type: 'passive', trigger: 'on_damage_taken' });
		expect(abilityDisplayName(a)).toBe('some hero ability');
	});
});

describe('humanizeTrigger', () => {
	it('maps known triggers to readable labels', () => {
		expect(humanizeTrigger('timer')).toBe('Timed cast');
		expect(humanizeTrigger('on_damage_taken')).toBe('When hit');
		expect(humanizeTrigger('on_attack')).toBe('On attack');
	});

	it('falls back to underscore replacement for unknown triggers', () => {
		expect(humanizeTrigger('on_kill')).toBe('on kill');
	});
});

describe('humanizeTarget', () => {
	it('returns null for undefined/empty target', () => {
		expect(humanizeTarget(undefined)).toBeNull();
		expect(humanizeTarget('')).toBeNull();
	});

	it('maps known targets', () => {
		expect(humanizeTarget('self')).toBe('Self');
		expect(humanizeTarget('single_enemy')).toBe('Single enemy');
		expect(humanizeTarget('attacker')).toBe('Attacker');
		expect(humanizeTarget('all_enemies')).toBe('All enemies');
	});

	it('falls back for unknown targets', () => {
		expect(humanizeTarget('random_ally')).toBe('random ally');
	});
});

describe('humanizeEffect', () => {
	it('returns null for undefined/empty effect', () => {
		expect(humanizeEffect(undefined)).toBeNull();
		expect(humanizeEffect('')).toBeNull();
	});

	it('maps known effects', () => {
		expect(humanizeEffect('stun')).toBe('Stuns target');
		expect(humanizeEffect('return_damage')).toBe('Reflects damage');
		expect(humanizeEffect('heal')).toBe('Heals');
		expect(humanizeEffect('poison')).toBe('Poisons target');
		expect(humanizeEffect('armor_reduce')).toBe('Reduces armor');
		expect(humanizeEffect('magic_resist_reduce')).toBe('Strips magic resist');
	});

	it('falls back for unknown effects', () => {
		expect(humanizeEffect('slow_attack')).toBe('slow attack');
	});
});

describe('damageTypeColor', () => {
	it('returns correct CSS class for each damage type', () => {
		expect(damageTypeColor('physical')).toBe('spell-dmg--physical');
		expect(damageTypeColor('magical')).toBe('spell-dmg--magical');
		expect(damageTypeColor('pure')).toBe('spell-dmg--pure');
	});

	it('returns empty string for unknown types', () => {
		expect(damageTypeColor('chaos')).toBe('');
	});
});

describe('getAbilityIconPath', () => {
	it('returns an SVG path string for a string ability id', () => {
		const path = getAbilityIconPath('antimage_1');
		expect(path).toMatch(/^\/game-icons\/.*\.svg$/);
	});

	it('produces consistent output for the same id', () => {
		expect(getAbilityIconPath('lina_1')).toBe(getAbilityIconPath('lina_1'));
	});

	it('returns effect-specific icon for known effects', () => {
		const a = makeAbility({ id: 'cm_1', type: 'active', trigger: 'timer', effect: 'stun' });
		const path = getAbilityIconPath(a);
		expect(path).toContain('knocked-out-stars');
	});

	it('returns a pool icon for abilities without known effects', () => {
		const a = makeAbility({ id: 'generic_spell', type: 'active', trigger: 'timer' });
		const path = getAbilityIconPath(a);
		expect(path).toMatch(/^\/game-icons\/.*\.svg$/);
	});
});
