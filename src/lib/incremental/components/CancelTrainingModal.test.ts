import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CancelTrainingModal from './CancelTrainingModal.svelte';
import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';

function makeSlot(overrides: Partial<SlotState> = {}): SlotState {
	return {
		slotIndex: 0,
		actionType: 'training',
		progress: 0.5,
		lastTickAt: Date.now(),
		actionHeroId: 1,
		actionStatKey: 'hp',
		partyHeroIds: [],
		...overrides
	};
}

describe('CancelTrainingModal', () => {
	it('renders active training slots when open', () => {
		const slots = [
			makeSlot({ slotIndex: 0, actionHeroId: 1, actionStatKey: 'hp' }),
			makeSlot({ slotIndex: 1, actionHeroId: 2, actionStatKey: 'armor' })
		];

		render(CancelTrainingModal, {
			props: {
				open: true,
				onOpenChange: vi.fn(),
				slots,
				heroName: (id: number) => `Hero ${id}`,
				slotDisplayProgress: () => 0.5,
				onCancel: vi.fn()
			}
		});

		expect(screen.getByText('All Training Slots Occupied')).toBeTruthy();
		expect(screen.getByText('Hero 1')).toBeTruthy();
		expect(screen.getByText('Hero 2')).toBeTruthy();
	});

	it('calls onCancel with the correct slot index when Cancel is clicked', async () => {
		const onCancel = vi.fn();
		const slots = [makeSlot({ slotIndex: 0, actionHeroId: 1, actionStatKey: 'hp' })];

		render(CancelTrainingModal, {
			props: {
				open: true,
				onOpenChange: vi.fn(),
				slots,
				heroName: (id: number) => `Hero ${id}`,
				slotDisplayProgress: () => 0.5,
				onCancel
			}
		});

		const cancelBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Cancel');
		expect(cancelBtn).toBeDefined();
		cancelBtn!.click();

		expect(onCancel).toHaveBeenCalledWith(0);
	});

	it('filters to only training slots', () => {
		const slots = [
			makeSlot({ slotIndex: 0, actionType: 'mining', actionStatKey: null }),
			makeSlot({ slotIndex: 1, actionType: 'training', actionHeroId: 3, actionStatKey: 'armor' })
		];

		render(CancelTrainingModal, {
			props: {
				open: true,
				onOpenChange: vi.fn(),
				slots,
				heroName: (id: number) => `Hero ${id}`,
				slotDisplayProgress: () => 0.5,
				onCancel: vi.fn()
			}
		});

		expect(screen.getByText('Hero 3')).toBeTruthy();
		expect(screen.queryByText('Hero 0')).toBeNull();
	});
});
