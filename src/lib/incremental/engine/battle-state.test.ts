import { describe, it, expect } from 'vitest';
import { createBattleState } from './battle-state';

/** createBattleState builds initial BattleState from lineup hero ids and encounter id. */
describe('battle-state', () => {
	/** Bristleback (99), Lina (25), Dazzle (50) vs wolf_pack: 3 player heroes, 3 enemies (1 large + 2 small), focus 0, result null. */
	it('createBattleState([99, 25, 50], "wolf_pack") returns state with 3 player heroes, 3 enemies, focusedHeroIndex 0, result null', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack');
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
		const state = createBattleState([99, 25, 50], 'wolf_pack');
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

	/** Enemy instances: 1 large_wolf (80 HP), 2 small_wolf (30 HP each); all timers 0. */
	it('enemy side has 1 large_wolf and 2 small_wolf with correct HP and timers 0', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack');
		const large = state.enemy.filter((e) => e.enemyDefId === 'large_wolf');
		const small = state.enemy.filter((e) => e.enemyDefId === 'small_wolf');
		expect(large).toHaveLength(1);
		expect(large[0].currentHp).toBe(80);
		expect(large[0].maxHp).toBe(80);
		expect(large[0].attackTimer).toBe(0);
		expect(small).toHaveLength(2);
		expect(small[0].currentHp).toBe(30);
		expect(small[0].maxHp).toBe(30);
	});

	/** Unknown hero id throws. */
	it('throws for unknown hero id', () => {
		expect(() => createBattleState([999], 'wolf_pack')).toThrow('Unknown hero id: 999');
	});

	/** Unknown encounter id throws. */
	it('throws for unknown encounter id', () => {
		expect(() => createBattleState([99], 'unknown_encounter')).toThrow(
			'Unknown encounter id: unknown_encounter'
		);
	});

	/** Options can set initial elapsedTime and lastFocusChangeAt. */
	it('accepts options for elapsedTime and lastFocusChangeAt', () => {
		const state = createBattleState([99], 'wolf_pack', {
			elapsedTime: 5,
			lastFocusChangeAt: 3
		});
		expect(state.elapsedTime).toBe(5);
		expect(state.lastFocusChangeAt).toBe(3);
	});
});
