/**
 * Quest definitions for the Quests feature.
 *
 * Each quest tracks a stat from PlayersMatchDetail and has a threshold.
 * Progress is computed on demand from match data (see quest-progress.server.ts).
 *
 * To add a new quest: append an entry to QUEST_DEFINITIONS.
 * To add a new stat: add a new StatKey and map it in STAT_KEY_TO_COLUMN.
 */

// ---------------------------------------------------------------------------
// Default quest period start (used when first assigning a quest to a save)
// ---------------------------------------------------------------------------

/** Midnight EST on 2026-02-13. Used as startedAt when creating a new IncrementalSaveQuest row. */
export const DEFAULT_QUEST_START_DATE = new Date('2026-02-13T05:00:00.000Z');

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
// Quest definition
// ---------------------------------------------------------------------------

export type QuestScope = 'across_games' | 'single_game';

/** Icon identifier for UI (maps to QuestIcon component). From game-icons.net style. */
export type QuestIconId =
	| 'crosshair'   // last hits
	| 'shield'      // denies
	| 'coins'       // net worth
	| 'sword'       // hero damage
	| 'tower'       // building damage
	| 'heart';      // healing

export interface QuestDef {
	/** Unique identifier persisted in IncrementalSaveQuest.questId. */
	id: string;
	/** Display label shown in UI. */
	label: string;
	/** Icon shown next to the quest (from game-icons.net style). */
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
// Initial quest set (all across_games, reward = 1× Arcane Rune)
// ---------------------------------------------------------------------------

const ARCANE_RUNE_REWARD: QuestReward = {
	item: { itemId: 'arcane_rune', quantity: 1 }
};

export const QUEST_DEFINITIONS: readonly QuestDef[] = [
	{
		id: 'last_hits_1k',
		label: 'Last Hits',
		iconId: 'crosshair',
		statKey: 'last_hits',
		threshold: 1000,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	},
	{
		id: 'denies_100',
		label: 'Denies',
		iconId: 'shield',
		statKey: 'denies',
		threshold: 100,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	},
	{
		id: 'net_worth_150k',
		label: 'Net Worth',
		iconId: 'coins',
		statKey: 'net_worth',
		threshold: 150_000,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	},
	{
		id: 'hero_damage_200k',
		label: 'Hero Damage',
		iconId: 'sword',
		statKey: 'hero_damage',
		threshold: 200_000,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	},
	{
		id: 'building_damage_100k',
		label: 'Building Damage',
		iconId: 'tower',
		statKey: 'tower_damage',
		threshold: 100_000,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	},
	{
		id: 'healing_50k',
		label: 'Healing',
		iconId: 'heart',
		statKey: 'hero_healing',
		threshold: 50_000,
		scope: 'across_games',
		reward: ARCANE_RUNE_REWARD
	}
];

/** Lookup quest by id. */
const questById = new Map(QUEST_DEFINITIONS.map((q) => [q.id, q]));
export function getQuestDef(questId: string): QuestDef | undefined {
	return questById.get(questId);
}

/** All unique stat keys used by current quests (for efficient aggregation). */
export const ACTIVE_STAT_KEYS: readonly StatKey[] = [
	...new Set(QUEST_DEFINITIONS.map((q) => q.statKey))
];

/** Human-readable reward description for display in the UI. */
export function rewardDescription(quest: QuestDef): string {
	if (!quest.reward) return 'No reward';
	const parts: string[] = [];
	if (quest.reward.currency) {
		parts.push(`${quest.reward.currency.amount} ${quest.reward.currency.key}`);
	}
	if (quest.reward.item) {
		const name = quest.reward.item.itemId.replace(/_/g, ' ');
		parts.push(`${quest.reward.item.quantity}× ${name}`);
	}
	return parts.join(' + ') || 'No reward';
}
