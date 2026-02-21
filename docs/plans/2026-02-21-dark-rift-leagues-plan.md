# Dark Rift Leagues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the leagues feature around Dark Rift competitive play with an emerald-themed leaderboard dashboard.

**Architecture:** Zero schema migrations. Leaderboard computed at query time by bridging DotaUser (league membership) → User → IncrementalRun (date-range scoped to season). DPS computed via existing pure functions. UI rebuilt as a dashboard with leaderboard front-and-center and locked admin sections.

**Tech Stack:** SvelteKit, Svelte 5, Tailwind CSS v4, Skeleton UI v4, Prisma, Vitest

**Design doc:** `docs/plans/2026-02-21-dark-rift-leagues-design.md`

---

### Task 1: Leaderboard Aggregation Helper — Pure Logic

Extract the aggregation logic (steps 4+6 from the design doc data flow) into a testable pure function separate from DB calls.

**Files:**
- Create: `src/lib/server/league-leaderboard.ts`
- Create: `src/lib/server/league-leaderboard.test.ts`

**Step 1: Write the types and pure aggregation function**

Create `src/lib/server/league-leaderboard.ts`:

```ts
/**
 * Dark Rift league leaderboard computation.
 * See docs/plans/2026-02-21-dark-rift-leagues-design.md
 */

/** Input: a won run record (selected fields only). */
export interface WonRunRow {
  userId: string;
  level: number;
  lineupId: string;
}

/** Input: member identity info keyed by userId. */
export interface MemberInfo {
  accountId: number;
  displayName: string;
  avatarUrl: string | null;
}

/** Input: DPS + heroIds for a lineup, keyed by lineupId. */
export interface LineupDpsInfo {
  totalDps: number;
  heroIds: number[];
}

/** Output: one row per member in the leaderboard. */
export interface DarkRiftLeaderboardRow {
  rank: number;
  accountId: number;
  displayName: string;
  avatarUrl: string | null;
  deepestLevel: number;
  totalDps: number;
  runCount: number;
  heroIds: number[];
}

/**
 * Aggregate won-run rows into leaderboard rows.
 * Pure function — no DB calls, no side effects.
 *
 * For each user: finds deepest level, the lineup used on that deepest run,
 * and total run count. Sorts by deepestLevel desc, totalDps desc as tiebreaker.
 * Assigns 1-based ranks.
 *
 * @param runs       Won runs in the season date window for all league members
 * @param members    Map<userId, MemberInfo> for display names/avatars
 * @param lineupDps  Map<lineupId, LineupDpsInfo> pre-computed DPS per lineup
 */
export function aggregateLeaderboard(
  runs: WonRunRow[],
  members: Map<string, MemberInfo>,
  lineupDps: Map<string, LineupDpsInfo>
): DarkRiftLeaderboardRow[] {
  // Group runs by userId
  const byUser = new Map<string, WonRunRow[]>();
  for (const run of runs) {
    let arr = byUser.get(run.userId);
    if (!arr) {
      arr = [];
      byUser.set(run.userId, arr);
    }
    arr.push(run);
  }

  const rows: Omit<DarkRiftLeaderboardRow, 'rank'>[] = [];

  // Also include members with zero runs
  for (const [userId, info] of members) {
    const userRuns = byUser.get(userId) ?? [];
    let deepestLevel = 0;
    let bestLineupId: string | null = null;

    for (const run of userRuns) {
      if (run.level > deepestLevel) {
        deepestLevel = run.level;
        bestLineupId = run.lineupId;
      }
    }

    const dpsInfo = bestLineupId ? lineupDps.get(bestLineupId) : undefined;

    rows.push({
      accountId: info.accountId,
      displayName: info.displayName,
      avatarUrl: info.avatarUrl,
      deepestLevel,
      totalDps: dpsInfo?.totalDps ?? 0,
      runCount: userRuns.length,
      heroIds: dpsInfo?.heroIds ?? []
    });
  }

  // Sort: deepest level desc, then DPS desc
  rows.sort((a, b) => b.deepestLevel - a.deepestLevel || b.totalDps - a.totalDps);

  // Assign ranks (1-based)
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
```

**Step 2: Write tests for the aggregation function**

