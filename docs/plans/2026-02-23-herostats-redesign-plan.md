# Hero Stats Broadcast Scoreboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `/herostats` page as a dark esports broadcast scoreboard with ranked/turbo/all game mode filtering.

**Architecture:** Client-side only changes. Extract match aggregation logic into a testable utility module. Add `gameMode` filter to the existing `sortData` store. Full visual rewrite of page and table components using Tailwind + scoped CSS for broadcast HUD aesthetic. No API or DB changes — `game_mode` is already on every `Match` record.

**Tech Stack:** SvelteKit, Svelte 5, Tailwind CSS v4, Skeleton UI v4 (crimson theme), Vitest

---

### Task 1: Add `gameMode` to the sortData Store

**Files:**
- Modify: `src/lib/stores/sortData.ts`

**Step 1: Update the store interface and initial state**

Add `gameMode` to the `SortData` interface and the writable's initial value:

```typescript
interface SortData {
    startDate: Date,
    endDate: Date,
    role: string,
    heroID: number,
    selectedPlayer: string,
    sortHeader: "Games",
    gameMode: 'ranked' | 'turbo' | 'all'
}
```

In `createSortData()`, add `gameMode: "all"` to the initial writable state (line 13) and to the `reset()` function (line 52). Add a setter:

```typescript
setGameMode: (input: 'ranked' | 'turbo' | 'all') => update(n => ({
    ...n,
    gameMode: input
})),
```

**Step 2: Verify the dev server still starts**

Run: `npm run dev` (quick check, ctrl+C after it starts)

**Step 3: Commit**

```
feat(herostats): add gameMode field to sortData store
```

---

### Task 2: Extract Match Aggregation into a Testable Utility

**Files:**
- Create: `src/lib/helpers/herostats.ts`
- Create: `src/lib/helpers/herostats.test.ts`

This task extracts the filtering and aggregation logic currently inlined in `+page.svelte` (`recalcTableData`) into a pure, testable function.

**Step 1: Write the failing tests**

Create `src/lib/helpers/herostats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { aggregateStats, filterMatchesByGameMode } from './herostats';
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';

// Factory for creating mock match data
function makeMock(overrides: Partial<Match> = {}): Match {
    return {
        id: 1,
        match_id: BigInt(1),
        account_id: 100,
        assists: 5,
        deaths: 3,
        duration: 1800,
        game_mode: GAME_MODE_TURBO,
        hero_id: 1,
        kills: 10,
        player_slot: 0, // radiant
        radiant_win: true,
        start_time: new Date('2026-01-15'),
        ...overrides
    };
}

describe('filterMatchesByGameMode', () => {
    const turboMatch = makeMock({ game_mode: GAME_MODE_TURBO });
    const rankedMatch = makeMock({ game_mode: 22 });
    const otherMatch = makeMock({ game_mode: 2 });
    const matches = [turboMatch, rankedMatch, otherMatch];

    it('returns all matches when mode is "all"', () => {
        expect(filterMatchesByGameMode(matches, 'all')).toHaveLength(3);
    });

    it('filters to turbo only', () => {
        const result = filterMatchesByGameMode(matches, 'turbo');
        expect(result).toHaveLength(1);
        expect(result[0].game_mode).toBe(GAME_MODE_TURBO);
    });

    it('filters to ranked only', () => {
        const result = filterMatchesByGameMode(matches, 'ranked');
        expect(result).toHaveLength(1);
        expect(result[0].game_mode).toBe(22);
    });
});

describe('aggregateStats', () => {
    it('computes wins, losses, kda correctly for radiant wins', () => {
        const matches = [
            makeMock({ kills: 10, deaths: 2, assists: 8, player_slot: 0, radiant_win: true }),
            makeMock({ kills: 5, deaths: 5, assists: 3, player_slot: 0, radiant_win: false }),
        ];
        const result = aggregateStats(matches);
        expect(result.games).toBe(2);
        expect(result.wins).toBe(1);
        expect(result.losses).toBe(1);
        expect(result.win_percentage).toBeCloseTo(0.5);
        expect(result.kills).toBe(15);
        expect(result.deaths).toBe(7);
        expect(result.assists).toBe(11);
        expect(result.kda).toBeCloseTo((15 + 11) / 7);
    });

    it('handles zero deaths without NaN', () => {
        const matches = [makeMock({ kills: 5, deaths: 0, assists: 3 })];
        const result = aggregateStats(matches);
        expect(result.kda).toBe(0);
    });

    it('handles empty match array', () => {
        const result = aggregateStats([]);
        expect(result.games).toBe(0);
        expect(result.win_percentage).toBe(0);
        expect(result.kda).toBe(0);
    });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/helpers/herostats.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the utility**

Create `src/lib/helpers/herostats.ts`:

```typescript
import { GAME_MODE_TURBO, GAME_MODES_RANKED } from '$lib/constants/matches';
import winOrLoss from '$lib/helpers/winOrLoss';

