/**
 * Quest definitions for the Quests feature — recurring and onboarding types.
 *
 * Recurring quests: track PlayersMatchDetail stats, repeatable, reward = Essence + Arcane Rune.
 * Onboarding quests: track game-state milestones, claimed once, sequential unlock.
 *
 * To add a recurring quest: append to QUEST_DEFINITIONS.
 * To add an onboarding quest: append to ONBOARDING_DEFINITIONS.
 * To add a new stat: add a new StatKey and map it in STAT_KEY_TO_COLUMN.
 */

// ---------------------------------------------------------------------------
// Quest type discriminator
// ---------------------------------------------------------------------------

export type QuestType = 'recurring' | 'onboarding' | 'one_time';

// ---------------------------------------------------------------------------
// Stat keys — the subset of PlayersMatchDetail columns we can track
// ---------------------------------------------------------------------------

/** Valid stat keys that map to PlayersMatchDetail columns. */
export type StatKey =
	| 'last_hits'
	| 'denies'
	| 'net_worth'
	| 'hero_damage'
	| 'tower_damage'
	| 'hero_healing';

/**
 * Map from StatKey to the actual column name in PlayersMatchDetail.
 * All keys currently map 1:1, but this indirection lets us rename or alias later.
 */
export const STAT_KEY_TO_COLUMN: Record<StatKey, string> = {
	last_hits: 'last_hits',
	denies: 'denies',
	net_worth: 'net_worth',
	hero_damage: 'hero_damage',
	tower_damage: 'tower_damage',
	hero_healing: 'hero_healing'
};

/** Stat keys whose DB column is nullable (Int?) — use 0 when null. */
export const NULLABLE_STAT_KEYS: ReadonlySet<StatKey> = new Set([
	'hero_damage',
	'tower_damage',
	'hero_healing'
]);

// ---------------------------------------------------------------------------
// Reward shape
// ---------------------------------------------------------------------------

export interface QuestCurrencyReward {
	key: string; // e.g. "essence"
	amount: number;
}

export interface QuestItemReward {
	itemId: string; // e.g. "arcane_rune"; matches item-definitions.ts id
	quantity: number;
}

export interface QuestReward {
	currency?: QuestCurrencyReward;
	item?: QuestItemReward;
}

// ---------------------------------------------------------------------------
// Recurring quest definition (match-stat based)
// ---------------------------------------------------------------------------

export type QuestScope = 'across_games' | 'single_game';

/** Icon identifier for UI (maps to QuestIcon component). */
export type QuestIconId =
	| 'crosshair' // last hits
	| 'shield' // denies
	| 'coins' // net worth
	| 'sword' // hero damage
	| 'tower' // building damage
	| 'heart' // healing
	| 'pickaxe' // scavenge
	| 'users' // recruit
	| 'swords' // lineup
	| 'portal'; // rift

export interface QuestDef {
	/** Unique identifier persisted in IncrementalSaveQuest.questId. */
	id: string;
	/** Quest type discriminator. */
	type: 'recurring';
	/** Display label shown in UI. */
	label: string;
	/** Icon shown next to the quest. */
	iconId?: QuestIconId;
	/** Which stat from PlayersMatchDetail to aggregate. */
	statKey: StatKey;
	/** Value the aggregated stat must reach (sum for across_games, max for single_game). */
	threshold: number;
	/** How to aggregate: sum across all matches or max in a single match. */
	scope: QuestScope;
	/** Reward granted on claim. If omitted, no reward (display-only). */
	reward?: QuestReward;
}

// ---------------------------------------------------------------------------
// Onboarding quest definition (game-state milestone based)
// ---------------------------------------------------------------------------

/** Check keys map to server-side check functions in onboarding-progress.server.ts. */
export type OnboardingCheckKey =
	| 'has_mining_action'
	| 'has_roster_hero'
	| 'has_lineup'
	| 'has_run';

export interface OnboardingDef {
	/** Unique identifier persisted in IncrementalSaveQuest.questId. */
	id: string;
	/** Quest type discriminator. */
	type: 'onboarding';
	/** Display label shown in UI. */
	label: string;
	/** Description shown below the label in the Journey section. */
	description: string;
	/** Icon shown next to the quest. */
	iconId?: QuestIconId;
	/** Zero-based position in the unlock sequence. */
	order: number;
	/** Key that maps to a server-side completion check function. */
	checkKey: OnboardingCheckKey;
	/** Navigation link to the relevant page (e.g. "/darkrift/scavenging"). */
	navLink: string;
	/** Reward granted on claim. */
	reward?: QuestReward;
}

// ---------------------------------------------------------------------------
// Union type for "any quest definition"
// ---------------------------------------------------------------------------

export type AnyQuestDef = QuestDef | OnboardingDef;

// ---------------------------------------------------------------------------
// Recurring quest data (reward = Essence + Arcane Rune)
// ---------------------------------------------------------------------------

const RECURRING_REWARD: QuestReward = {
	currency: { key: 'essence', amount: 50 },
	item: { itemId: 'arcane_rune', quantity: 1 }
};

