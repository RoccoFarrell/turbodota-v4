/**
 * Resolution: auto-attack, spell, enemy actions, win/lose.
 */

import { describe, it, expect, vi } from 'vitest';
import { createBattleState } from './battle-state';
import { resolution } from './resolution';
import { getHeroDef, getAbilityDef } from './test-fixtures';
import { getEnemyDef } from '../constants';
import * as formulas from '../stats/formulas';

const defs = { getHeroDef, getAbilityDef };
const withDefs = { getHeroDef };

describe('resolution', () => {
	it('resolveAutoAttack: reduces target enemy HP and resets hero attack timer', () => {
		const state = createBattleState([99, 25, 50], 'wolf_pack', withDefs);
		const def = getHeroDef(99)!;
		const interval = formulas.attackInterval(def.baseAttackInterval, 0);
		// Advance focused hero (0) attack timer so it's ready
		const ready = {
			...state,
			player: state.player.map((p, i) =>
				i === 0 ? { ...p, attackTimer: interval } : p
			)
		};
		const after = resolution.resolveAutoAttack(ready, 0, defs);
		expect(after.player[0].attackTimer).toBe(0);
		const target = after.enemy[state.targetIndex];
		expect(target.currentHp).toBeLessThan(getEnemyDef(target.enemyDefId)!.hp);
	});

	it('resolveAutoAttack: non-focus target takes reduced damage', () => {
		const state = createBattleState([25], 'wolf_pack', withDefs);
		const def = getHeroDef(25)!;
		const interval = formulas.attackInterval(def.baseAttackInterval, 0);
		const ready = {
			...state,
			player: state.player.map((p) => ({ ...p, attackTimer: interval })),
			targetIndex: 1,
			enemyFocusedIndex: 0
		};
		const hpBefore = ready.enemy[1].currentHp;
		const after = resolution.resolveAutoAttack(ready, 0, defs);
		const damageToNonFocus = hpBefore - after.enemy[1].currentHp;
		// Same hero attacking focus would do more (full damage)
		ready.targetIndex = 0;
		ready.enemyFocusedIndex = 0;
		const hpFocusBefore = ready.enemy[0].currentHp;
		const afterFocus = resolution.resolveAutoAttack(ready, 0, defs);
		const damageToFocus = hpFocusBefore - afterFocus.enemy[0].currentHp;
		expect(damageToNonFocus).toBeLessThan(damageToFocus);
	});

	it('resolveSpell: reduces enemy HP and resets spell timer (e.g. Laguna)', () => {
		const state = createBattleState([25], 'wolf_pack', withDefs);
		const def = getHeroDef(25)!;
		const interval = formulas.spellInterval(def.baseSpellInterval!, 0);
		const ready = {
			...state,
			player: state.player.map((p) => ({ ...p, spellTimer: interval }))
		};
		const hpBefore = ready.enemy[0].currentHp;
		const after = resolution.resolveSpell(ready, 0, defs);
		expect(after.player[0].spellTimer).toBe(0);
		expect(after.enemy[0].currentHp).toBeLessThan(hpBefore);
	});

	it('when all enemies dead, state.result === "win"', () => {
		let state = createBattleState([25], 'wolf_pack', withDefs);
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
		state = resolution.resolveSpell(state, 0, defs);
		// Keep attacking until all dead
		while (state.result === null && state.enemy.length > 0) {
			state = {
				...state,
				player: state.player.map((p, i) =>
					i === 0 ? { ...p, attackTimer: attackInt } : p
				)
			};
			state = resolution.resolveAutoAttack(state, 0, defs);
		}
		expect(state.result).toBe('win');
	});

	it('when enemy attacks Bristleback, attacker takes return damage', () => {
		// Lineup with Bristleback (99) focused; one enemy
		let state = createBattleState([99], 'wolf_pack', withDefs);
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
		state = resolution.resolveEnemyActions(state, defs);
		// Enemy should have taken return damage (Bristleback passive)
		expect(state.enemy[0].currentHp).toBeLessThan(enemyHpBefore);
	});

	it('resolveEnemySummons: adds lesser_skull when skull_lord spellTimer >= interval and resets summoner spellTimer', () => {
		let state = createBattleState([99], 'skull_lord_boss', withDefs);
		expect(state.enemy).toHaveLength(1);
		expect(state.enemy[0].enemyDefId).toBe('skull_lord');
		// Set spellTimer to interval (12) so summon triggers
		state = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				spellTimer: 12
			}))
		};
		const after = resolution.resolveEnemySummons(state);
		expect(after.enemy).toHaveLength(2);
		expect(after.enemy[0].enemyDefId).toBe('skull_lord');
		expect(after.enemy[0].spellTimer).toBe(0);
		expect(after.enemy[1].enemyDefId).toBe('lesser_skull');
		expect(after.enemy[1].currentHp).toBe(getEnemyDef('lesser_skull')!.hp);
		expect(after.enemy[1].attackTimer).toBe(0);
		expect(after.combatLog?.some((e) => e.type === 'summon' && e.summonedEnemyDefId === 'lesser_skull')).toBe(true);
	});

	it('attack_speed_slow: enemy with debuff needs longer to attack', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		const largeWolf = getEnemyDef('large_wolf')!;
		state = {
			...state,
			enemy: [state.enemy[0]],
			targetIndex: 0
		};
		// Apply attack_speed_slow debuff (-0.25) to the enemy
		state = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				buffs: [{ id: 'attack_speed_slow', duration: 4, value: -0.25 }],
				// Set timer to base interval (would normally trigger), but debuff makes effective interval longer
				attackTimer: largeWolf.attackInterval
			}))
		};
		const heroHpBefore = state.player[0].currentHp;
		state = resolution.resolveEnemyActions(state, defs);
		// Enemy should NOT have attacked — effective interval is base / (1 + -0.25) = base / 0.75 > base
		expect(state.player[0].currentHp).toBe(heroHpBefore);
	});

	it('attack_damage_reduce: enemy deals less damage with debuff', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		const largeWolf = getEnemyDef('large_wolf')!;
		state = {
			...state,
			enemy: [state.enemy[0]],
			targetIndex: 0
		};
		// Get baseline damage (no debuff)
		let baseline = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				attackTimer: largeWolf.attackInterval + 1
			}))
		};
		baseline = resolution.resolveEnemyActions(baseline, defs);
		const baselineDamage = state.player[0].currentHp - baseline.player[0].currentHp;

		// Now with attack_damage_reduce debuff (-0.3 = 30% less)
		let debuffed = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				buffs: [{ id: 'attack_damage_reduce', duration: 4, value: -0.3 }],
				attackTimer: largeWolf.attackInterval + 1
			})) as typeof state.enemy
		};
		debuffed = resolution.resolveEnemyActions(debuffed, defs);
		const debuffedDamage = state.player[0].currentHp - debuffed.player[0].currentHp;
		expect(debuffedDamage).toBeLessThan(baselineDamage);
	});

	it('evasion: hero with evasion buff evades when random roll is below chance', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		const largeWolf = getEnemyDef('large_wolf')!;
		state = {
			...state,
			targetIndex: 0,
			player: state.player.map((p) => ({
				...p,
				buffs: [{ id: 'evasion', duration: 10, value: 0.5 }]
			})) as typeof state.player,
			enemy: [state.enemy[0]].map((e) => ({
				...e,
				attackTimer: largeWolf.attackInterval + 1
			})) as typeof state.enemy
		};
		const heroHpBefore = state.player[0].currentHp;

		// Mock Math.random to return 0.1 (below 0.5 evasion chance → evade)
		vi.spyOn(Math, 'random').mockReturnValue(0.1);
		const evaded = resolution.resolveEnemyActions(state, defs);
		expect(evaded.player[0].currentHp).toBe(heroHpBefore);
		expect(evaded.combatLog?.some((e) => e.evaded === true)).toBe(true);

		// Mock Math.random to return 0.8 (above 0.5 evasion chance → hit)
		vi.spyOn(Math, 'random').mockReturnValue(0.8);
		const hit = resolution.resolveEnemyActions(state, defs);
		expect(hit.player[0].currentHp).toBeLessThan(heroHpBefore);

		vi.restoreAllMocks();
	});

	it('resolveSpell: self-target evasion spell applies buff to focused hero', () => {
		let state = createBattleState([102], 'wolf_pack', { getHeroDef });
		const def = getHeroDef(102)!;
		const interval = formulas.spellInterval(def.baseSpellInterval!, 0);
		state = {
			...state,
			player: state.player.map((p) => ({ ...p, spellTimer: interval }))
		};
		const after = resolution.resolveSpell(state, 0, defs);
		expect(after.player[0].spellTimer).toBe(0);
		const evasionBuff = after.player[0].buffs.find((b) => b.id === 'evasion');
		expect(evasionBuff).toBeDefined();
		expect(evasionBuff!.value).toBe(0.25);
		expect(evasionBuff!.duration).toBe(6);
	});

	it('resolveSpell: shield spell sets shieldHp on hero (baseDamage + spellPower)', () => {
		let state = createBattleState([103], 'wolf_pack', { getHeroDef });
		const def = getHeroDef(103)!;
		const interval = formulas.spellInterval(def.baseSpellInterval!, 0);
		state = {
			...state,
			player: state.player.map((p) => ({ ...p, spellTimer: interval }))
		};
		const after = resolution.resolveSpell(state, 0, defs);
		expect(after.player[0].spellTimer).toBe(0);
		const shieldBuff = after.player[0].buffs.find((b) => b.id === 'shield');
		expect(shieldBuff).toBeDefined();
		// baseDamage (50) + spellPower (20) = 70
		expect(after.player[0].shieldHp).toBe(70);
	});

	it('shield: absorbs damage before hero HP', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		const largeWolf = getEnemyDef('large_wolf')!;
		state = {
			...state,
			enemy: [state.enemy[0]],
			targetIndex: 0,
			player: state.player.map((p) => ({
				...p,
				shieldHp: 100,
				buffs: [{ id: 'shield', duration: 10, value: 100 }]
			})) as typeof state.player,
		};
		state = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				attackTimer: largeWolf.attackInterval + 1
			}))
		};
		const heroHpBefore = state.player[0].currentHp;
		const after = resolution.resolveEnemyActions(state, defs);
		// Shield should have absorbed the damage (enemy damage is small relative to 100 shield)
		expect(after.player[0].currentHp).toBe(heroHpBefore);
		expect(after.player[0].shieldHp).toBeLessThan(100);
	});

	it('processBuffs: shield buff expiry zeroes shieldHp', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		state = {
			...state,
			player: state.player.map((p) => ({
				...p,
				shieldHp: 50,
				buffs: [{ id: 'shield', duration: 0.1, value: 50 }]
			})) as typeof state.player,
		};
		const after = resolution.processBuffs(state, 0.15, defs);
		// Shield buff expired (duration 0.1 - 0.15 < 0) → shieldHp should be zeroed
		expect(after.player[0].buffs.find((b) => b.id === 'shield')).toBeUndefined();
		expect(after.player[0].shieldHp).toBe(0);
	});

	it('magic_dot: spell applies tick damage debuff to enemy with baseDamage + spellPower', () => {
		// Hero 104 has spellPower=10, test_magic_dot has baseDamage=15
		let state = createBattleState([104], 'wolf_pack', { getHeroDef });
		const def = getHeroDef(104)!;
		const interval = formulas.spellInterval(def.baseSpellInterval!, 0);
		state = {
			...state,
			player: state.player.map((p) => ({ ...p, spellTimer: interval }))
		};
		const after = resolution.resolveSpell(state, 0, defs);
		expect(after.player[0].spellTimer).toBe(0);
		// Enemy should have magic_dot buff with value = 15 (baseDamage) + 10 (spellPower) = 25
		const dotBuff = after.enemy[0].buffs?.find((b) => b.id === 'magic_dot');
		expect(dotBuff).toBeDefined();
		expect(dotBuff!.value).toBe(25);
		expect(dotBuff!.duration).toBe(5);
	});

	it('processBuffs: magic_dot deals tick damage to enemy each tick', () => {
		let state = createBattleState([99], 'wolf_pack', withDefs);
		const enemyHpBefore = state.enemy[0].currentHp;
		// Apply magic_dot buff to enemy: 20 DPS for 5 seconds
		state = {
			...state,
			enemy: state.enemy.map((e) => ({
				...e,
				buffs: [{ id: 'magic_dot', duration: 5, value: 20 }]
			}))
		};
		// Tick 1 second
		const after = resolution.processBuffs(state, 1.0, defs);
		// Enemy should have taken ~20 magical damage (reduced by magic resist 0.25 → 15)
		const expectedDamage = 20 * (1 - 0.25); // 15
		expect(after.enemy[0].currentHp).toBeCloseTo(enemyHpBefore - expectedDamage, 0);
		// Buff should still be active (duration 5 - 1 = 4)
		const remainingBuff = after.enemy[0].buffs?.find((b) => b.id === 'magic_dot');
		expect(remainingBuff).toBeDefined();
		expect(remainingBuff!.duration).toBeCloseTo(4, 1);
	});
});
