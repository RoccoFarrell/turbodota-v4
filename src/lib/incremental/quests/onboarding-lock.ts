/**
 * Pure function for computing onboarding step lock states.
 * Shared between server logic and tests — no DB dependencies.
 */

/**
 * Given step orders, which are claimed, and which are completed,
 * determine the locked state for each step.
 *
 * A step is locked if:
 * - Its previous step (order - 1) has not been claimed, AND
 * - This step's milestone is not yet completed (catch-up exception)
 *
 * Step 0 is never locked.
 */
export function computeOnboardingLockStates(
	orders: number[],
	claimedOrders: Set<number>,
	completedOrders: Set<number>
): boolean[] {
	return orders.map((order) => {
		if (order === 0) return false;
		const previousClaimed = claimedOrders.has(order - 1);
		const thisCompleted = completedOrders.has(order);
		return !previousClaimed && !thisCompleted;
	});
}
