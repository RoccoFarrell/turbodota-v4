# Barracks Training CTA & Cancel Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the "Select hero to train" button prominent with Dark Rift theming, and surface a cancel-training modal when all slots are full.

**Architecture:** Restyle the existing toggle button in `BarracksBuildingCard.svelte` to a prominent CTA. Create a new `CancelTrainingModal.svelte` (Skeleton UI Dialog) that lists active training slots and lets the user cancel one. Wire the modal into the barracks page so clicking the CTA when slots are full opens the modal instead of showing a toast.

**Tech Stack:** Svelte 5, Skeleton UI v4 Dialog, Tailwind CSS v4, Vitest

---

### Task 1: Create CancelTrainingModal component

**Files:**
- Create: `src/lib/incremental/components/CancelTrainingModal.svelte`

**Step 1: Create the modal component**

```svelte
<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { TRAINING_BUILDINGS, type TrainingStatKey } from '$lib/incremental/actions/constants';
	import type { SlotState } from '$lib/incremental/stores/action-slots.svelte';

	interface Props {
		open: boolean;
		onOpenChange: (details: { open: boolean }) => void;
		slots: SlotState[];
		heroName: (id: number, fallback?: string) => string;
		slotDisplayProgress: (slot: SlotState) => number;
		onCancel: (slotIndex: number) => void;
	}

	let {
		open,
		onOpenChange,
		slots,
		heroName,
		slotDisplayProgress,
		onCancel
	}: Props = $props();

	const trainingSlots = $derived(
		slots.filter((s) => s.actionType === 'training' && s.actionStatKey != null)
	);

	function handleCancel(slotIndex: number) {
		onCancel(slotIndex);
		onOpenChange({ open: false });
	}
</script>

<Dialog {open} {onOpenChange}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
				<div class="text-center">
					<Dialog.Title class="text-lg font-bold text-gray-900 dark:text-gray-100">
						All Training Slots Occupied
					</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Cancel an active training to free a slot.
					</Dialog.Description>
				</div>

				<div class="space-y-2">
					{#each trainingSlots as slot}
						{@const building = TRAINING_BUILDINGS[slot.actionStatKey as TrainingStatKey]}
						{@const prog = slotDisplayProgress(slot)}
						<div class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
							<span
								class="gi w-5 h-5 shrink-0 {building?.color ?? 'text-gray-400'}"
								style="--gi: url({building?.icon})"
								aria-hidden="true"
							></span>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
									{slot.actionHeroId != null ? heroName(slot.actionHeroId) : 'Unknown'}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{building?.name ?? slot.actionStatKey} · {Math.round(prog * 100)}%
								</p>
							</div>
							<button
								type="button"
								onclick={() => handleCancel(slot.slotIndex)}
								class="shrink-0 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
							>
								Cancel
							</button>
						</div>
					{/each}
				</div>

				<Dialog.CloseTrigger
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					Nevermind
				</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
```

**Step 2: Verify it renders**

Run: `npm run check`
Expected: No new type errors from this file.

---

### Task 2: Restyle the "Select hero to train" button in BarracksBuildingCard

**Files:**
- Modify: `src/lib/incremental/components/BarracksBuildingCard.svelte`

**Step 1: Add a new prop and callback for "all slots full"**

Add to the Props interface:

```typescript
onRequestSlot?: () => void;
```

Add to destructured props:

```typescript
onRequestSlot,
```

**Step 2: Replace the plain text toggle button (lines 180-187)**

Replace the existing button:
```svelte
<button
	type="button"
	onclick={() => showPicker = !showPicker}
	class="w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
>
	<span>{showPicker ? '▾' : '▸'}</span>
	{selectedHeroId != null ? heroName(selectedHeroId) : 'Select hero to train…'}
</button>
```

With the new prominent CTA:
```svelte
<button
	type="button"
	onclick={() => {
		if (!hasFreeSlot) {
			onRequestSlot?.();
			return;
		}
		showPicker = !showPicker;
	}}
	class="w-full rounded-lg border-l-4 px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-2
		{building.color.replace('text-', 'border-')}
		bg-gray-100 dark:bg-gray-700/50
		text-gray-700 dark:text-gray-200
		hover:bg-gray-200 dark:hover:bg-gray-600/50"
>
	<span class="gi w-5 h-5 {building.color}" style="--gi: url({building.icon})" aria-hidden="true"></span>
	{#if selectedHeroId != null}
		{heroName(selectedHeroId)}
	{:else}
		Select Hero to Train
	{/if}
</button>
```

**Step 3: Remove the "No free slots" disabled state and link from the Train button section**

Replace the block at lines 202-218 (the Train button + the no-free-slots message) with just the Train button that is shown only when a hero is selected:

```svelte
{#if selectedHeroId != null && hasFreeSlot}
	<button
		type="button"
		onclick={handleTrain}
		class="w-full rounded-lg py-2 text-sm font-medium transition-colors
			bg-primary text-primary-foreground hover:opacity-90"
	>
		Train
	</button>
{/if}
```

The "No free slots" path is now handled by opening the cancel modal via `onRequestSlot`, so no need for the disabled button or the "Unlock more slots" message here.

**Step 4: Verify**

Run: `npm run check`
Expected: No new type errors.

---

### Task 3: Wire the modal into the barracks page

**Files:**
- Modify: `src/routes/darkrift/barracks/+page.svelte`

**Step 1: Import CancelTrainingModal and add state**

Add import:
```typescript
import CancelTrainingModal from '$lib/incremental/components/CancelTrainingModal.svelte';
```

Add state variables (after existing local state declarations around line 44):
```typescript
let cancelModalOpen = $state(false);
let pendingBuildingStatKey = $state<TrainingStatKey | null>(null);
```

**Step 2: Add handler for slot request**

Add function (after `handleClearSlot`):
```typescript
function handleRequestSlot(statKey: TrainingStatKey) {
	pendingBuildingStatKey = statKey;
	cancelModalOpen = true;
}

async function handleCancelFromModal(slotIndex: number) {
	await actionStore.clearSlot(slotIndex);
	cancelModalOpen = false;
}
```

**Step 3: Pass onRequestSlot to BarracksBuildingCard**

In the `<BarracksBuildingCard>` usage (around line 263), add the new prop:
```svelte
onRequestSlot={() => handleRequestSlot(statKey)}
```

**Step 4: Add the CancelTrainingModal to the template**

After the rune apply mode overlay (end of file), add:
```svelte
<CancelTrainingModal
	open={cancelModalOpen}
	onOpenChange={(d) => { cancelModalOpen = d.open; }}
	{slots}
	{heroName}
	slotDisplayProgress={actionStore.slotDisplayProgress}
	onCancel={handleCancelFromModal}
/>
```

**Step 5: Verify**

Run: `npm run check`
Expected: No new type errors.

---

### Task 4: Write tests

**Files:**
- Create: `src/lib/incremental/components/CancelTrainingModal.test.ts`

**Step 1: Write unit tests for the cancel modal**

```typescript
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
		cancelBtn?.click();

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
```

**Step 2: Run the tests**

Run: `npx vitest run src/lib/incremental/components/CancelTrainingModal.test.ts`
Expected: All 3 tests pass.

---

### Task 5: Commit

**Step 1: Commit all changes**

```bash
git add src/lib/incremental/components/CancelTrainingModal.svelte \
       src/lib/incremental/components/CancelTrainingModal.test.ts \
       src/lib/incremental/components/BarracksBuildingCard.svelte \
       src/routes/darkrift/barracks/+page.svelte
git commit -m "feat: prominent training CTA button with cancel-training modal for full slots"
```
