# Profile Page Redesign — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Problem

The profile page (`/profile`) uses a warm gold palette that doesn't match the Dark Rift visual identity. The Dota 2 Account ID — the most important piece of profile data — is buried in the "Linked Accounts" section at the bottom. Users need clearer feedback about whether their ID is verified (via Steam) or just manually entered. New users (especially Google sign-ins) need a guided onboarding flow to link their Dota 2 account.

## Design Decisions

### 1. Color Palette — Dark Rift Violet

Replace the warm gold palette (`--gold`, `--card-bg`, etc.) with the Dark Rift violet palette:

| Role | Old Value | New Value |
|---|---|---|
| Base background | `rgb(10 7 5)` | `#030712` with radial violet gradients |
| Panel background | `rgb(10 7 5)` | `rgba(15, 10, 30, 0.5)` |
| Panel border | `rgb(46 30 16 / 0.9)` | `rgba(139, 92, 246, 0.15)` |
| Panel top accent | gold gradient | `linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)` |
| Primary accent | `rgb(212 152 44)` (gold) | `rgb(139, 92, 246)` (violet) |
| Primary text | `rgb(226 210 188)` | `rgb(209, 213, 219)` (gray-300) |
| Muted text | `rgb(120 100 80)` | `rgb(156, 163, 175)` (gray-400) |
| Success/verified | green | `rgb(52, 211, 153)` (emerald-400) |
| Editable/warning | — | `rgb(251, 191, 36)` (amber-400) |

Page background uses layered radial gradients:
```css
background:
  radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 100%, rgba(88, 28, 135, 0.05) 0%, transparent 40%),
  #030712;
```

CSS variables defined in a `.profile-root` scoped class (same pattern as current page, just new values).

### 2. Page Layout (Post-Onboarding, Daily Use)

Single-scroll page, top to bottom:

**A. Identity Header** — compact horizontal bar in a panel

- Left: avatar (with online indicator dot), username with edit button, "Member since" date
- Right: Account ID displayed large in monospace, with lock/pencil icon and auth badges
- Vertical divider between left and right at `rgba(139, 92, 246, 0.2)`
- Mobile: stacks vertically — avatar + name row, then account ID block below as full-width

Account ID states:
- **Verified (locked):** Large monospace ID, emerald lock icon, tooltip "Verified via Steam — cannot be changed"
- **Manually linked (editable):** Large monospace ID, amber pencil icon, tooltip "Manually linked — click to edit". Clicking opens inline edit form.
- **Not linked:** Placeholder text "No account linked", violet "Link now" button

Auth badges below the ID: small pill tags for Steam (emerald if connected, muted if not) and Google (blue if connected, muted if not).

**B. Match Stats** — 2-column grid

Same data as current (Battle Record + Performance panels), recolored:
- Win rate progress bar: violet gradient instead of green/red
- Accent numbers: violet instead of gold
- Panel styling: dark rift `.rift-panel` pattern

**C. Signature Heroes** — horizontal hero sprite row (same structure, recolored borders/hovers)

**D. Dark Rift Saves** — save cards with currency balances (same structure, recolored)

**E. Linked Accounts** — management section at bottom

Collapsed/minimal once an ID is set. Contains Steam, Google, and Dota 2 ID management cards. The Dota 2 ID card shows:
- Locked state: "Verified via Steam — this ID cannot be changed"
- Unlocked state: "Manually linked — you can update this anytime" with edit form
- Unlinked state: Form to enter ID + "Link with Steam" button

### 3. Onboarding Overlay (`?welcome=true`)

A modal overlay for users who don't have an account_id (primarily Google sign-ins). Uses Skeleton UI `Dialog` + `Portal` for accessibility (focus trapping, ESC to close, aria labels).

**Overlay styling:**
- Backdrop: `rgba(3, 7, 18, 0.85)` with `backdrop-filter: blur(8px)`
- Card: same panel styling, max-width ~440px, subtle violet glow
- Fade-in animation on mount

**Step 1: Welcome (choice screen)**

Two options presented as cards:
1. "Sign in with Steam" (recommended) — emerald accent border, description: "Verifies ownership & locks your ID permanently"
2. "Enter Account ID manually" — neutral violet border, description: "Quick setup — anyone can claim any ID until verified via Steam"

"Skip for now" link at the bottom.

**Step 2a (Steam path):** Redirects to `/api/auth/steam/link`. On callback, returns to `/profile?linked=steam` — shows success toast, no overlay.

