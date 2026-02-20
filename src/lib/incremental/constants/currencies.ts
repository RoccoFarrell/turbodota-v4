/**
 * Bank currencies for incremental + Dota 2 rewards.
 * Keys are used in the Bank currency store (see docs/incremental/BANK_SYSTEM.md).
 * The Bank holds both these currency balances and item inventory per save.
 */

export type CurrencySource = 'idle' | 'battle' | 'dota2' | 'shop' | 'other';

export interface CurrencyDef {
	id: string;
	name: string;
	description: string;
	/** Path to SVG icon (game-icons.net) for inventory display. */
	icon: string;
	/** Where this currency can be earned (for UI/tooltips). */
	sources: CurrencySource[];
}

const GI = '/game-icons/ffffff/transparent/1x1';

/** All known currencies. Add new entries here; Bank can store any key. */
export const CURRENCIES: Record<string, CurrencyDef> = {
	essence: {
		id: 'essence',
		name: 'Essence',
		description: 'Earned by mining in the idle game. Spend to convert Dota 2 wins into roster heroes.',
		icon: `${GI}/lorc/gems.svg`,
		sources: ['idle']
	},
	loot_coins: {
		id: 'loot_coins',
		name: 'Loot Coins',
		description: 'Earned by winning Dota 2 games on heroes already on your roster. Used for loot rolls and item systems.',
		icon: `${GI}/delapouite/two-coins.svg`,
		sources: ['dota2']
	},
	gold: {
		id: 'gold',
		name: 'Gold',
		description: 'Earned from idle activities, incremental battles, or Dota 2. Used for shops and upgrades.',
		icon: `${GI}/delapouite/gold-stack.svg`,
		sources: ['idle', 'battle', 'dota2']
	},
	wood: {
		id: 'wood',
		name: 'Wood',
		description: 'Earned from idle or battles. Used for building upgrades and crafting.',
		icon: `${GI}/delapouite/log.svg`,
		sources: ['idle', 'battle']
	}
};

export const CURRENCY_IDS = Object.keys(CURRENCIES) as readonly string[];

export type CurrencyKey = (typeof CURRENCY_IDS)[number];

export function getCurrencyDef(key: string): CurrencyDef | undefined {
	return CURRENCIES[key];
}

/** Default balance for a currency when not present in Bank (0). */
export function getDefaultBalance(_key: string): number {
	return 0;
}