Create `src/lib/server/league-leaderboard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  aggregateLeaderboard,
  type WonRunRow,
  type MemberInfo,
  type LineupDpsInfo
} from './league-leaderboard';

function makeMembers(...entries: [string, number, string][]): Map<string, MemberInfo> {
  return new Map(
    entries.map(([userId, accountId, displayName]) => [
      userId,
      { accountId, displayName, avatarUrl: null }
    ])
  );
}

function makeDps(...entries: [string, number, number[]][]): Map<string, LineupDpsInfo> {
  return new Map(
    entries.map(([lineupId, totalDps, heroIds]) => [lineupId, { totalDps, heroIds }])
  );
}

describe('aggregateLeaderboard', () => {
  it('returns empty array when no members', () => {
    const result = aggregateLeaderboard([], new Map(), new Map());
    expect(result).toEqual([]);
  });

  it('includes members with zero runs at deepestLevel 0', () => {
    const members = makeMembers(['u1', 100, 'Alice']);
    const result = aggregateLeaderboard([], members, new Map());

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      rank: 1,
      accountId: 100,
      displayName: 'Alice',
      deepestLevel: 0,
      totalDps: 0,
      runCount: 0,
      heroIds: []
    });
  });

  it('picks the deepest level run per user', () => {
    const members = makeMembers(['u1', 100, 'Alice']);
    const runs: WonRunRow[] = [
      { userId: 'u1', level: 3, lineupId: 'L1' },
      { userId: 'u1', level: 5, lineupId: 'L2' },
      { userId: 'u1', level: 2, lineupId: 'L1' }
    ];
    const dps = makeDps(['L2', 150, [1, 2, 3]]);

    const result = aggregateLeaderboard(runs, members, dps);

    expect(result[0].deepestLevel).toBe(5);
    expect(result[0].totalDps).toBe(150);
    expect(result[0].heroIds).toEqual([1, 2, 3]);
    expect(result[0].runCount).toBe(3);
  });

  it('sorts by deepest level desc, then DPS desc as tiebreaker', () => {
    const members = makeMembers(
      ['u1', 100, 'Alice'],
      ['u2', 200, 'Bob'],
      ['u3', 300, 'Carol']
    );
    const runs: WonRunRow[] = [
      { userId: 'u1', level: 5, lineupId: 'L1' },
      { userId: 'u2', level: 5, lineupId: 'L2' },
      { userId: 'u3', level: 3, lineupId: 'L3' }
    ];
    const dps = makeDps(
      ['L1', 100, [1]],
      ['L2', 200, [2]],
      ['L3', 50, [3]]
    );

    const result = aggregateLeaderboard(runs, members, dps);

    expect(result[0]).toMatchObject({ displayName: 'Bob', rank: 1, deepestLevel: 5, totalDps: 200 });
    expect(result[1]).toMatchObject({ displayName: 'Alice', rank: 2, deepestLevel: 5, totalDps: 100 });
    expect(result[2]).toMatchObject({ displayName: 'Carol', rank: 3, deepestLevel: 3, totalDps: 50 });
  });

  it('assigns sequential ranks', () => {
    const members = makeMembers(['u1', 1, 'A'], ['u2', 2, 'B'], ['u3', 3, 'C']);
    const runs: WonRunRow[] = [
      { userId: 'u1', level: 10, lineupId: 'L1' },
      { userId: 'u2', level: 5, lineupId: 'L2' },
      { userId: 'u3', level: 1, lineupId: 'L3' }
    ];

    const result = aggregateLeaderboard(runs, members, new Map());
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('falls back to DPS 0 when lineup not in dps map (deleted lineup)', () => {
    const members = makeMembers(['u1', 100, 'Alice']);
    const runs: WonRunRow[] = [{ userId: 'u1', level: 3, lineupId: 'deleted-lineup' }];

    const result = aggregateLeaderboard(runs, members, new Map());
    expect(result[0].totalDps).toBe(0);
    expect(result[0].heroIds).toEqual([]);
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run src/lib/server/league-leaderboard.test.ts`
Expected: All 5 tests PASS

**Step 4: Commit**

```bash
git add src/lib/server/league-leaderboard.ts src/lib/server/league-leaderboard.test.ts
git commit -m "feat: add Dark Rift leaderboard aggregation helper with tests"
```

---

### Task 2: Server-Side Leaderboard Loader

Add the `computeDarkRiftLeaderboard` function that does the DB queries (steps 1-3, 5 from the design) and calls the pure aggregation function from Task 1.

**Files:**
- Modify: `src/lib/server/league-leaderboard.ts`

