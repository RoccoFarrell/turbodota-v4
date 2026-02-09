/**
 * Resolution: auto-attack, spell, enemy actions, win/lose.
 */

import { describe, it, expect } from 'vitest';
import { createBattleState } from './battle-state';
import { resolution } from './resolution';
import { getHeroDef, getEnemyDef } from '../constants';
import * as formulas from '../stats/formulas';

describe('resolution', () => {
	it('resolveAutoAttack: reduces target enemy HP and resets hero attack timer', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack');
		const def = getHeroDef(99)!;
		const interval = formulas.attackInterval(def.baseAttackInterval, 0);
		// Advance focused hero (0) attack timer so it's ready
		const ready = {
			...state,
			player: state.player.map((p, i) =>
				i === 0 ? { ...p, attackTimer: interval } : p
			)
		};
		const after = resolution.resolveAutoAttack(ready, 0);
		expect(after.player[0].attackTimer).toBe(0);
		const target = after.enemy[state.targetIndex];
		expect(target.currentHp).toBeLessThan(getEnemyDef(target.enemyDefId)!.hp);
	});

	it('resolveAutoAttack: non-focus target takes reduced damage', () => {
		const state = createBattleState([25], 'wolf_pack');
		const def = getHeroDef(25)!;
		const interval = formulas.attackInterval(def.baseAttackInterval, 0);
		const ready = {
			...state,
			player: state.player.map((p) => ({ ...p, attackTimer: interval })),
			targetIndex: 1,
			enemyFocusedIndex: 0
		};
		const hpBefore = ready.enemy[1].currentHp;
		const after = resolution.resolveAutoAttack(ready, 0);
		const damageToNonFocus = hpBefore - after.enemy[1].currentHp;
		// Same hero attacking focus would do more (full damage)
		ready.targetIndex = 0;
		ready.enemyFocusedIndex = 0;
		const hpFocusBefore = ready.enemy[0].currentHp;
		const afterFocus = resolution.resolveAutoAttack(ready, 0);
		const damageToFocus = hpFocusBefore - afterFocus.enemy[0].currentHp;
		expect(damageToNonFocus).toBeLessThan(damageToFocus);
	});

	it('resolveSpell: reduces enemy HP and resets spell timer (e.g. Laguna)', () => {
		const state = createBattleState([25], 'wolf_pack');
		const def = getHeroDef(25)!;
		const interval = formulas.spellInterval(def.baseSpellInterval!, 0);
		const ready = {
			...state,
			player: state.player.map((p) => ({ ...p, spellTimer: interval }))
		};
		const hpBefore = ready.enemy[0].currentHp;
		const after = resolution.resolveSpell(ready, 0);
		expect(after.player[0].spellTimer).toBe(0);
		expect(after.enemy[0].currentHp).toBeLessThan(hpBefore);
	});

	it('when all enemies dead, state.result === "win"', () => {
		let state = createBattleState([25], 'wolf_pack');
		const def = getHeroDef(25)!;
		const attackInt = formulas.attackInterval(def.baseAttackInterval, 0);
		const spellInt = formulas.spellInterval(def.baseSpellInterval!, 0);
		// One enemy (large_wolf 80 hp). Laguna 100 base -> big chunk; a few attacks to finish
		state = {
			...state,
			enemy: [state.enemy[0]],
			targetIndex: 0,
			enemyFocusedIndex: 0
		};
		state = {
			...state,
			player: state.player.map((p) => ({
				...p,
				attackTimer: attackInt,
				spellTimer: spellInt
			}))
		};
		state = resolution.resolveSpell(state, 0);
		// Keep attacking until all dead
		while (state.result === null && state.enemy.length > 0) {
			state = {
				...state,
				player: state.player.map((p, i) =>
					i === 0 ? { ...p, attackTimer: attackInt } : p
				)
			};
			state = resolution.resolveAutoAttack(state, 0);
		}
		expect(state.result).toBe('win');
	});

	it('when enemy attacks Bristleback, attacker takes return damage', () => {
		// Lineup with Bristleback (99) focused; one enemy
		let state = createBattleState([99], 'wolf_pack');
		const largeWolf = getEnemyDef('large_wolf')!;
		state = {
			...state,
			enemy: [state.enemy[0]],
			targetIndex: 0
		};
		// Set enemy attack timer ready
		state = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				attackTimer: largeWolf.attackInterval
			}))
		};
		const enemyHpBefore = state.enemy[0].currentHp;
		state = resolution.resolveEnemyActions(state);
		// Enemy should have taken return damage (Bristleback passive)
		expect(state.enemy[0].currentHp).toBeLessThan(enemyHpBefore);
	});
});
