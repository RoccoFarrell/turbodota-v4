import { describe, it, expect } from 'vitest';
import type {
	BattleState,
	HeroInstance,
	EnemyInstance,
	MapNode,
	RunState
} from './types';
import { PrimaryAttribute as PA, NodeType as NT } from './types';

/** Type shapes and const values for battle/run types. */
describe('incremental types', () => {
	/** BattleState, HeroInstance, EnemyInstance: required fields and default shape (focus 0, result null, timers 0). */
	it('builds a minimal BattleState and asserts shape', () => {
		const hero: HeroInstance = {
			heroId: 1,
			currentHp: 100,
			maxHp: 100,
			attackTimer: 0,
			spellTimer: 0,
			abilityIds: ['laguna_blade'],
			buffs: []
		};
		const enemy: EnemyInstance = {
			enemyDefId: 'large_wolf',
			currentHp: 50,
			maxHp: 50,
			attackTimer: 0,
			buffs: []
		};
		const state: BattleState = {
			player: [hero],
			enemy: [enemy],
			focusedHeroIndex: 0,
			targetIndex: 0,
			enemyFocusedIndex: 0,
			lastFocusChangeAt: 0,
			elapsedTime: 0,
			result: null
		};

		expect(state.focusedHeroIndex).toBe(0);
		expect(state.targetIndex).toBe(0);
		expect(state.enemyFocusedIndex).toBe(0);
		expect(state.result).toBeNull();
		expect(state.elapsedTime).toBe(0);
		expect(state.player).toHaveLength(1);
		expect(state.player[0].heroId).toBe(1);
		expect(state.player[0].buffs).toEqual([]);
		expect(state.enemy).toHaveLength(1);
		expect(state.enemy[0].enemyDefId).toBe('large_wolf');
	});

	/** PrimaryAttribute and NodeType const objects export expected string values. */
	it('PrimaryAttribute and NodeType have expected values', () => {
		expect(PA.STR).toBe('str');
		expect(PA.UNIVERSAL).toBe('universal');
		expect(NT.COMBAT).toBe('combat');
		expect(NT.BASE).toBe('base');
	});

	/** MapNode and RunState: nodeType, nextNodeIds, status, currentNodeId. */
	it('builds minimal MapNode and RunState', () => {
		const node: MapNode = {
			id: 'node_1',
			nodeType: 'combat',
			encounterId: 'wolf_pack',
			nextNodeIds: ['node_2', 'node_3']
		};
		expect(node.nodeType).toBe('combat');
		expect(node.nextNodeIds).toHaveLength(2);

		const runState: RunState = {
			runId: 'run_1',
			status: 'active',
			currentNodeId: 'node_1',
			nextNodeIds: ['node_2', 'node_3']
		};
		expect(runState.status).toBe('active');
	});
});