**Step 1: Add the DB-calling orchestrator function**

Append to `src/lib/server/league-leaderboard.ts`:

```ts
import prisma from '$lib/server/prisma';
import { getHeroDefsFromDb } from '$lib/server/incremental-hero-resolver';
import { computeLineupStats } from '$lib/incremental/stats/lineup-stats';

/** League with members for leaderboard input. */
export interface LeagueWithMembers {
  members: { account_id: number; display_name: string | null; avatar_url: string | null }[];
}

/** Season date window. */
export interface SeasonWindow {
  startDate: Date;
  endDate: Date;
}

/**
 * Compute the Dark Rift leaderboard for a league + season.
 * Bridges DotaUser.account_id → User.id → IncrementalRun,
 * then computes lineup DPS for each member's deepest won run.
 */
export async function computeDarkRiftLeaderboard(
  league: LeagueWithMembers,
  season: SeasonWindow
): Promise<DarkRiftLeaderboardRow[]> {
  const memberAccountIds = league.members.map((m) => m.account_id);
  if (memberAccountIds.length === 0) return [];

  // Step 2: Bridge DotaUser.account_id → User.id
  const users = await prisma.user.findMany({
    where: { account_id: { in: memberAccountIds } },
    select: { id: true, account_id: true }
  });

  const accountToUserId = new Map<number, string>();
  const userIdToAccount = new Map<string, number>();
  for (const u of users) {
    if (u.account_id != null) {
      accountToUserId.set(u.account_id, u.id);
      userIdToAccount.set(u.id, u.account_id);
    }
  }

  const userIds = [...userIdToAccount.keys()];
  if (userIds.length === 0) return [];

  // Step 3: Fetch won runs in season date window
  const wonRuns = await prisma.incrementalRun.findMany({
    where: {
      userId: { in: userIds },
      status: 'WON',
      startedAt: { gte: season.startDate, lte: season.endDate }
    },
    select: { userId: true, level: true, lineupId: true }
  });

  // Build members map
  const membersMap = new Map<string, MemberInfo>();
  for (const m of league.members) {
    const userId = accountToUserId.get(m.account_id);
    if (userId) {
      membersMap.set(userId, {
        accountId: m.account_id,
        displayName: m.display_name ?? `Player ${m.account_id}`,
        avatarUrl: m.avatar_url
      });
    }
  }

  // Step 5: Compute DPS for lineups of deepest runs
  // First, find which lineupIds we need (one per user: the lineup of their deepest run)
  const deepestByUser = new Map<string, { level: number; lineupId: string }>();
  for (const run of wonRuns) {
    const current = deepestByUser.get(run.userId);
    if (!current || run.level > current.level) {
      deepestByUser.set(run.userId, { level: run.level, lineupId: run.lineupId });
    }
  }

  const lineupIds = [...new Set([...deepestByUser.values()].map((v) => v.lineupId))];

  // Fetch lineups with their saveIds
  const lineups = await prisma.incrementalLineup.findMany({
    where: { id: { in: lineupIds } },
    select: { id: true, heroIds: true, saveId: true }
  });

  // Compute DPS per lineup
  const lineupDps = new Map<string, LineupDpsInfo>();
  for (const lineup of lineups) {
    try {
      // getHeroDefsFromDb bakes training into base stats — do NOT pass training separately
      const { getHeroDef, getAbilityDef, heroes } = await getHeroDefsFromDb(lineup.saveId);

      // Build abilityDefs record from all heroes' abilities
      const abilityDefs: Record<string, import('$lib/incremental/types').AbilityDef> = {};
      for (const hero of heroes) {
        for (const abilityId of hero.abilityIds) {
          const def = getAbilityDef(abilityId);
          if (def) abilityDefs[abilityId] = def;
        }
      }

      // Compute stats WITHOUT passing training (already baked into heroDef base stats)
      const stats = computeLineupStats(lineup.heroIds, getHeroDef, abilityDefs);
      lineupDps.set(lineup.id, { totalDps: stats.totalDps, heroIds: lineup.heroIds });
    } catch {
      // Lineup or save deleted — DPS = 0
      lineupDps.set(lineup.id, { totalDps: 0, heroIds: lineup.heroIds });
    }
  }

  // Step 4 + 6: Aggregate and sort
  return aggregateLeaderboard(wonRuns, membersMap, lineupDps);
}
```

