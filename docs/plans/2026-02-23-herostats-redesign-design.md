# Hero Stats Page Redesign — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Overview

Redesign the `/herostats` page with a "Broadcast Scoreboard" aesthetic (dark esports HUD) and add ranked/turbo/both game mode filtering.

## Audience

Friend group only — the 8 hardcoded players. This is a private leaderboard.

## Aesthetic Direction: Dark Esports HUD

The page should feel like a tournament broadcast stats overlay. Dark backgrounds, angular accents, neon glow effects, bold condensed typography.

## Layout & Components

### Page Header
- Title "HERO STATS" in bold condensed typeface (CSS `font-stretch: condensed` or Google Font like Oswald/Barlow Condensed)
- Subtitle "ONLY THE TRUE KING WILL RULE" as small tracked-out label
- No images (remove turboking/knight)

### Mode Selector (Top, Prominent)
- Three-segment toggle: **RANKED** | **TURBO** | **ALL**
- Active segment: bright accent background (cyan/teal glow)
- Inactive segments: dark/muted
- Top-center, full width on mobile
- Drives `gameMode` field in `sortData` store

### View Toggle (Heroes / Players)
- Slim underline-style tabs below mode selector
- "Heroes" = one row per player with aggregated stats
- "Players" = select a player, see one row per hero

### Filter Bar
- Compact horizontal bar below view toggle
- Pill-style selects: Hero, Role, Start Date, End Date
- Reset button at end
- Single line on desktop, wraps on mobile

### Stats Table
- Dark semi-transparent panel (`bg-surface-900/80`, subtle `backdrop-blur`)
- Column headers: uppercase, condensed font, bottom border accent
- Sortable columns with arrow indicators
- Key cells as colored badges:
  - Win%: red pill < 45%, neutral 45-55%, green > 55%
  - KDA: red pill < 3, white 3-6, green > 6
  - Games count in accent color
- Row hover: subtle glow effect
- Alternating row opacity
- Responsive: mobile shows Player/Hero, Games, Win%, KDA only

### Player Loading Indicators
- Row of circular indicators in header area (one per player)
- Shows player initial, fills with accent color when data loads

## Data Flow Changes

### Store Changes (`sortData.ts`)
- Add `gameMode: 'ranked' | 'turbo' | 'all'` field (default: `'all'`)

### Game Mode Filtering (Client-Side)
- In `recalcTableData()`, add game_mode filter step before existing hero/role/date filters
- Uses existing constants: `GAME_MODE_TURBO = 23`, `GAME_MODES_RANKED = [22, 19]`
- No API or DB changes needed — `game_mode` is already on every `Match` record

### Bug Fixes
- Call `generateMatchStatsArr()` once, not twice (currently called redundantly per tab)
- Filter out 0-game heroes in single-player view

### No API Changes
- Server load function stays the same
- `+page.server.ts` unchanged except minor cleanup
- All filtering is client-side

## Files Changed

| File | Change |
|---|---|
| `src/routes/herostats/+page.svelte` | Full rewrite — new template, script, broadcast styling |
| `src/lib/components/herostats/StatsTable.svelte` | Full rewrite — new table design with badges, glow effects |
| `src/lib/stores/sortData.ts` | Add `gameMode` field |
| `src/routes/herostats/+page.server.ts` | Minimal cleanup only |

## Constants Reference

```typescript
// src/lib/constants/matches.ts
export const GAME_MODE_TURBO = 23;
export const GAME_MODES_RANKED = [22, 19];
```
