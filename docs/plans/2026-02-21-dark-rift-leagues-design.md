# Dark Rift Leagues — Design Document

**Date**: 2026-02-21
**Status**: Approved
**Branch**: `dotadeck`

## Overview

Redesign the leagues feature around Dark Rift competitive play. Leagues become the social/competitive layer for Dark Rift, where groups of friends compete to reach the deepest level. The leaderboard shows deepest level cleared and best lineup DPS per member within a season window.

Legacy season types (Random Romp, DotaDeck, Turbotown) are preserved but Dark Rift is the primary focus.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| League scope | Dark Rift primary, keep legacy types | Backwards compatibility with existing seasons |
| Season scoping | Date-range filtering on `IncrementalRun.startedAt` | No schema changes needed; a run counts for any season whose window contains it |
| Stats display | Total lineup DPS (single number) | Simple, comparable across players |
| Best lineup source | Lineup from the deepest won run | Ties DPS to actual achievement |
| Admin access | Dev-only creation for now | Ship leaderboard first, open creation later |
| Visual theme | Emerald accent on dark `gray-950` base | Distinct from Dark Rift's violet while keeping atmospheric feel |
| Page layout | Dashboard with leaderboard front-and-center | Leaderboard is the primary experience; admin controls are secondary |
| User/DotaUser | Keep separation, use bridging query | No schema changes; 2-query bridge via `account_id` is clean and sufficient |
| Data model | Zero migrations | All leaderboard data derived from existing tables at query time |

## Data Model

### No Schema Changes Required

The leaderboard is computed at query time from existing tables:

- **Deepest level**: `MAX(IncrementalRun.level) WHERE status = 'WON' AND startedAt BETWEEN season.startDate AND season.endDate`
- **Best lineup DPS**: Computed from the lineup used on the deepest won run via `computeLineupStats()`
- **Runs completed**: `COUNT(IncrementalRun) WHERE status = 'WON'` in the season window

### Season Type

`Season.type` is a plain string field. Add `"darkrift"` as a new type value — no enum migration needed.

### User → DotaUser Bridge

League members are `DotaUser[]` (keyed by `account_id`). Incremental runs are owned by `User` (keyed by `User.id`). The bridge:

```
League.members (DotaUser[])
  → DotaUser.account_id
  → User.account_id (FK match)
  → User.id
  → IncrementalRun.userId
```

Two queries, no joins across different ID types in a single query.

## Leaderboard Data Flow

### Server-Side Computation

```
League Detail Page Load (+page.server.ts)
│
├─ 1. Fetch league with members (existing query)
│     League → DotaUser[] (account_ids)
│
├─ 2. Bridge to User IDs
│     User.findMany({ where: { account_id: { in: memberAccountIds } } })
│     → Map<account_id, userId>
│
├─ 3. Fetch won runs in season window
│     IncrementalRun.findMany({
│       where: {
│         userId: { in: userIds },
│         status: 'WON',
│         startedAt: { gte: season.startDate, lte: season.endDate }
│       },
│       select: { userId, level, lineupId }
│     })
│
├─ 4. Aggregate per user
│     For each user: deepestLevel = max(level), bestRunLineupId, runCount
│
├─ 5. Compute DPS for best-run lineups
│     For each unique lineupId:
│       getHeroDefsFromDb(lineup.saveId) → HeroDef[] (training baked in)
│       computeLineupStats(heroIds, getHeroDef, abilityDefs) → totalDps
│     IMPORTANT: Do NOT pass training arg to computeHeroCombatStats —
│     getHeroDefsFromDb already folds training into base stats.
│     Passing training again would double-count attack_damage, hp, armor, magic_resist.
│
└─ 6. Assemble leaderboard rows
      Sort by deepestLevel desc, totalDps desc as tiebreaker
      Return: { rank, player, deepestLevel, totalDps, runCount, heroIds }[]
```

### New File: `src/lib/server/league-leaderboard.ts`

Encapsulates the leaderboard computation:

```ts
export interface DarkRiftLeaderboardRow {
  rank: number;
  accountId: number;
  displayName: string;
  avatarUrl: string | null;
  deepestLevel: number;
  totalDps: number;
  runCount: number;
  heroIds: number[];  // lineup heroes for the deepest run
}

export async function computeDarkRiftLeaderboard(
  league: LeagueWithMembers,
  season: Season
): Promise<DarkRiftLeaderboardRow[]>
```

### Training Double-Count Prevention

`getHeroDefsFromDb(saveId)` bakes training into `baseAttackDamage`, `baseMaxHp`, `baseArmor`, `baseMagicResist` (incremental-hero-resolver.ts:75-78). It also sets `attackSpeed`, `spellPower`, `spellHaste` as separate `HeroDef` fields.