export const QUEST_DEFINITIONS: readonly QuestDef[] = [
	{
		id: 'last_hits_1k',
		type: 'recurring',
		label: 'Last Hits',
		iconId: 'crosshair',
		statKey: 'last_hits',
		threshold: 1000,
		scope: 'across_games',
		reward: RECURRING_REWARD
	},
	{
		id: 'denies_100',
		type: 'recurring',
		label: 'Denies',
		iconId: 'shield',
		statKey: 'denies',
		threshold: 100,
		scope: 'across_games',
		reward: RECURRING_REWARD
	},
	{
		id: 'net_worth_150k',
		type: 'recurring',
		label: 'Net Worth',
		iconId: 'coins',
		statKey: 'net_worth',
		threshold: 150_000,
		scope: 'across_games',
		reward: RECURRING_REWARD
	},
	{
		id: 'hero_damage_200k',
		type: 'recurring',
		label: 'Hero Damage',
		iconId: 'sword',
		statKey: 'hero_damage',
		threshold: 200_000,
		scope: 'across_games',
		reward: RECURRING_REWARD
	},
	{
		id: 'building_damage_100k',
		type: 'recurring',
		label: 'Building Damage',
		iconId: 'tower',
		statKey: 'tower_damage',
		threshold: 100_000,
		scope: 'across_games',
		reward: RECURRING_REWARD
	},
	{
		id: 'healing_50k',
		type: 'recurring',
		label: 'Healing',
		iconId: 'heart',
		statKey: 'hero_healing',
		threshold: 50_000,
		scope: 'across_games',
		reward: RECURRING_REWARD
	}
];

// ---------------------------------------------------------------------------
// Onboarding quest data
// ---------------------------------------------------------------------------

export const ONBOARDING_DEFINITIONS: readonly OnboardingDef[] = [
	{
		id: 'onboarding_scavenge',
		type: 'onboarding',
		order: 0,
		label: 'Scavenge for Essence',
		description: 'Start mining to gather Essence.',
		iconId: 'pickaxe',
		checkKey: 'has_mining_action',
		navLink: '/darkrift/scavenging',
		reward: { currency: { key: 'essence', amount: 100 } }
	},
	{
		id: 'onboarding_recruit',
		type: 'onboarding',
		order: 1,
		label: 'Recruit a Hero',
		description: 'Unlock a hero in the Tavern.',
		iconId: 'users',
		checkKey: 'has_roster_hero',
		navLink: '/darkrift/tavern',
		reward: { currency: { key: 'essence', amount: 200 } }
	},
	{
		id: 'onboarding_lineup',
		type: 'onboarding',
		order: 2,
		label: 'Build a Lineup',
		description: 'Assemble your battle team.',
		iconId: 'swords',
		checkKey: 'has_lineup',
		navLink: '/darkrift/lineup',
		reward: { currency: { key: 'essence', amount: 300 } }
	},
	{
		id: 'onboarding_rift',
		type: 'onboarding',
		order: 3,
		label: 'Enter the Dark Rift',
		description: 'Begin your first run.',
		iconId: 'portal',
		checkKey: 'has_run',
		navLink: '/darkrift/rift',
		reward: { currency: { key: 'essence', amount: 500 } }
	}
];

// ---------------------------------------------------------------------------
// Merged registry
// ---------------------------------------------------------------------------

const ALL_DEFS = new Map<string, AnyQuestDef>([
	...QUEST_DEFINITIONS.map((q) => [q.id, q] as const),
	...ONBOARDING_DEFINITIONS.map((q) => [q.id, q] as const)
]);

/** Lookup any quest definition by id. */
export function getQuestDef(questId: string): AnyQuestDef | undefined {
	return ALL_DEFS.get(questId);
}

/** Lookup recurring quest only. Returns undefined for onboarding quests. */
export function getRecurringDef(questId: string): QuestDef | undefined {
	const def = ALL_DEFS.get(questId);
	return def?.type === 'recurring' ? def : undefined;
}

/** Lookup onboarding quest only. Returns undefined for recurring quests. */
export function getOnboardingDef(questId: string): OnboardingDef | undefined {
	const def = ALL_DEFS.get(questId);
	return def?.type === 'onboarding' ? def : undefined;
}

/** All unique stat keys used by current quests (for efficient aggregation). */
export const ACTIVE_STAT_KEYS: readonly StatKey[] = [
	...new Set(QUEST_DEFINITIONS.map((q) => q.statKey))
];

/** Human-readable reward description for display in the UI. */
export function rewardDescription(reward: QuestReward | undefined): string {
	if (!reward) return 'No reward';
	const parts: string[] = [];
	if (reward.currency) {
		parts.push(`${reward.currency.amount} ${reward.currency.key}`);
	}
	if (reward.item) {
		const name = reward.item.itemId.replace(/_/g, ' ');
		parts.push(`${reward.item.quantity}× ${name}`);
	}
	return parts.join(' + ') || 'No reward';
}
