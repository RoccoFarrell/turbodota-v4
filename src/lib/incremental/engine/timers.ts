import type { BattleState, HeroInstance, EnemyInstance, Buff } from '../types';
import { getStatusEffectDef } from '../constants';

const FOCUS_CHANGE_COOLDOWN = 2; // seconds
const AUTO_ROTATION_INTERVAL = 10; // seconds

/** True if the unit has any buff that applies stun (stops timer advance). */
function isStunned(buffs: Buff[] | undefined): boolean {
	if (!buffs?.length) return false;
	return buffs.some((b) => getStatusEffectDef(b.id)?.stun === true);
}

/**
 * Advance all player heroes' attack timers by deltaTime; only the focused hero's spell timer advances.
 * All enemy timers advance. Dead units (currentHp <= 0) and stunned units do not advance timers.
 * Returns new state (immutable).
 */
export function advanceTimers(state: BattleState, deltaTime: number): BattleState {
	const focusIdx = state.focusedHeroIndex;
	const player = state.player.map((hero, i) => {
		if (hero.currentHp <= 0) return hero;
		const stunned = isStunned(hero.buffs);
		const attackTimer = stunned ? hero.attackTimer : hero.attackTimer + deltaTime;
		// Spell interval comes from DB (battle loop uses defs); we don't cap here to avoid using constants
		let spellTimer = hero.spellTimer;
		if (i === focusIdx && !stunned) {
			spellTimer = hero.spellTimer + deltaTime;
		}
		return { ...hero, attackTimer, spellTimer };
	});
	const enemy = state.enemy.map((e) => {
		if (e.currentHp <= 0) return e;
		const stunned = isStunned(e.buffs);
		return {
			...e,
			attackTimer: stunned ? e.attackTimer : e.attackTimer + deltaTime,
			...(e.spellTimer != null && {
				spellTimer: stunned ? e.spellTimer : e.spellTimer + deltaTime
			})
		};
	});
	return { ...state, player, enemy };
}

/**
 * If cooldown elapsed (elapsedTime - lastFocusChangeAt >= 2s), switch focus to new index:
 * reset previous and new focused hero timers to 0, set lastFocusChangeAt = elapsedTime.
 * Dead heroes are not selectable as focus. Uses state.elapsedTime as "now".
 */
export function applyFocusChange(
	state: BattleState,
	newFocusedHeroIndex: number
): BattleState {
	if (newFocusedHeroIndex === state.focusedHeroIndex) return state;
	if (newFocusedHeroIndex < 0 || newFocusedHeroIndex >= state.player.length) return state;
	const candidate = state.player[newFocusedHeroIndex];
	if (!candidate || candidate.currentHp <= 0) return state;
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
 * If 10s have passed since last focus change, rotate focus to next living hero (cycle) and reset timers.
 * Uses state.elapsedTime as "now". Returns state unchanged if cooldown not elapsed.
 */
export function applyAutoRotation(state: BattleState): BattleState {
	const now = state.elapsedTime;
	if (now - state.lastFocusChangeAt < AUTO_ROTATION_INTERVAL) return state;
	if (state.player.length === 0) return state;

	// Next living hero after current in cycle (for rotation we want to move to the next, not stay on current)
	let nextIndex = (state.focusedHeroIndex + 1) % state.player.length;
	for (let i = 0; i < state.player.length; i++) {
		if (state.player[nextIndex].currentHp > 0) break;
		nextIndex = (nextIndex + 1) % state.player.length;
	}
	if (state.player[nextIndex].currentHp <= 0 || nextIndex === state.focusedHeroIndex) return state;
	return applyFocusChange({ ...state, elapsedTime: now }, nextIndex);
}

/**
 * Index of the next living hero in lineup order, starting after currentIndex (cycling).
 * Returns currentIndex if it's already alive; otherwise first alive index; if none, returns 0.
 */
export function getNextAliveHeroIndex(
	player: HeroInstance[],
	currentIndex: number
): number {
	if (!player.length) return 0;
	const current = player[currentIndex];
	if (current && current.currentHp > 0) return currentIndex;
	for (let offset = 1; offset <= player.length; offset++) {
		const i = (currentIndex + offset) % player.length;
		if (player[i].currentHp > 0) return i;
	}
	return 0;
}

/**
 * If the focused hero is dead, set focusedHeroIndex to the next living hero in lineup order.
 * Call after actions that may kill the front liner (e.g. resolveEnemyActions).
 */
export function ensureFocusOnLivingHero(state: BattleState): BattleState {
	if (state.player.length === 0) return state;
	const hero = state.player[state.focusedHeroIndex];
	if (hero && hero.currentHp > 0) return state;
	const next = getNextAliveHeroIndex(state.player, state.focusedHeroIndex);
	return { ...state, focusedHeroIndex: next };
}