For leaderboard DPS, call:
```ts
computeHeroCombatStats(heroDef, abilityDefs)  // NO training arg
```

This is correct because:
- `heroDef.baseAttackDamage` already includes trained value
- `attackDamage(base, { flat: 0 })` returns the correct total
- `heroDef.attackSpeed` is already the trained value
- Same for `spellPower`, `spellHaste`

### Edge Cases

| Case | Behavior |
|------|----------|
| Member has no incremental save | Omitted from leaderboard |
| Member has runs but none won | Shows with deepestLevel = 0, DPS = 0 |
| No active Dark Rift season | Leaderboard shows "No active season" message |
| Member's deepest-run lineup was deleted | Fall back to DPS = 0 or "N/A" |
| Member in multiple leagues with overlapping seasons | Runs count for all seasons (date range is per-season) |

### Performance

- 5-15 members typical → 5-15 hero def queries (one per save). Acceptable.
- No caching needed initially. Can add TTL cache if leagues grow large.
- No materialized views — compute on page load for freshness.

## UI Design

### Route Structure

| Route | Purpose | Changes |
|-------|---------|---------|
| `/leagues` | League list | Retheme with emerald/dark aesthetic |
| `/leagues/[id]` | League dashboard | **Major redesign**: leaderboard-first layout |
| `/leagues/[id]/seasons/[id]` | Season detail | Repurpose for Dark Rift + legacy season types |

### League Dashboard (`/leagues/[id]`) — New Layout

**Top: Active Season Banner**
- Active Dark Rift season name, date range, status badge
- No active season → "No active season" + create button (admin-locked)

**Main: Dark Rift Leaderboard**
- Columns: Rank, Player (avatar + name), Deepest Level, Best Lineup DPS, Runs Completed
- Sorted by deepest level desc, DPS tiebreaker
- Row click expands to show lineup hero portraits (stretch goal)

**Secondary (collapsible sections)**
- Members — list with add/remove (locked for non-admins)
- Seasons — all seasons list with create (locked)
- Settings — league admin controls (locked)

### Visual Theme — Emerald on Dark

Adapted from Dark Rift's violet pattern:

| Element | Classes |
|---------|---------|
| Background | `gray-950` base |
| Glow | `bg-emerald-600/8 rounded-full blur-[120px]` |
| Cards | `bg-gray-900/60 border-emerald-500/20 backdrop-blur-sm` |
| Badges | `bg-emerald-500/10 border-emerald-500/20 text-emerald-300` |
| Title gradient | `from-gray-100 via-emerald-200 to-emerald-400` |
| Lock overlays | `bg-gray-900/90` with lock icon + "Admin only" text |

### Admin Gating Pattern

Non-admin users see:
- Lock icon overlay on Members, Seasons, Settings sections
- "Contact an admin" or "Admin only" message
- Leaderboard is fully visible to all members

Admin check (existing pattern):
```ts
// Server: user.roles?.includes('dev')
// Client: data.session.user.roles?.includes('dev')
```

## Files to Create/Modify

### New Files
- `src/lib/server/league-leaderboard.ts` — leaderboard computation helper
- `src/lib/server/league-leaderboard.test.ts` — unit tests for leaderboard logic

### Modified Files
- `src/routes/leagues/+page.svelte` — retheme league list
- `src/routes/leagues/+page.server.ts` — minor cleanup (remove hardcoded account ID)
- `src/routes/leagues/[slug]/+page.svelte` — major redesign to dashboard layout
- `src/routes/leagues/[slug]/+page.server.ts` — add leaderboard data loading
- `src/routes/leagues/[slug]/+layout.svelte` — retheme header/breadcrumbs
- `src/routes/leagues/[slug]/seasons/[slug]/+page.svelte` — retheme, conditional Dark Rift vs legacy display
- `src/routes/leagues/[slug]/seasons/[slug]/+page.server.ts` — add Dark Rift leaderboard for season detail
- `src/routes/leagues/[slug]/seasons/[slug]/SeasonLeaderboard.svelte` — new Dark Rift leaderboard component (or adapt existing)

### Preserved (No Changes)
- API routes for league CRUD, season CRUD, match refresh
- Prisma schema (zero migrations)
- `src/lib/helpers/leaderboardFromSeason.ts` (legacy leaderboard for Random Romp/Turbotown)
- `src/lib/incremental/stats/lineup-stats.ts` (used as-is for DPS computation)
- `src/lib/server/incremental-hero-resolver.ts` (used as-is for hero def loading)
