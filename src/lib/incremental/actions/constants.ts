/**
 * Mining and action constants for Phase 6 (Essence, browser actions).
 * Design: ESSENCE_AND_BROWSER_ACTIONS.md
 */

export const ACTION_TYPE_MINING = 'mining' as const;

/** Base duration in seconds for one mining strike (bar 0→1). */
export const MINING_BASE_DURATION_SEC = 3;

/** Essence granted per completed mining strike. */
export const MINING_ESSENCE_PER_STRIKE = 1;

/** Essence cost to convert one win from last 10 games into a roster hero. */
export const CONVERT_WIN_ESSENCE_COST = 10;
