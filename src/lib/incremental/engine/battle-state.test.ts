import { describe, it, expect } from 'vitest';
import { createBattleState } from './battle-state';
import { getHeroDef } from './test-fixtures';

const withDefs = { getHeroDef };

/** createBattleState builds initial BattleState from lineup hero ids and encounter id. */
describe('battle-state', () => {
	/** Bristleback (99), Lina (25), Dazzle (50) vs wolf_pack: 3 player heroes, 3 enemies, focus 0, result null. */
	it('createBattleState([99, 25, 50], "wolf_pack") returns state with 3 player heroes, 3 enemies, focusedHeroIndex 0, result null', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		expect(state.player).toHaveLength(3);
		expect(state.enemy).toHaveLength(3);
		expect(state.focusedHeroIndex).toBe(0);
		expect(state.targetIndex).toBe(0);
		expect(state.enemyFocusedIndex).toBe(0);
		expect(state.result).toBeNull();
		expect(state.elapsedTime).toBe(0);
		// lastFocusChangeAt is -2 at start so the first focus change is allowed (cooldown 2s)
		expect(state.lastFocusChangeAt).toBe(-2);
	});

	/** All player hero timers start at 0; hero instances have correct heroId, maxHp/currentHp from def. */
	it('all player hero timers are 0 and hero instances have correct heroId and HP from def', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		expect(state.player[0].heroId).toBe(99);
		expect(state.player[0].currentHp).toBe(150);
		expect(state.player[0].maxHp).toBe(150);
		expect(state.player[0].attackTimer).toBe(0);
		expect(state.player[0].spellTimer).toBe(0);
		expect(state.player[0].abilityIds).toEqual(['bristleback_return']);
		expect(state.player[1].heroId).toBe(25);
		expect(state.player[1].maxHp).toBe(100);
		expect(state.player[2].heroId).toBe(50);
		expect(state.player[2].maxHp).toBe(120);
	});

	/** Enemy instances: 1 large_wolf (700 HP), 2 small_wolf (250 HP each); all timers 0. */
	it('enemy side has 1 large_wolf and 2 small_wolf with correct HP and timers 0', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		const large = state.enemy.filter((e) => e.enemyDefId === 'large_wolf');
		const small = state.enemy.filter((e) => e.enemyDefId === 'small_wolf');
		expect(large).toHaveLength(1);
		expect(large[0].currentHp).toBe(700);
		expect(large[0].maxHp).toBe(700);
		expect(large[0].attackTimer).toBe(0);
		expect(small).toHaveLength(2);
		expect(small[0].currentHp).toBe(250);
		expect(small[0].maxHp).toBe(250);
	});

	/** Unknown hero id throws. */
	it('throws for unknown hero id', () => {
		expect(() => createBattleState([999], 'wolf_pack', withDefs)).toThrow('Unknown hero id: 999');
	});

	/** Unknown encounter id throws. */
	it('throws for unknown encounter id', () => {
		expect(() => createBattleState([99], 'unknown_encounter', withDefs)).toThrow(
			'Unknown encounter id: unknown_encounter'
		);
	});

	/** Options can set initial elapsedTime and lastFocusChangeAt. */
	it('accepts options for elapsedTime and lastFocusChangeAt', () => {
		const state = createBattleState([99], 'wolf_pack', {
			...withDefs,
			elapsedTime: 5,
			lastFocusChangeAt: 3
		});
		expect(state.elapsedTime).toBe(5);
		expect(state.lastFocusChangeAt).toBe(3);
	});

	/** Enemies with summonAbility (e.g. skull_lord) get spellTimer initialized to 0. */
	it('skull_lord in encounter has spellTimer 0', () => {
		const state = createBattleState([99], 'skull_lord_boss', withDefs);
		const skullLord = state.enemy.find((e) => e.enemyDefId === 'skull_lord');
		expect(skullLord).toBeDefined();
		expect(skullLord?.spellTimer).toBe(0);
	});

	/** Level 1 (default): enemy stats are unchanged from base defs. */
	it('level 1 does not scale enemy stats', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', { ...withDefs, level: 1 });
		const large = state.enemy.find((e) => e.enemyDefId === 'large_wolf')!;
		expect(large.currentHp).toBe(700);
		expect(large.maxHp).toBe(700);
		expect(large.attackDamage).toBe(4);
		expect(state.level).toBe(1);
	});

	/** Level 2: enemy HP and damage are doubled. */
	it('level 2 doubles enemy HP and damage', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', { ...withDefs, level: 2 });
		const large = state.enemy.find((e) => e.enemyDefId === 'large_wolf')!;
		expect(large.currentHp).toBe(1400);
		expect(large.maxHp).toBe(1400);
		expect(large.attackDamage).toBe(8);
		const small = state.enemy.find((e) => e.enemyDefId === 'small_wolf')!;
		expect(small.currentHp).toBe(500);
		expect(small.attackDamage).toBe(4);
		expect(state.level).toBe(2);
	});

	/** Level 3: enemy stats are 4x. */
	it('level 3 quadruples enemy stats', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', { ...withDefs, level: 3 });
		const large = state.enemy.find((e) => e.enemyDefId === 'large_wolf')!;
		expect(large.currentHp).toBe(2800);
		expect(large.attackDamage).toBe(16);
		expect(state.level).toBe(3);
	});

	/** Level scaling does NOT affect player heroes. */
	it('level scaling does not affect player hero HP', () => {
		const state1 = createBattleState([99], 'wolf_pack', { ...withDefs, level: 1 });
		const state5 = createBattleState([99], 'wolf_pack', { ...withDefs, level: 5 });
		expect(state1.player[0].maxHp).toBe(state5.player[0].maxHp);
	});
});