**Step 2: Commit**

```bash
git add src/lib/server/league-leaderboard.ts
git commit -m "feat: add server-side Dark Rift leaderboard DB orchestrator"
```

---

### Task 3: Wire Leaderboard into League Detail Page Server

Load leaderboard data in the league detail page's server load function when an active Dark Rift season exists.

**Files:**
- Modify: `src/routes/leagues/[slug]/+page.server.ts`

**Step 1: Add leaderboard loading to the load function**

In `src/routes/leagues/[slug]/+page.server.ts`, add to the load function after the existing match counts logic:

```ts
import { computeDarkRiftLeaderboard, type DarkRiftLeaderboardRow } from '$lib/server/league-leaderboard';
```

Then, before the `return` statement, add:

```ts
// Dark Rift leaderboard: find active darkrift season and compute leaderboard
let darkRiftLeaderboard: DarkRiftLeaderboardRow[] = [];
let activeDarkRiftSeason: { id: number; name: string; startDate: Date; endDate: Date } | null = null;

if (selectedLeague?.seasons?.length) {
  const season = selectedLeague.seasons.find(
    (s: any) => s.active && s.type === 'darkrift'
  );
  if (season) {
    activeDarkRiftSeason = {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate
    };
    darkRiftLeaderboard = await computeDarkRiftLeaderboard(
      { members: selectedLeague.members },
      { startDate: season.startDate, endDate: season.endDate }
    );
  }
}
```

Add these to the return object:

```ts
return {
  ...parentData,
  allUsers,
  memberMatchCounts,
  memberLastRanked,
  darkRiftLeaderboard,
  activeDarkRiftSeason
};
```

**Step 2: Add "darkrift" to the season type dropdown**

In `src/routes/leagues/[slug]/+page.svelte`, find the season type `<select>` (around line 539) and add:

```svelte
<option value="darkrift">Dark Rift</option>
```

**Step 3: Commit**

```bash
git add src/routes/leagues/[slug]/+page.server.ts src/routes/leagues/[slug]/+page.svelte
git commit -m "feat: wire Dark Rift leaderboard data into league detail page"
```

---

### Task 4: Retheme League Layout — Emerald on Dark

Replace the existing league layout header with the emerald atmospheric theme.

**Files:**
- Modify: `src/routes/leagues/[slug]/+layout.svelte`

**Step 1: Rewrite the layout with emerald theme**

Replace the entire content of `src/routes/leagues/[slug]/+layout.svelte` with the new emerald-themed layout. Key changes:
- Dark `gray-950` background with emerald glow blur
- Emerald accent colors instead of amber/primary
- Glassmorphism card for breadcrumbs
- Remove the fixed positioning (use sticky instead for better mobile behavior)

The layout should preserve the existing data contract (`data.selectedLeague` with `.name`, `.id`, `.creator.username`, `.createdDate`, `.members.length`) and render `{@render children?.()}`.

**Step 2: Commit**

```bash
git add src/routes/leagues/[slug]/+layout.svelte
git commit -m "feat: retheme league detail layout with emerald dark aesthetic"
```

---

### Task 5: Redesign League Detail Page — Dashboard Layout

This is the largest task. Replace the tabbed layout with a dashboard: leaderboard at top, collapsible admin sections below with lock overlays.

**Files:**
- Modify: `src/routes/leagues/[slug]/+page.svelte`

**Step 1: Rewrite the page component**

The new layout structure:

```
<div> (atmospheric background: gray-950 + emerald glow)
  <div> (content container)

    <!-- Active Season Banner -->
    <section> season name, dates, status badge </section>

    <!-- Dark Rift Leaderboard (always visible) -->
    <section>
      <table>
        Rank | Player (avatar+name) | Deepest Level | Best DPS | Runs
      </table>
      OR "No active Dark Rift season" empty state
    </section>

    <!-- Members Section (admin-locked) -->
    <section class="relative">
      {#if !isAdmin} <LockOverlay /> {/if}
      <!-- existing member management: current members table, add by ID, from database -->
    </section>

    <!-- Seasons Section (admin-locked) -->
    <section class="relative">
      {#if !isAdmin} <LockOverlay /> {/if}
      <!-- existing season table + create form (with "darkrift" option added) -->
    </section>

  </div>
</div>
```

