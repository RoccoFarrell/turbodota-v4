/**
 * Abstract idle timer: advance by elapsed time and return new progress + completions.
 * No concept of "mining" or "training" – just duration per completion and time.
 * Design: one generic timer that any action type uses; rewards are applied separately.
 */

export interface IdleTimerInput {
	/** Progress within current tick (0..1). */
	progress: number;
	/** Last tick timestamp (ms since epoch). */
	lastTickAt: number;
	/** Current time (ms since epoch). */
	now: number;
	/** Duration in seconds for one completion (bar 0→1). */
	durationPerCompletionSec: number;
	/** Optional rate modifier: effective duration = durationPerCompletionSec / rateModifier. */
	rateModifier?: number;
}

export interface IdleTimerResult {
	/** New progress (0..1). */
	progress: number;
	/** Number of completions in this tick. */
	completions: number;
}

/**
 * Advance the idle timer by elapsed time. Returns new progress and how many
 * completions occurred. Caller applies rewards based on action type.
 */
export function advanceIdleTimer(input: IdleTimerInput): IdleTimerResult {
	const {
		progress,
		lastTickAt,
		now,
		durationPerCompletionSec,
		rateModifier = 1
	} = input;

	const effectiveDurationSec = durationPerCompletionSec / Math.max(0.01, rateModifier);
	const elapsedSec = Math.max(0, (now - lastTickAt) / 1000);

	let remaining = progress * effectiveDurationSec + elapsedSec;
	let completions = 0;

	while (remaining >= effectiveDurationSec) {
		completions += 1;
		remaining -= effectiveDurationSec;
	}

	const newProgress = remaining / effectiveDurationSec;

	return {
		progress: Math.min(1, Math.max(0, newProgress)),
		completions
	};
}
