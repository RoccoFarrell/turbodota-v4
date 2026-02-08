/**
 * Incremental game types.
 * Hero ids are integers matching prisma Hero.id (Phase 0 decision).
 */

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

export const PrimaryAttribute = {
	STR: 'str',
	AGI: 'agi',
	INT: 'int',
	UNIVERSAL: 'universal'
} as const;
export type PrimaryAttribute = (typeof PrimaryAttribute)[keyof typeof PrimaryAttribute];

export const NodeType = {
	COMBAT: 'combat',
	ELITE: 'elite',
	BOSS: 'boss',
	SHOP: 'shop',
	EVENT: 'event',
	REST: 'rest',
	BASE: 'base'
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export type BattleResult = 'win' | 'lose' | null;

export type RunStatus = 'active' | 'won' | 'dead';

// ---------------------------------------------------------------------------
// Reference data (definitions)
// ---------------------------------------------------------------------------

/** Hero definition keyed by Hero.id. Base intervals, damage, ability ids. */
export interface HeroDef {
	heroId: number; // Hero.id from Prisma
	primaryAttribute: PrimaryAttribute;
	baseAttackInterval: number; // seconds
	baseAttackDamage: number;
	baseSpellInterval: number | null; // seconds; null if passive-only
	abilityIds: string[]; // length 1 now, up to 3 later
}

/** Ability definition: active (timer) or passive (on-event). */
export interface AbilityDef {
	id: string;
	type: 'active' | 'passive';
	trigger: string; // e.g. 'timer' | 'on_damage_taken' | 'on_attack'
	effect?: string; // reference to effect / formula
	target?: string; // 'self' | 'single_enemy' | 'attacker' | etc.
}

/** Enemy unit definition (HP, attack interval, damage). */
export interface EnemyDef {
	id: string;
	name: string;
	hp: number;
	attackInterval: number; // seconds
	damage: number;
	spellInterval?: number | null; // optional spell timer
}

/** Encounter definition: roster of enemies. */
export interface EncounterDef {
	id: string;
	enemies: Array<{ enemyDefId: string; count?: number }>; // count defaults to 1
}

// ---------------------------------------------------------------------------
// Runtime – battle
// ---------------------------------------------------------------------------

export interface Buff {
	id: string;
	duration?: number;
}

/** Single hero instance in battle (player side). */
export interface HeroInstance {
	heroId: number; // Hero.id
	currentHp: number;
	maxHp: number;
	attackTimer: number; // seconds accumulated toward next attack
	spellTimer: number; // seconds accumulated toward next spell
	abilityIds: string[];
	buffs: Buff[];
}

/** Single enemy instance in battle. */
export interface EnemyInstance {
	enemyDefId: string;
	currentHp: number;
	maxHp: number;
	attackTimer: number;
	spellTimer?: number;
	buffs?: Buff[];
}

/** Full battle state. Timers for non-focused player heroes do not advance. */
export interface BattleState {
	player: HeroInstance[];
	enemy: EnemyInstance[];
	focusedHeroIndex: number;
	targetIndex: number; // index into enemy[] (shared target)
	enemyFocusedIndex: number; // which enemy is the enemy team's focus (default 0)
	lastFocusChangeAt: number; // seconds since battle start when focus was last changed
	elapsedTime: number; // seconds since battle start
	result: BattleResult;
}

// ---------------------------------------------------------------------------
// Run / map
// ---------------------------------------------------------------------------

/** Map node (combat, elite, boss, shop, event, rest, base). */
export interface MapNode {
	id: string;
	nodeType: NodeType;
	encounterId: string | null; // set for combat / elite / boss
	nextNodeIds: string[];
	floor?: number;
	act?: number;
}

/** Run state for API: current node and next choices. */
export interface RunState {
	runId: string;
	status: RunStatus;
	currentNodeId: string;
	nextNodeIds: string[];
}
