/**
 * Battle loop: single tick (focus, auto-rotation, advance timers, resolve actions).
 */

import type { BattleState } from '../types';
import { advanceTimers, applyFocusChange, applyAutoRotation } from './timers';
import { resolveAutoAttack, resolveSpell, resolveEnemyActions } from './resolution';
import { getHeroDef } from '../constants';
import { attackInterval, spellInterval } from '../stats/formulas';

export interface TickOptions {
	/** If set and cooldown OK, switch focus to this hero index. */
	focusChange?: number;
	/** If set, set state.targetIndex (clamped to valid enemy index). */
	targetChange?: number;
}

/**
 * One tick: update time, optional focus/target change, auto-rotation, advance timers,
 * then resolve player auto-attack (if ready), spell (if ready), then enemy actions.
 * Returns new state; stops early if result is set.
 */
export function tick(
	state: BattleState,
	deltaTime: number,
	options?: TickOptions
): BattleState {
	let s: BattleState = { ...state, elapsedTime: state.elapsedTime + deltaTime };

	if (options?.focusChange != null) {
		s = applyFocusChange(s, options.focusChange);
	}
	if (options?.targetChange != null && s.enemy.length > 0) {
		const idx = Math.max(0, Math.min(options.targetChange, s.enemy.length - 1));
		s = { ...s, targetIndex: idx };
	}

	s = applyAutoRotation(s);
	s = advanceTimers(s, deltaTime);

	if (s.result !== null) return s;

	const focusIdx = s.focusedHeroIndex;
	const hero = s.player[focusIdx];
	if (!hero || hero.currentHp <= 0) return s;

	const def = getHeroDef(hero.heroId);
	if (!def) return s;

	const attackInt = attackInterval(def.baseAttackInterval, 0);
	if (hero.attackTimer >= attackInt) {
		s = resolveAutoAttack(s, focusIdx);
		if (s.result !== null) return s;
	}

	if (def.baseSpellInterval != null) {
		const spellInt = spellInterval(def.baseSpellInterval, 0);
		const heroAfter = s.player[focusIdx];
		if (heroAfter && heroAfter.spellTimer >= spellInt) {
			s = resolveSpell(s, focusIdx);
			if (s.result !== null) return s;
		}
	}

	s = resolveEnemyActions(s);
	return s;
}
