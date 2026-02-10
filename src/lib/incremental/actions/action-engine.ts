/**
 * Server-side action engine: given (actionType, progress, lastTickAt, now, rateModifier),
 * compute new progress and number of completions (rewards). Pure logic, no persistence.
 * Design: ESSENCE_AND_BROWSER_ACTIONS.md §2.3.
 */

import {
	ACTION_TYPE_MINING,
	MINING_BASE_DURATION_SEC,
	MINING_ESSENCE_PER_STRIKE
} from './constants';

export type ActionType = typeof ACTION_TYPE_MINING;

export interface ActionTickInput {
	actionType: ActionType;
	progress: number;
	lastTickAt: number; // ms since epoch
	now: number; // ms since epoch
	rateModifier?: number;
}

export interface ActionTickResult {
	progress: number;
	completions: number;
	essenceEarned: number;
}

function getEffectiveDurationSec(actionType: ActionType, rateModifier: number): number {
	if (actionType === ACTION_TYPE_MINING) {
		return MINING_BASE_DURATION_SEC / Math.max(0.01, rateModifier);
	}
	return MINING_BASE_DURATION_SEC / Math.max(0.01, rateModifier);
}

/**
 * Advance action by elapsed time. Returns new progress (0..1), number of completions
 * in this tick, and Essence earned (for mining).
 */
export function advanceAction(input: ActionTickInput): ActionTickResult {
	const {
		actionType,
		progress,
		lastTickAt,
		now,
		rateModifier = 1
	} = input;

	const effectiveDurationSec = getEffectiveDurationSec(actionType, rateModifier);
	const elapsedSec = Math.max(0, (now - lastTickAt) / 1000);

	// How much "progress time" we have: current progress segment + elapsed
	let remaining = progress * effectiveDurationSec + elapsedSec;
	let completions = 0;

	while (remaining >= effectiveDurationSec) {
		completions += 1;
		remaining -= effectiveDurationSec;
	}

	const newProgress = remaining / effectiveDurationSec;
	const essenceEarned =
		actionType === ACTION_TYPE_MINING ? completions * MINING_ESSENCE_PER_STRIKE : 0;

	return {
		progress: Math.min(1, Math.max(0, newProgress)),
		completions,
		essenceEarned
	};
}
