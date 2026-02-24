/**
 * Battle loop: single tick (focus, auto-rotation, advance timers, resolve actions).
 */

import type { BattleState, BattleDefsProvider } from '../types';
import {
	advanceTimers,
	applyFocusChange,
	applyAutoRotation,
	ensureFocusOnLivingHero
} from './timers';
import {
	resolveAutoAttack,
	resolveSpell,
	resolveEnemyActions,
	resolveEnemySummons,
	processBuffs,
	getAttackSpeedMult
} from './resolution';
import { getHeroDef } from '../constants';
import { attackInterval, spellInterval } from '../stats/formulas';

export interface TickOptions {
	/** If set and cooldown OK, switch focus to this hero index. */
	focusChange?: number;
	/** If set, set state.targetIndex (clamped to valid enemy index). */
	targetChange?: number;
	/** If true, run auto-rotation (rotate front liner every 10s). Default false. */
	autoRotateFrontLiner?: boolean;
}

function getHeroDefFrom(state: BattleState, heroId: number, defs?: BattleDefsProvider) {
	return defs?.getHeroDef?.(heroId) ?? getHeroDef(heroId);
}

/**
 * One tick: update time, optional focus/target change, auto-rotation, advance timers,
 * then resolve player auto-attack (if ready), spell (if ready), then enemy actions.
 * Returns new state; stops early if result is set.
 */
export function tick(
	state: BattleState,
	deltaTime: number,
	options?: TickOptions,
	defs?: BattleDefsProvider
): BattleState {
	let s: BattleState = { ...state, elapsedTime: state.elapsedTime + deltaTime };

	if (options?.focusChange != null) {
		s = applyFocusChange(s, options.focusChange);
	}
	if (options?.targetChange != null && s.enemy.length > 0) {
		let idx = Math.max(0, Math.min(options.targetChange, s.enemy.length - 1));
		if (s.enemy[idx].currentHp <= 0) {
			const living = s.enemy.findIndex((e) => e.currentHp > 0);
			idx = living >= 0 ? living : idx;
		}
		s = { ...s, targetIndex: idx };
	}

	if (options?.autoRotateFrontLiner) {
		s = applyAutoRotation(s);
	}
	s = advanceTimers(s, deltaTime);
	s = processBuffs(s, deltaTime, defs);

	if (s.result !== null) return s;

	// Resolve auto-attack for every hero that is ready (all heroes attack)
	for (let i = 0; i < s.player.length; i++) {
		if (s.result !== null) return s;
		const h = s.player[i];
		if (!h || h.currentHp <= 0) continue;
		const d = getHeroDefFrom(s, h.heroId, defs);
		if (!d) continue;
		const buffSpeedMult = getAttackSpeedMult(h.buffs);
		const effectiveAttackSpeed = (d.attackSpeed ?? 0) + Math.max(-0.9, buffSpeedMult);
		const attackInt = attackInterval(d.baseAttackInterval, effectiveAttackSpeed);
		if (h.attackTimer >= attackInt) {
			s = resolveAutoAttack(s, i, defs);
		}
	}

	if (s.result !== null) return s;

	// Only the focused hero casts spells
	const focusIdx = s.focusedHeroIndex;
	const hero = s.player[focusIdx];
	if (hero && hero.currentHp > 0) {
		const def = getHeroDefFrom(s, hero.heroId, defs);
		if (def?.baseSpellInterval != null) {
			const spellInt = spellInterval(def.baseSpellInterval, def.spellHaste ?? 0);
			const heroAfter = s.player[focusIdx];
			if (heroAfter && heroAfter.spellTimer >= spellInt) {
				s = resolveSpell(s, focusIdx, defs);
			}
		}
	}

	if (s.result !== null) return s;
	s = resolveEnemyActions(s, defs);
	s = resolveEnemySummons(s, defs);
	s = ensureFocusOnLivingHero(s);
	return s;
}
