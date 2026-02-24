import { describe, it, expect } from 'vitest';
import {
	getArcaneRuneQty,
	formatMiningRuneToast,
	formatTrainingRuneToast,
	runeTargetClasses,
	shouldAutoApply
} from './rune-apply-helpers';

describe('getArcaneRuneQty', () => {
	it('returns 0 for empty inventory', () => {
		expect(getArcaneRuneQty([])).toBe(0);
	});

	it('returns correct qty when arcane_rune is present', () => {
		const inv = [{ itemDefId: 'arcane_rune', quantity: 5 }];
		expect(getArcaneRuneQty(inv)).toBe(5);
	});

	it('returns 0 when inventory has items but no arcane_rune', () => {
		const inv = [{ itemDefId: 'other_item', quantity: 3 }];
		expect(getArcaneRuneQty(inv)).toBe(0);
	});

	it('finds arcane_rune among multiple items', () => {
		const inv = [
			{ itemDefId: 'wood_plank', quantity: 10 },
			{ itemDefId: 'arcane_rune', quantity: 2 },
			{ itemDefId: 'iron_ore', quantity: 7 }
		];
		expect(getArcaneRuneQty(inv)).toBe(2);
	});
});

describe('formatMiningRuneToast', () => {
	it('returns correct title and full breakdown description', () => {
		const result = formatMiningRuneToast(1200);
		expect(result.title).toBe('Arcane Rune applied!');
		expect(result.description).toContain('1 hr instant progress');
		expect(result.description).toContain('1,200 completions');
		expect(result.description).toContain('+1,200 Essence');
	});

	it('handles zero completions', () => {
		const result = formatMiningRuneToast(0);
		expect(result.description).toContain('0 completions');
		expect(result.description).toContain('+0 Essence');
	});
});

describe('formatTrainingRuneToast', () => {
	it('includes time, completions, XP, and hero name (no effective label)', () => {
		const result = formatTrainingRuneToast(720, 'Spell Power', 'Crystal Maiden', 1440);
		expect(result.title).toBe('Arcane Rune applied!');
		expect(result.description).toContain('1 hr instant progress');
		expect(result.description).toContain('720 completions');
		expect(result.description).toContain('Spell Power');
		expect(result.description).toContain('Crystal Maiden');
		expect(result.description).toContain('1,440 XP');
	});

	it('includes effective stat label when provided', () => {
		const result = formatTrainingRuneToast(720, 'Spell Power', 'Crystal Maiden', 1440, '+8.3 SP');
		expect(result.description).toContain('Crystal Maiden');
		expect(result.description).toContain('+8.3 SP');
	});

	it('works with different stats and heroes', () => {
		const result = formatTrainingRuneToast(360, 'Attack Damage', 'Anti-Mage', 500);
		expect(result.description).toContain('Attack Damage');
		expect(result.description).toContain('Anti-Mage');
		expect(result.description).toContain('500 XP');
	});
});

describe('runeTargetClasses', () => {
	it('returns empty string when not in apply mode', () => {
		expect(runeTargetClasses(false, true)).toBe('');
		expect(runeTargetClasses(false, false)).toBe('');
	});

	it('returns positioning + cursor classes for valid target in apply mode (no animate-pulse)', () => {
		const classes = runeTargetClasses(true, true);
		expect(classes).toContain('z-50');
		expect(classes).toContain('cursor-pointer');
		expect(classes).not.toContain('animate-pulse');
	});

	it('returns dimmed classes for invalid target in apply mode', () => {
		const classes = runeTargetClasses(true, false);
		expect(classes).toContain('opacity-30');
		expect(classes).toContain('pointer-events-none');
	});
});

describe('shouldAutoApply', () => {
	it('returns autoApply true with heroId when active slot has a heroId', () => {
		const result = shouldAutoApply({ actionHeroId: 42 });
		expect(result).toEqual({ autoApply: true, heroId: 42 });
	});

	it('returns autoApply false when no active slot', () => {
		const result = shouldAutoApply(undefined);
		expect(result).toEqual({ autoApply: false, heroId: null });
	});

	it('returns autoApply false when active slot has null heroId', () => {
		const result = shouldAutoApply({ actionHeroId: null });
		expect(result).toEqual({ autoApply: false, heroId: null });
	});

	it('returns autoApply false when active slot has undefined heroId', () => {
		const result = shouldAutoApply({ actionHeroId: undefined });
		expect(result).toEqual({ autoApply: false, heroId: null });
	});
});