**Step 2b (Manual path):** Overlay transitions to inline form:
- Input field for account ID
- Helper text: "Find your ID at opendota.com or in the Dota 2 client under Settings"
- Info note: "Anyone can enter any ID. Sign in with Steam to verify ownership and lock it permanently."
- Back button to return to Step 1

**URL cleanup:** All completion paths (Steam link, manual entry, Skip) remove `?welcome=true` from the URL via `history.replaceState`. The `?linked=steam` param is handled separately.

**Error states:**
- ID locked by another Steam user: "This ID is verified by another user via Steam"
- ID already in use (manual): Allow save (last-write-wins for unverified claims)
- Invalid format: "Please enter a valid Dota 2 Account ID (numbers only)"

### 4. Account ID Locking Logic (Backend)

#### Derived Lock State

No schema migration. Lock state is computed:

```typescript
function isAccountLocked(user: { steam_id: bigint | null; account_id: number | null }): boolean {
  if (!user.steam_id || !user.account_id) return false;
  const derived = Number(BigInt(user.steam_id) - 76561197960265728n);
  return user.account_id === derived;
}
```

The load function passes `isAccountLocked: boolean` to the frontend alongside the existing `user` object.

#### Conflict Resolution Matrix

| Scenario | Behavior |
|---|---|
| Steam link, no one else has this ID | Set account_id + steam_id, done |
| Steam link, another user has ID via manual entry | Clear their account_id to null, set yours (locked) |
| Steam link, another user verified same steam_id | Error — impossible unless DB corruption |
| Manual entry, no one else has this ID | Set account_id, done |
| Manual entry, someone has it locked (Steam-verified) | Reject: "This ID is verified by another user via Steam" |
| Manual entry, someone else has it manually | Allow (last-write-wins, current behavior) |

#### Changes to `setAccountId` action (`+page.server.ts`)

Before saving, check if the conflicting user's account_id is locked:
```
1. Find user with this account_id
2. If found and it's a different user:
   a. If that user has steam_id and derived account_id matches → reject with locked error
   b. If not locked → allow (current last-write-wins behavior)
3. Upsert DotaUser, update User.account_id
```

#### Changes to Steam link callback (`link/callback/+server.ts`)

Replace the hard `error(400)` for account_id conflicts:
```
1. Find user with this account_id
2. If found and it's a different user:
   a. That user cannot have a matching steam_id (since steam_id is unique and we already checked)
   b. Clear their account_id to null
3. Upsert DotaUser (FIX: currently missing, causes FK constraint violation)
4. Update current user with steam_id, account_id, avatar, profile_url
```

### 5. Bug Fixes (Pre-existing, Addressed in This Work)

**A. Missing `createDotaUser` in Steam link callback**

`src/routes/api/auth/steam/link/callback/+server.ts` sets `account_id` on the User without first ensuring a `DotaUser` row exists. The `authenticate` endpoint and `setAccountId` action both do this correctly via `dotaUser.upsert`. Fix: add the same upsert before the user update.

**B. Duplicate `deriveAccountId` function**

`deriveAccountId()` is copy-pasted in:
- `src/routes/api/auth/steam/link/callback/+server.ts:10`
- `src/routes/api/auth/steam/authenticate/+server.ts:15`

Extract to `src/lib/server/steam-utils.ts`:
```typescript
export function deriveAccountId(steamId: string): number {
  return Number(BigInt(steamId) - 76561197960265728n);
}
```

Both files import from this shared module.

### 6. Files Modified

| File | Change |
|---|---|
| `src/routes/profile/+page.svelte` | Full visual redesign — violet palette, new layout, onboarding overlay |
| `src/routes/profile/+page.server.ts` | Add `isAccountLocked` to load return, update `setAccountId` conflict logic |
| `src/routes/api/auth/steam/link/callback/+server.ts` | Add `createDotaUser` upsert, replace hard error with account_id clearing, import shared `deriveAccountId` |
| `src/routes/api/auth/steam/authenticate/+server.ts` | Import shared `deriveAccountId` instead of local copy |
| `src/lib/server/steam-utils.ts` | **New file** — shared `deriveAccountId` and `isAccountLocked` functions |

### 7. Testing

- Unit tests for `isAccountLocked` (various steam_id / account_id combinations)
- Unit tests for `deriveAccountId` (known steam_id → account_id conversions)
- Unit tests for conflict resolution logic in `setAccountId` (locked rejection, unlocked pass-through)
- Manual testing: onboarding flow (Steam path, manual path, skip), overlay dismiss + URL cleanup, mobile responsiveness
