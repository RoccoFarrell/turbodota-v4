/**
 * Onboarding progress service — checks game state to determine which
 * onboarding milestones a save has met, without storing progress in DB.
 * Server-only (uses Prisma directly).
 */

import prisma from '$lib/server/prisma';
import { ONBOARDING_DEFINITIONS, type OnboardingCheckKey } from './quest-definitions';
export { computeOnboardingLockStates } from './onboarding-lock';

export interface OnboardingProgress {
	questId: string;
	/** Always 0 or 1 — onboarding quests are binary. */
	current: number;
	/** Always 1. */
	threshold: number;
	completed: boolean;
}

type CheckFn = (saveId: string) => Promise<boolean>;

/**
 * Dispatch table: one entry per OnboardingCheckKey.
 * Uses COUNT queries for efficiency.
 */
const CHECK_FNS: Record<OnboardingCheckKey, CheckFn> = {
	has_mining_action: async (saveId) => {
		const [slotCount, historyCount] = await Promise.all([
			prisma.incrementalActionSlot.count({
				where: { saveId, actionType: 'mining' }
			}),
			prisma.incrementalActionHistory.count({
				where: { saveId, actionType: 'mining' }
			})
		]);
		return slotCount > 0 || historyCount > 0;
	},

	has_roster_hero: async (saveId) => {
		const count = await prisma.incrementalRosterHero.count({ where: { saveId } });
		return count > 0;
	},

	has_lineup: async (saveId) => {
		const count = await prisma.incrementalLineup.count({ where: { saveId } });
		return count > 0;
	},

	has_run: async (saveId) => {
		const count = await prisma.incrementalRun.count({
			where: { lineup: { saveId } }
		});
		return count > 0;
	}
};

/**
 * Compute onboarding progress for all steps for the given save.
 * Runs all checks in parallel.
 */
export async function getOnboardingProgress(saveId: string): Promise<OnboardingProgress[]> {
	const results = await Promise.all(
		ONBOARDING_DEFINITIONS.map(async (def) => {
			const checkFn = CHECK_FNS[def.checkKey];
			const completed = await checkFn(saveId);
			return {
				questId: def.id,
				current: completed ? 1 : 0,
				threshold: 1,
				completed
			};
		})
	);
	return results;
}

