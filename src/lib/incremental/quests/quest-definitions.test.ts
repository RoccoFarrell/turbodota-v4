import { describe, it, expect } from 'vitest';
import {
	getQuestDef,
	getRecurringDef,
	getOnboardingDef,
	rewardDescription,
	QUEST_DEFINITIONS,
	ONBOARDING_DEFINITIONS
} from './quest-definitions';

describe('quest-definitions', () => {
	it('getQuestDef returns recurring def by id', () => {
		const def = getQuestDef('last_hits_1k');
		expect(def).toBeDefined();
		expect(def?.type).toBe('recurring');
	});

	it('getQuestDef returns onboarding def by id', () => {
		const def = getQuestDef('onboarding_recruit');
		expect(def).toBeDefined();
		expect(def?.type).toBe('onboarding');
	});

	it('getQuestDef returns undefined for unknown id', () => {
		expect(getQuestDef('does_not_exist')).toBeUndefined();
	});

	it('getRecurringDef returns undefined for onboarding id', () => {
		expect(getRecurringDef('onboarding_scavenge')).toBeUndefined();
	});

	it('getOnboardingDef returns undefined for recurring id', () => {
		expect(getOnboardingDef('last_hits_1k')).toBeUndefined();
	});

	it('all quest ids are unique across both definition arrays', () => {
		const allIds = [
			...QUEST_DEFINITIONS.map((d) => d.id),
			...ONBOARDING_DEFINITIONS.map((d) => d.id)
		];
		expect(new Set(allIds).size).toBe(allIds.length);
	});

	it('onboarding steps have contiguous order values starting at 0', () => {
		const orders = ONBOARDING_DEFINITIONS.map((d) => d.order).sort((a, b) => a - b);
		orders.forEach((order, idx) => expect(order).toBe(idx));
	});

	it('all onboarding steps have navLink', () => {
		for (const def of ONBOARDING_DEFINITIONS) {
			expect(def.navLink).toBeTruthy();
		}
	});

	it('recurring rewards include both essence and arcane rune', () => {
		for (const def of QUEST_DEFINITIONS) {
			expect(def.reward?.currency?.key).toBe('essence');
			expect(def.reward?.item?.itemId).toBe('arcane_rune');
		}
	});

	it('onboarding rewards are essence only', () => {
		for (const def of ONBOARDING_DEFINITIONS) {
			expect(def.reward?.currency?.key).toBe('essence');
			expect(def.reward?.item).toBeUndefined();
		}
	});

	it('rewardDescription formats currency only', () => {
		const desc = rewardDescription({ currency: { key: 'essence', amount: 100 } });
		expect(desc).toBe('100 essence');
	});

	it('rewardDescription formats both currency and item', () => {
		const desc = rewardDescription({
			currency: { key: 'essence', amount: 50 },
			item: { itemId: 'arcane_rune', quantity: 1 }
		});
		expect(desc).toBe('50 essence + 1\u00d7 arcane rune');
	});

	it('rewardDescription returns "No reward" for undefined', () => {
		expect(rewardDescription(undefined)).toBe('No reward');
	});
});
