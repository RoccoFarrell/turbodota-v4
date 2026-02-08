import type { BattleState, HeroInstance, EnemyInstance } from '../types';

const FOCUS_CHANGE_COOLDOWN = 2; // seconds
const AUTO_ROTATION_INTERVAL = 10; // seconds

/**
 * Advance only the focused hero's attack and spell timers, and all enemy timers, by deltaTime.
 * Other player heroes' timers are unchanged. Returns new state (immutable).
 */
export function advanceTimers(state: BattleState, deltaTime: number): BattleState {
	const focusIdx = state.focusedHeroIndex;
	const player = state.player.map((hero, i) => {
		if (i !== focusIdx) return hero;
		return {
			...hero,
			attackTimer: hero.attackTimer + deltaTime,
			spellTimer: hero.spellTimer + deltaTime
		};
	});
	const enemy = state.enemy.map((e) => ({
		...e,
		attackTimer: e.attackTimer + deltaTime,
		...(e.spellTimer != null && { spellTimer: e.spellTimer + deltaTime })
	}));
	return { ...state, player, enemy };
}

/**
 * If cooldown elapsed (elapsedTime - lastFocusChangeAt >= 2s), switch focus to new index:
 * reset previous and new focused hero timers to 0, set lastFocusChangeAt = elapsedTime.
 * Otherwise return state unchanged. Uses state.elapsedTime as "now".
 */
export function applyFocusChange(
	state: BattleState,
	newFocusedHeroIndex: number
): BattleState {
	if (newFocusedHeroIndex === state.focusedHeroIndex) return state;
	if (newFocusedHeroIndex < 0 || newFocusedHeroIndex >= state.player.length) return state;
	const now = state.elapsedTime;
	if (now - state.lastFocusChangeAt < FOCUS_CHANGE_COOLDOWN) return state;

	const prevIdx = state.focusedHeroIndex;
	const player = state.player.map((hero, i) => {
		if (i !== prevIdx && i !== newFocusedHeroIndex) return hero;
		return { ...hero, attackTimer: 0, spellTimer: 0 };
	});
	return {
		...state,
		player,
		focusedHeroIndex: newFocusedHeroIndex,
		lastFocusChangeAt: now
	};
}

/**
 * If 10s have passed since last focus change, rotate focus to next hero (cycle) and reset timers.
 * Uses state.elapsedTime as "now". Returns state unchanged if cooldown not elapsed.
 */
export function applyAutoRotation(state: BattleState): BattleState {
	const now = state.elapsedTime;
	if (now - state.lastFocusChangeAt < AUTO_ROTATION_INTERVAL) return state;
	if (state.player.length === 0) return state;

	const nextIndex = (state.focusedHeroIndex + 1) % state.player.length;
	return applyFocusChange({ ...state, elapsedTime: now }, nextIndex);
}
