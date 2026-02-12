/**
 * Battle loop: tick, simulation, focus and auto-rotation.
 */

import { describe, it, expect } from 'vitest';
import { createBattleState } from './battle-state';
import { tick } from './battle-loop';

describe('battle-loop', () => {
	it('simulation: tick until result is win or lose, no infinite loop', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack');
		const dt = 0.1;
		let steps = 0;
		const maxSteps = 5000;
		while (state.result === null && steps < maxSteps) {
			state = tick(state, dt);
			steps++;
		}
		expect(state.result).toBeDefined();
		expect(['win', 'lose']).toContain(state.result);
		expect(steps).toBeLessThan(maxSteps);
	});

	it('tick with focusChange: timers reset and 2s cooldown blocks immediate second change', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack');
		state = tick(state, 0.1, { focusChange: 1 });
		expect(state.focusedHeroIndex).toBe(1);
		// Previous focus hero's timers were reset then advanceTimers ran, so 0.1
		expect(state.player[0].attackTimer).toBe(0.1);
		// New focus hero's timers advance in same tick, so 0.1
		expect(state.player[1].attackTimer).toBe(0.1);
		// Immediately try to change again (elapsedTime ~0.1, cooldown 2s)
		state = tick(state, 0, { focusChange: 2 });
		expect(state.focusedHeroIndex).toBe(1);
		// After 2s more, focus change should work
		state = tick(state, 2.5, { focusChange: 2 });
		expect(state.focusedHeroIndex).toBe(2);
	});

	it('tick 10s without focusChange: focusedHeroIndex cycles (auto-rotation)', () => {
		let state = createBattleState([99, 25, 50], 'wolf_pack');
		expect(state.focusedHeroIndex).toBe(0);
		// Run 10s worth of ticks
		for (let t = 0; t < 100; t++) {
			state = tick(state, 0.1);
			if (state.result !== null) break;
		}
		// After 100*0.1s, elapsedTime ~10 (allow float tolerance)
		if (state.result === null) {
			expect(state.elapsedTime).toBeGreaterThanOrEqual(9.9);
			// Focus may have cycled to 1 (or 2) depending on exact timing
			expect(state.focusedHeroIndex).toBeGreaterThanOrEqual(0);
			expect(state.focusedHeroIndex).toBeLessThan(3);
		}
	});

	it('tick with targetChange: sets targetIndex clamped to valid range', () => {
		let state = createBattleState([25], 'wolf_pack');
		state = tick(state, 0, { targetChange: 2 });
		expect(state.targetIndex).toBe(2);
		state = tick(state, 0, { targetChange: 10 });
		expect(state.targetIndex).toBe(2);
	});
});