export type GameMode = 'ranked' | 'turbo' | 'all';

export interface AggregatedRow {
    name: string;
    games: number;
    wins: number;
    losses: number;
    win_percentage: number;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
}

const RANKED_SET = new Set(GAME_MODES_RANKED);

export function filterMatchesByGameMode(matches: Match[], mode: GameMode): Match[] {
    if (mode === 'all') return matches;
    if (mode === 'turbo') return matches.filter(m => m.game_mode === GAME_MODE_TURBO);
    return matches.filter(m => RANKED_SET.has(m.game_mode));
}

export function aggregateStats(matches: Match[]): Omit<AggregatedRow, 'name'> {
    const games = matches.length;
    if (games === 0) {
        return { games: 0, wins: 0, losses: 0, win_percentage: 0, kda: 0, kills: 0, deaths: 0, assists: 0 };
    }

    const wins = matches.reduce((acc, m) => acc + (winOrLoss(m.player_slot, m.radiant_win) ? 1 : 0), 0);
    const losses = games - wins;
    const kills = matches.reduce((acc, m) => acc + m.kills, 0);
    const deaths = matches.reduce((acc, m) => acc + m.deaths, 0);
    const assists = matches.reduce((acc, m) => acc + m.assists, 0);

    return {
        games,
        wins,
        losses,
        win_percentage: wins / games,
        kda: deaths === 0 ? 0 : (kills + assists) / deaths,
        kills,
        deaths,
        assists
    };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/helpers/herostats.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```
feat(herostats): extract match aggregation into testable herostats utility
```

---

### Task 3: Add Condensed Font for Broadcast Aesthetic

**Files:**
- Modify: `src/app.html` (add Google Font link)

**Step 1: Add Barlow Condensed font import**

In `src/app.html`, add inside `<head>` before `%sveltekit.head%`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet">
```

**Step 2: Commit**

```
feat(herostats): add Barlow Condensed font for broadcast HUD
```

---

### Task 4: Rewrite StatsTable Component — Broadcast Scoreboard Style

**Files:**
- Rewrite: `src/lib/components/herostats/StatsTable.svelte`

**Step 1: Full rewrite of StatsTable.svelte**

Replace the entire contents with the new broadcast-styled table. Key design elements:

- Dark glass panel container (`bg-black/40 backdrop-blur-sm border border-cyan-900/30`)
- Uppercase condensed headers in `font-['Barlow_Condensed']` with cyan bottom accent border
- Sortable column headers with arrow indicators (▲/▼)
- Win% and KDA rendered as colored pill badges instead of plain colored text:
  - Win%: `bg-red-900/60 text-red-400` (< 45%), `bg-slate-800/60 text-slate-300` (45-55%), `bg-emerald-900/60 text-emerald-400` (> 55%)
  - KDA: `bg-red-900/60 text-red-400` (< 3), `bg-slate-800/60 text-slate-300` (3-6), `bg-emerald-900/60 text-emerald-400` (> 6)
- Games count in cyan accent (`text-cyan-400 font-semibold`)
- Row hover: `hover:bg-cyan-500/5` with subtle transition
- Alternating row: even rows get `bg-white/[0.02]`
- Responsive: on mobile, hide Wins, Losses, Kills, Deaths, Assists columns

The component props stay the same (`tableData`, `sortBy`) but styling is completely new. Keep the sorting logic from the existing component.

**Step 2: Verify the page renders**

Run: `npm run dev`, navigate to `/herostats`, confirm the table renders with new styling.

**Step 3: Commit**

```
feat(herostats): rewrite StatsTable with broadcast scoreboard styling
```

---

### Task 5: Rewrite the Hero Stats Page — Full Broadcast HUD

**Files:**
- Rewrite: `src/routes/herostats/+page.svelte`

This is the largest task. The page gets a full visual overhaul plus the game mode filter integration. Key sections:

**Step 1: Rewrite the page script block**

Replace the `<script>` section. Key changes from the current implementation:
- Remove image imports (`turboking`, `Knight`)
- Import `filterMatchesByGameMode` and `aggregateStats` from `$lib/helpers/herostats`
- Import `GAME_MODE_TURBO, GAME_MODES_RANKED` from `$lib/constants/matches`
- Call `generateMatchStatsArr()` once (assign result to a variable), not twice per tab
- In `recalcTableData()`, add `filterMatchesByGameMode(filteredMatchData, $sortData.gameMode)` as the first filter step (before hero/role/date)
- In single-player mode, filter out heroes with 0 games from the final `tableData`
- Use `aggregateStats()` utility instead of inline reduce calls

**Step 2: Rewrite the page template**

The new layout structure (top to bottom):

1. **Page header**: "HERO STATS" in `font-['Barlow_Condensed'] text-4xl font-extrabold uppercase tracking-wider text-cyan-400` with a subtle text-shadow glow. Subtitle "ONLY THE TRUE KING WILL RULE" as `text-xs tracking-[0.3em] text-cyan-700/60 uppercase`.

2. **Player loading indicators**: A flex row of 8 circular indicators (one per player). Each is a 32px circle with the player's first initial. Shows a pulsing border while loading, fills with cyan when loaded. Uses `{#await}` per player promise.

3. **Mode selector**: Three-segment toggle `RANKED | TURBO | ALL`. Built as a flex row of buttons with shared border. Active button: `bg-cyan-500 text-black font-bold`. Inactive: `bg-black/40 text-slate-400 hover:text-cyan-300`. The whole bar has `border border-cyan-800/40 rounded-lg overflow-hidden`. Clicking sets `$sortData.gameMode` and calls `recalcTable()`.

4. **View toggle (Heroes/Players)**: Slim underline tabs. Two `<button>` elements with bottom-border accent on active. `font-['Barlow_Condensed'] uppercase tracking-wider text-sm`. Active: `border-b-2 border-cyan-400 text-cyan-400`. Inactive: `text-slate-500 hover:text-slate-300`.

5. **Filter bar**: Horizontal row of compact filters. Each filter is a `<select>` or `<input type="date">` with dark styling (`bg-black/30 border-cyan-900/30 text-slate-300`). Labels above in small cyan text. Reset button at end styled as `border border-red-800/40 text-red-400 hover:bg-red-900/20`.

6. **Stats table**: The `<StatsTable>` component from Task 4, wrapped in a container with a top accent line (`border-t-2 border-cyan-500/40`).

**Step 3: Add scoped styles**

Add a `<style>` block at the bottom of the page for broadcast-specific effects:
- `.hud-glow` — subtle text-shadow for the title: `text-shadow: 0 0 20px rgba(6, 182, 212, 0.3)`
- `.mode-btn-active` — box-shadow glow on the active mode button: `box-shadow: 0 0 12px rgba(6, 182, 212, 0.25)`

**Step 4: Verify end-to-end**

Run: `npm run dev`, navigate to `/herostats`:
- Confirm broadcast visual style renders correctly
- Confirm RANKED/TURBO/ALL toggle filters the table data
- Confirm Heroes/Players tabs work
- Confirm hero/role/date filters still work
- Confirm sorting works
- Confirm player loading indicators show/fill
- Check mobile responsive (hide extra columns)

**Step 5: Commit**

```
feat(herostats): full page rewrite with broadcast HUD and game mode filter
```

---

### Task 6: Run Type Checker and Fix Any Issues

**Files:**
- Potentially: any files from Tasks 1-5

**Step 1: Run the type checker**

Run: `npm run check`
Expected: No new errors introduced (pre-existing errors in button.svelte, checkbox.svelte, league routes are expected and should be ignored).

**Step 2: Fix any new type errors**

If there are new errors, fix them. Common issues:
- `$sortData.gameMode` not recognized — ensure the store interface is updated
- `Match` type fields — the global `Match` interface in `app.d.ts` already has `game_mode: number`

**Step 3: Commit (if fixes needed)**

```
fix(herostats): resolve type errors from redesign
```

---

### Task 7: Final Visual Polish and Test

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass, including the new herostats tests from Task 2.

**Step 2: Visual review on dev server**

Run: `npm run dev`, check:
- Page loads, data populates
- Toggle between RANKED/TURBO/ALL — data changes
- Toggle between Heroes/Players — layout changes
- Sort columns — arrows appear, data reorders
- Filter by hero, role, dates — table updates
- Reset button clears all filters
- Mobile view hides extra columns
- Loading indicators work

**Step 3: Final commit**

```
feat(herostats): broadcast scoreboard redesign complete
```
