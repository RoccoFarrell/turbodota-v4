/**
 * Talent tree node definitions. Phase 13.
 * Purchased nodes are stored in IncrementalTalentNode (saveId, nodeId).
 * Talent points earned = 1 per roster hero (computed); spent = count of purchased nodes.
 */

import type { TrainingStatKey } from '../actions/constants';

export type TalentNodeType = 'unlock_building' | 'training_speed' | 'mining_speed' | 'unlock_slot';

export interface TalentNodeDef {
	id: string;
	type: TalentNodeType;
	/** Node IDs that must be purchased first (empty = root). */
	prerequisiteIds: string[];
	/** For unlock_building: which stat/building. For training_speed: which stat. */
	statKey?: TrainingStatKey;
	/** For training_speed and mining_speed: e.g. 0.15 = +15%. */
	percent?: number;
	/** Display name. */
	name: string;
	/** Short description for UI. */
	description: string;
}

/** All talent nodes in the tree. Order determines display; prerequisites define structure. */
export const TALENT_NODES: TalentNodeDef[] = [
	{
		id: 'mining_speed_10',
		type: 'mining_speed',
		prerequisiteIds: [],
		percent: 0.1,
		name: 'Mining +10%',
		description: 'Mining strikes complete 10% faster'
	},
	{
		id: 'hp_training_10',
		type: 'training_speed',
		prerequisiteIds: [],
		statKey: 'hp',
		percent: 0.1,
		name: 'Barracks +10%',
		description: 'HP training 10% faster'
	},
	{
		id: 'spell_power_training_15',
		type: 'training_speed',
		prerequisiteIds: [],
		statKey: 'spell_power',
		percent: 0.15,
		name: 'Arcane Sanctum +15%',
		description: 'Spell power training 15% faster'
	},
	{
		id: 'attack_damage_training_10',
		type: 'training_speed',
		prerequisiteIds: [],
		statKey: 'attack_damage',
		percent: 0.1,
		name: 'Weapon Smithy +10%',
		description: 'Attack damage training 10% faster'
	},
	{
		id: 'all_training_5',
		type: 'training_speed',
		prerequisiteIds: ['hp_training_10', 'spell_power_training_15'],
		percent: 0.05,
		name: 'Discipline +5%',
		description: 'All training 5% faster'
	},
	{
		id: 'unlock_slot_2',
		type: 'unlock_slot',
		prerequisiteIds: ['mining_speed_10', 'hp_training_10'],
		name: 'Second Action Slot',
		description: 'Unlock a second action slot to train or collect simultaneously'
	},
	{
		id: 'unlock_slot_3',
		type: 'unlock_slot',
		prerequisiteIds: ['unlock_slot_2', 'all_training_5'],
		name: 'Third Action Slot',
		description: 'Unlock a third action slot for maximum efficiency'
	}
];

const byId = new Map(TALENT_NODES.map((n) => [n.id, n]));

export function getTalentNode(nodeId: string): TalentNodeDef | undefined {
	return byId.get(nodeId);
}

/** Stat keys that are unlocked by default (no talent required). All seven for v1. */
export const DEFAULT_UNLOCKED_STATS: TrainingStatKey[] = [
	'hp',
	'attack_damage',
	'spell_power',
	'attack_speed',
	'spell_haste',
	'armor',
	'magic_resist'
];

/** Talent points earned per roster hero unlocked. */
export const TALENT_POINTS_PER_HERO = 1;
