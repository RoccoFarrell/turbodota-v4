# Bottom Bar + Inventory Modal Design

**Date:** 2026-02-21
**Status:** Approved

## Summary

Replace the existing conditional action-slot bottom bar in the incremental layout with a unified, always-visible bottom bar. The bar shows compact training/scavenging progress on the left and a backpack icon on the right that opens an inventory modal sliding up from the bottom.

## Requirements

1. **Bottom bar** — always visible on all incremental pages (including barracks/scavenging)
2. **Action progress** — condensed progress indicators for each active slot (thin colored bar + label). When no slots are active, show link buttons to Barracks and Scavenging.
3. **Backpack icon** — opens an inventory modal that slides up from the bottom
4. **Inventory modal** — reuses existing inventory UI (currency grid + item grid + description panel). Skeleton `Dialog`, anchored to bottom, max-height ~70vh.
5. **Keep existing inventory route** — for future complex inventory management / upgrades

## Design

### Bottom Bar (`BottomBar.svelte`)

- Pinned to bottom of incremental layout, ~48px tall, `border-t`, dark surface background
- Flex row with two zones:
  - **Left (`flex-1`): Action Status**
    - Active slots: compact horizontal progress bars (4px tall, colored by action type) with truncated label (hero name or action name). Tapping navigates to management page.
    - No active slots: two pill link buttons — "Barracks" and "Scavenging"
  - **Right (~44px): Backpack Icon Button**
    - Uses `fi fi-rr-briefcase` icon
    - Toggles inventory modal open/closed

### Inventory Modal

- Skeleton `Dialog` anchored to bottom of viewport
- Slides up via CSS transform transition
- Rounded top corners, backdrop overlay
- Max-height ~70vh, scrollable content
- Renders shared `InventoryPanel` component (extracted from existing inventory page)
- Dismissable via backdrop tap or X button
- Data sourced from existing `actionStore` bank state — no additional API calls

### Component Extraction

- **New `InventoryPanel.svelte`** — currency grid + item grid + description panel, extracted from `/incremental/inventory/+page.svelte`
- **New `BottomBar.svelte`** — unified bottom bar
- **Modified `/incremental/inventory/+page.svelte`** — thin wrapper rendering `InventoryPanel` with page-level chrome

### Layout Changes (`/incremental/+layout.svelte`)

- Remove existing conditional bottom bar (`{#if slots.length > 0 && !isSlotManagementPage}`)
- Render `BottomBar` unconditionally
- Inventory modal `open` state lives in layout, passed to `BottomBar`
- `BottomBar` receives action store state as props

### No Changes To

- `action-slots.svelte.ts` — no new store state needed
- Barracks/scavenging pages — keep their own inline `ActionSlotBar` components
- API routes — no new endpoints
