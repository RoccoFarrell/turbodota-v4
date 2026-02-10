/**
 * Server-side action engine: delegates to abstract idle timer + action definitions.
 * Returns same result shape for backwards compatibility; reward application is in action-definitions.
 */

import { advanceIdleTimer } from './idle-timer';
import { getActionDef, MINING_ACTION_ID, TRAINING_ACTION_ID } from './action-definitions';
import { ACTION_TYPE_MINING, ACTION_TYPE_TRAINING } from './constants';

export type ActionType = typeof ACTION_TYPE_MINING | typeof ACTION_TYPE_TRAINING;

export interface ActionTickInput {
	actionType: ActionType;
	progress: number;
	lastTickAt: number;
	now: number;
	rateModifier?: number;
}

export interface ActionTickResult {
	progress: number;
	completions: number;
	essenceEarned: number;
	trainingCompletions: number;
}

/**
 * Advance action by elapsed time using the abstract idle timer.
 * essenceEarned/trainingCompletions are derived from action type and completions (for backwards compat).
 */
export function advanceAction(input: ActionTickInput): ActionTickResult {
	const { actionType, progress, lastTickAt, now, rateModifier = 1 } = input;
	const def = getActionDef(actionType);
	const durationPerCompletionSec = def?.durationPerCompletionSec ?? 5;

	const { progress: newProgress, completions } = advanceIdleTimer({
		progress,
		lastTickAt,
		now,
		durationPerCompletionSec,
		rateModifier
	});

	const essenceEarned = actionType === MINING_ACTION_ID ? completions * 1 : 0;
	const trainingCompletions = actionType === TRAINING_ACTION_ID ? completions : 0;

	return {
		progress: newProgress,
		completions,
		essenceEarned,
		trainingCompletions
	};
}
