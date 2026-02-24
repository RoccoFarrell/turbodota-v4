# Barracks Training CTA & Cancel Modal

## Problem
The "Select hero to train…" button is a plain gray collapsible text that blends into the background. When all training slots are full, the user gets a toast error with no way to free a slot.

## Design

### Prominent CTA Button
- Replace plain text toggle in `BarracksBuildingCard.svelte` with a full-width styled button
- Use each building's stat color as accent (border/glow): red for HP, orange for attack_damage, etc.
- Dark background (`bg-gray-800`), stat-colored left border or subtle ring
- Icon + bold "Select Hero to Train" text
- When hero already selected (pre-train): show hero name on the button instead

### "All Slots Full" Cancel Modal
- New component: `CancelTrainingModal.svelte`
- Follows existing `UseItemModal` Dialog pattern (Skeleton UI Dialog, dark backdrop)
- Triggered when user clicks CTA but `findFreeSlotIndex()` returns null
- Title: "All Training Slots Occupied"
- Body: list of active training slots showing building name, hero name, progress %
- Each slot row has a "Cancel Training" button
- After cancelling a slot, modal closes and hero picker opens on the original building
- "Nevermind" close button at bottom

### Files Changed
1. `src/lib/incremental/components/BarracksBuildingCard.svelte` — restyle select button
2. `src/lib/incremental/components/CancelTrainingModal.svelte` — new modal component
3. `src/routes/darkrift/barracks/+page.svelte` — wire modal state and cancellation flow
