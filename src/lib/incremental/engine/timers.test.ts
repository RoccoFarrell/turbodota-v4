import { describe, it, expect } from 'vitest';
import { createBattleState } from './battle-state';
import { advanceTimers, applyFocusChange, applyAutoRotation } from './timers';
import { getHeroDef } from './test-fixtures';

const withDefs = { getHeroDef };

/** Timer advance (all attack, focused spell + enemies) and focus change / auto-rotation rules. */
describe('timers', () => {
	/** All heroes attack timers advance; only focused hero spell timer advances. */
	it('advanceTimers: all attack timers advance, only focused spell timer advances', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		const next = advanceTimers(state, 0.5);
		expect(next.player[0].attackTimer).toBe(0.5);
		expect(next.player[0].spellTimer).toBe(0.5); // focused
		expect(next.player[1].attackTimer).toBe(0.5);
		expect(next.player[1].spellTimer).toBe(0); // not focused
		expect(next.player[2].attackTimer).toBe(0.5);
		expect(next.player[2].spellTimer).toBe(0); // not focused
	});

	/** All enemy timers advance by deltaTime. */
	it('advanceTimers: all enemy timers advance', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		const next = advanceTimers(state, 1);
		expect(next.enemy[0].attackTimer).toBe(1);
		expect(next.enemy[1].attackTimer).toBe(1);
		expect(next.enemy[2].attackTimer).toBe(1);
	});

	/** After focus change: old and new focused hero timers are 0; focusedHeroIndex updated. */
	it('applyFocusChange: after change, old and new hero timers 0, focus index updated', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack', { ...withDefs, elapsedTime: 5 });
		state = advanceTimers(state, 1); // all attack + focus 0 spell
		state = applyFocusChange(state, 1);
		expect(state.focusedHeroIndex).toBe(1);
		expect(state.player[0].attackTimer).toBe(0);
		expect(state.player[0].spellTimer).toBe(0);
		expect(state.player[1].attackTimer).toBe(0);
		expect(state.player[1].spellTimer).toBe(0);
		expect(state.lastFocusChangeAt).toBe(5);
	});

	/** If called again within 2s (cooldown), focus does not change. */
	it('applyFocusChange: within 2s cooldown focus does not change', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack', { ...withDefs, elapsedTime: 0 });
		state = applyFocusChange(state, 1);
		expect(state.focusedHeroIndex).toBe(1);
		// Same elapsedTime (0); lastFocusChangeAt is now 0, so 0 - 0 = 0 < 2 → cooldown not elapsed for *next* change at same time
		// Actually after first change, lastFocusChangeAt = 0. If we call applyFocusChange(state, 2) with state.elapsedTime still 0, then 0 - 0 = 0 < 2, so no change. Good.
		state = applyFocusChange(state, 2); // try to switch to 2 at same "time" 0
		expect(state.focusedHeroIndex).toBe(1); // unchanged (cooldown)
	});

	/** When 10s have passed since lastFocusChangeAt, applyAutoRotation cycles focus and resets timers. */
	it('applyAutoRotation: after 10s focusedHeroIndex cycles, previous focus timers reset', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack', {
			...withDefs,
			elapsedTime: 0,
			lastFocusChangeAt: 0
		});
		state = advanceTimers(state, 1); // all have attack 1, focus 0 has spell 1
		state = { ...state, elapsedTime: 10 }; // 10s elapsed
		state = applyAutoRotation(state);
		expect(state.focusedHeroIndex).toBe(1); // cycled 0 -> 1
		expect(state.player[0].attackTimer).toBe(0);
		expect(state.player[0].spellTimer).toBe(0);
		expect(state.lastFocusChangeAt).toBe(10);
	});

	/** Auto-rotation does nothing if less than 10s since last focus change. */
	it('applyAutoRotation: no change if less than 10s since last focus change', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack', {
			...withDefs,
			elapsedTime: 5,
			lastFocusChangeAt: 0
		});
		state = advanceTimers(state, 0.5);
		const before = state.focusedHeroIndex;
		state = applyAutoRotation(state); // 5 - 0 = 5 < 10
		expect(state.focusedHeroIndex).toBe(before);
	});
});
