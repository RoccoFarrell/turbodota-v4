/**
 * Item definition registry for the incremental game.
 * Each item has a unique id (matches IncrementalBankItem.itemDefId),
 * display info, and a usage type that drives the "use item" flow.
 *
 * Add new items here; the use-item API and UI read this registry.
 */

/** What kind of effect this item has when used. */
export type ItemUsageType =
	| 'idle_instant_1h' // Grant 1 hour of idle progress to a chosen action (mining or training)
	| 'none'; // Not usable (display-only, material, etc.)

/** Where this item can be applied (used by UI to show target selector). */
export type ItemTarget = 'mining' | 'training';

export interface ItemDef {
	id: string;
	name: string;
	description: string;
	/** Emoji or character used as the item icon in the inventory grid. */
	icon: string;
	/** How the item is used. Drives the use-item API logic. */
	usageType: ItemUsageType;
	/** Which action types this item can be applied to (if usageType involves targeting). */
	applicableTargets: ItemTarget[];
	/** Whether this item is stackable (most consumables are). */
	stackable: boolean;
}

/** All known item definitions. */
export const ITEM_DEFINITIONS: Record<string, ItemDef> = {
	arcane_rune: {
		id: 'arcane_rune',
		name: 'Arcane Rune',
		description:
			'Grants 1 hour of instant progress to a mining or training action. Earned by playing ranked or turbo Dota 2 games.',
		icon: '✨',
		usageType: 'idle_instant_1h',
		applicableTargets: ['mining', 'training'],
		stackable: true
	}
};

export const ITEM_IDS = Object.keys(ITEM_DEFINITIONS) as readonly string[];

export function getItemDef(itemId: string): ItemDef | undefined {
	return ITEM_DEFINITIONS[itemId];
}
