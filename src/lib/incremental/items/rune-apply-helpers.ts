/**
 * Pure utility functions for the Arcane Rune "apply mode" feature.
 * Used by both scavenging and barracks pages.
 */

/** Extract arcane rune quantity from bank inventory data. */
export function getArcaneRuneQty(
	inventory: Array<{ itemDefId: string; quantity: number }>
): number {
	return inventory.find((i) => i.itemDefId === 'arcane_rune')?.quantity ?? 0;
}

/** Format toast message after successful mining rune application. */
export function formatMiningRuneToast(completions: number): {
	title: string;
	description: string;
} {
	return {
		title: 'Arcane Rune applied!',
		description: `1 hr instant progress · ${completions.toLocaleString()} completions · +${completions.toLocaleString()} Essence`
	};
}

/** Format toast message after successful training rune application. */
export function formatTrainingRuneToast(
	completions: number,
	statName: string,
	heroName: string,
	newTotal: number,
	effectiveStatLabel?: string
): { title: string; description: string } {
	const statInfo = effectiveStatLabel
		? `+${completions.toLocaleString()} XP on ${heroName} (${effectiveStatLabel})`
		: `+${completions.toLocaleString()} ${statName} XP on ${heroName} (${newTotal.toLocaleString()} XP)`;
	return {
		title: 'Arcane Rune applied!',
		description: `1 hr instant progress · ${completions.toLocaleString()} completions · ${statInfo}`
	};
}

/** Determine rune card CSS classes based on apply mode state. */
export function runeTargetClasses(
	runeApplyMode: boolean,
	isValidTarget: boolean
): string {
	if (!runeApplyMode) return '';
	if (isValidTarget) {
		return 'relative z-50 cursor-pointer';
	}
	return 'opacity-30 pointer-events-none';
}

/** Determine if a barracks building should auto-apply (has active slot with heroId) or show picker. */
export function shouldAutoApply(
	activeSlot: { actionHeroId?: number | null } | undefined
): { autoApply: boolean; heroId: number | null } {
	if (!activeSlot || activeSlot.actionHeroId == null) {
		return { autoApply: false, heroId: null };
	}
	return { autoApply: true, heroId: activeSlot.actionHeroId };
}
