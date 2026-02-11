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

/** Damage type: physical (reduced by armor), magical (reduced by magic resist), pure (no reduction). */
export const DamageType = {
	PHYSICAL: 'physical',
	MAGICAL: 'magical',
	PURE: 'pure'
} as const;
export type DamageType = (typeof DamageType)[keyof typeof DamageType];

// ---------------------------------------------------------------------------
// Reference data (definitions)
// ---------------------------------------------------------------------------

/** Hero definition keyed by Hero.id. Base intervals, damage, defensive stats, ability ids. */
export interface HeroDef {
	heroId: number; // Hero.id from Prisma
	primaryAttribute: PrimaryAttribute;
	baseAttackInterval: number; // seconds
	baseAttackDamage: number;
	baseMaxHp: number;
	baseArmor: number; // reduces physical damage
	baseMagicResist: number; // 0–1 (e.g. 0.25 = 25%); reduces magical damage
	baseSpellInterval: number | null; // seconds; null if passive-only
	abilityIds: string[]; // length 1 now, up to 3 later
}

/** Ability definition: active (timer) or passive (on-event). Spells can deal physical, magical, or pure damage. */
export interface AbilityDef {
	id: string;
	type: 'active' | 'passive';
	trigger: string; // e.g. 'timer' | 'on_damage_taken' | 'on_attack'
	effect?: string; // reference to effect / formula
	target?: string; // 'self' | 'single_enemy' | 'attacker' | etc.
	/** Damage type for damaging abilities. Omit for heals/utility. Auto-attack is always physical. */
	damageType?: DamageType;
	/** Base damage for active damaging spells (e.g. Laguna Blade). */
	baseDamage?: number;
	/** For passives like return damage: fraction of damage taken reflected to attacker (e.g. 0.2 = 20%). */
	returnDamageRatio?: number;
	/** Display name from DB (IncrementalHeroAbility.abilityName). */
	abilityName?: string;
	/** User-facing description from DB. */
	description?: string;
	/** When cast, apply this status effect to the spell target (e.g. stun). */
	statusEffectOnHit?: { statusEffectId: string; duration: number };
}

/** Enemy unit definition (HP, attack interval, damage, defensive stats). */
export interface EnemyDef {
	id: string;
	name: string;
	hp: number;
	attackInterval: number; // seconds
	damage: number; // physical (auto-attack is always physical)
	baseArmor: number;
	baseMagicResist: number; // 0–1
	spellInterval?: number | null; // optional spell timer
}

/** Encounter definition: roster of enemies. */
export interface EncounterDef {
	id: string;
	enemies: Array<{ enemyDefId: string; count?: number }>; // count defaults to 1
}

// ---------------------------------------------------------------------------
// Status effects (buffs / debuffs)
// ---------------------------------------------------------------------------

/** Definition of a status effect (stun, poison, stat mods, etc.). */
export interface StatusEffectDef {
	id: string;
	/** If true, target cannot advance attack or spell timers. */
	stun?: boolean;
	/** If true, each tick deals damage; amount comes from Buff.value and tickDamageType. */
	tickDamage?: boolean;
	tickDamageType?: DamageType;
	/** Multiplier to incoming/outgoing damage or other stats. Applied additively (e.g. -0.2 = 20% less). */
	attackDamageMult?: number;
	spellDamageMult?: number;
	armorMod?: number;
	magicResistMod?: number;
	/** Heal over time per second; value from Buff.value. */
	healPerSecond?: boolean;
}

/** A single buff/debuff instance on a unit. Duration in seconds; value used for scaling (e.g. poison damage). */
export interface Buff {
	id: string; // status effect id
	duration: number;
	value?: number;
}

// ---------------------------------------------------------------------------
// Runtime – battle
// ---------------------------------------------------------------------------

/** Single hero instance in battle (player side). */
export interface HeroInstance {
	heroId: number; // Hero.id
	currentHp: number;
	maxHp: number;
	attackTimer: number; // seconds accumulated toward next attack
	spellTimer: number; // seconds accumulated toward next spell
	abilityIds: string[];
	buffs: Buff[];
	/** Index into active (timer) abilities for round-robin casting. */
	lastCastAbilityIndex?: number;
}

/** Single enemy instance in battle. */
export interface EnemyInstance {
	enemyDefId: string;
	currentHp: number;
	maxHp: number;
	attackTimer: number;
	spellTimer?: number;
	buffs?: Buff[];
	/** Index into active abilities for round-robin casting (when enemies have spells). */
	lastCastAbilityIndex?: number;
}

/** Optional provider for hero/ability defs (e.g. from DB). When not set, engine uses constants. */
export interface BattleDefsProvider {
	getHeroDef?(heroId: number): HeroDef | undefined;
	getAbilityDef?(abilityId: string): AbilityDef | undefined;
}

/** One entry in the battle combat log for UI display. */
export interface CombatLogEntry {
	time: number; // elapsedTime when the action occurred
	type: 'auto_attack' | 'spell' | 'enemy_attack' | 'return_damage' | 'death';
	/** Hero index (player side) when type is auto_attack or spell. */
	attackerHeroIndex?: number;
	attackerHeroId?: number;
	/** Enemy def id when attacker is a hero (target of the attack). */
	targetEnemyDefId?: string;
	targetEnemyIndex?: number;
	/** Hero index when type is enemy_attack (target of enemy). */
	targetHeroIndex?: number;
	targetHeroId?: number;
	/** Enemy def id when type is enemy_attack (the enemy that attacked). */
	attackerEnemyDefId?: string;
	attackerEnemyIndex?: number;
	damage?: number;
	damageType?: string; // 'physical' | 'magical' | 'pure'
	abilityId?: string;
	/** Raw damage before resistances (for combat log). */
	rawDamage?: number;
	/** Target armor (physical reduction) for log display. */
	targetArmor?: number;
	/** Target magic resist 0–1 for log display. */
	targetMagicResist?: number;
	/** For death: which side and index. */
	deathTarget?: 'enemy' | 'hero';
	deathIndex?: number;
}

/** Full battle state. All heroes' attack timers advance; only Front Liner spell timer advances. */
export interface BattleState {
	player: HeroInstance[];
	enemy: EnemyInstance[];
	focusedHeroIndex: number;
	targetIndex: number; // index into enemy[] (shared target = who your team attacks)
	enemyFocusedIndex: number; // which enemy is the enemy team's focus (default 0)
	lastFocusChangeAt: number; // seconds since battle start when focus was last changed
	elapsedTime: number; // seconds since battle start
	result: BattleResult;
	/** Combat log for UI; newest at end. Capped at 200 entries. */
	combatLog?: CombatLogEntry[];
	/** Spell rotation: lastCastAbilityIndex per player index (source of truth so rotation persists). */
	lastSpellAbilityIndexByPlayer?: number[];
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
/** Per-node clearance record (extensible: add gold, etc. later). */
export interface NodeClearance {
	outcome: 'victory' | 'skip';
	durationSeconds?: number;
	gold?: number;
	[key: string]: unknown;
}

export interface RunState {
	runId: string;
	status: RunStatus;
	currentNodeId: string;
	/** Node type of current node when available (e.g. COMBAT, BASE). */
	currentNodeType?: string;
	nextNodeIds: string[];
	/** How each cleared node was completed (outcome, duration, etc.). */
	nodeClearances?: Record<string, NodeClearance>;
}