Key implementation notes:
- Preserve ALL existing functionality: season CRUD, member CRUD, match refresh, toast notifications
- Preserve all existing form actions and enhance functions
- Move from tabs to collapsible sections with emerald-styled disclosure headers
- Leaderboard section has no lock overlay — visible to all
- Members and Seasons sections have lock overlays for non-admins
- Use `data.darkRiftLeaderboard` and `data.activeDarkRiftSeason` from Task 3
- DPS values should be formatted with `toFixed(1)` for readability
- Theme all cards/borders/text with the emerald palette from the design doc

**Step 2: Verify existing functionality still works**

Open `/leagues/[id]` in browser. Verify:
- Leaderboard renders (or "No active season" if none exists)
- Season CRUD still works (create, activate/deactivate, delete)
- Member CRUD still works (add by ID, from database, remove)
- Lock overlays appear for non-admin users
- Toast notifications still fire

**Step 3: Commit**

```bash
git add src/routes/leagues/[slug]/+page.svelte
git commit -m "feat: redesign league detail page as emerald-themed dashboard"
```

---

### Task 6: Retheme Leagues List Page

Apply emerald dark theme to the `/leagues` index page.

**Files:**
- Modify: `src/routes/leagues/+page.svelte`

**Step 1: Retheme the page**

Key changes:
- Replace trophy image header with emerald gradient title
- Dark atmospheric background (gray-950 + emerald glow)
- Restyle league table with emerald accents
- Restyle create league form card with emerald theme
- Update lock overlay to match emerald theme
- Convert from Svelte 4 syntax (`export let data`, `$:`) to Svelte 5 (`$props()`, `$derived`, `$effect`) since the rest of the codebase uses Svelte 5

**Step 2: Commit**

```bash
git add src/routes/leagues/+page.svelte
git commit -m "feat: retheme leagues list page with emerald dark aesthetic"
```

---

### Task 7: Dark Rift Leaderboard Component for Season Detail

Create a Dark Rift-specific leaderboard component for the season detail page, separate from the existing `SeasonLeaderboard.svelte` (which handles Turbotown/Random).

**Files:**
- Create: `src/routes/leagues/[slug]/seasons/[slug]/DarkRiftLeaderboard.svelte`
- Modify: `src/routes/leagues/[slug]/seasons/[slug]/+page.svelte`
- Modify: `src/routes/leagues/[slug]/seasons/[slug]/+page.server.ts`

**Step 1: Create the DarkRiftLeaderboard component**

Props: `{ leaderboard: DarkRiftLeaderboardRow[] }`

Table columns: Rank, Player (avatar + name), Deepest Level, Best Lineup DPS, Runs Completed

Emerald-themed to match the league pages. Rank #1 gets a special highlighted card/crown treatment (similar to how Turboking works in the existing SeasonLeaderboard).

**Step 2: Wire into season detail page**

In `+page.server.ts`, when the season type is `"darkrift"`, compute the leaderboard using `computeDarkRiftLeaderboard` and pass it to the page.

In `+page.svelte`, conditionally render `DarkRiftLeaderboard` when season type is `"darkrift"`, or the existing `SeasonLeaderboard` for other types.

**Step 3: Commit**

```bash
git add src/routes/leagues/[slug]/seasons/[slug]/DarkRiftLeaderboard.svelte \
        src/routes/leagues/[slug]/seasons/[slug]/+page.svelte \
        src/routes/leagues/[slug]/seasons/[slug]/+page.server.ts
git commit -m "feat: add Dark Rift leaderboard component for season detail page"
```

---

### Task 8: Final Review and Cleanup

**Files:**
- Possibly modify: `src/routes/leagues/+layout.server.ts` (remove hardcoded account ID `65110965` from common friends query)

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (including new leaderboard tests)

**Step 2: Run type check**

Run: `npx svelte-kit sync && npm run check`
Expected: No new type errors (pre-existing ones in button.svelte, checkbox.svelte etc. are acceptable)

**Step 3: Visual review**

Visit these pages in browser and verify:
- `/leagues` — emerald themed list, create form works
- `/leagues/[id]` — dashboard with leaderboard, admin sections locked for non-admins
- `/leagues/[id]/seasons/[id]` — Dark Rift leaderboard for darkrift seasons, legacy leaderboard for other types

**Step 4: Commit cleanup if needed**

```bash
git add -A
git commit -m "chore: cleanup and polish Dark Rift leagues redesign"
```
