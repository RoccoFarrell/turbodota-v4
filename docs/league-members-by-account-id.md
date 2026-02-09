# League members added by Dota account ID

## 1. How we handle this flow today

When a commissioner adds a user **by account ID** (e.g. from Dotabuff `https://dotabuff.com/players/65110965`):

- **Server:** `addLeagueMembers` in `src/routes/leagues/[slug]/+page.server.ts` calls `createDotaUser(account_id)` for each ID, then connects those `DotaUser` records to the league.
- **createDotaUser** (`src/routes/api/helpers.ts`) only **upserts `DotaUser`** with `account_id`, `createdDate`, `lastUpdated`. It does **not** create or update a `User` record.
- **User** is created only when someone **logs in via Steam** (`src/routes/api/auth/steam/authenticate/+server.ts`), which sets `username`, `profile_url`, `avatar_url`, etc. from Steam and links that `User` to the existing `DotaUser` via `account_id`.

So for “add by ID” we only have a **DotaUser**; there is no **User** and no name/avatar. The UI already handles this by falling back to `account_id` when `user` is missing (e.g. `friend?.user?.username || friend.account_id` in the league members table).

---

## 2. Can we get name/avatar without Steam login?

**Yes.** OpenDota exposes public profile data by account ID (no Steam auth):

- **Endpoint:** `GET https://api.opendota.com/api/players/{account_id}`
- **Response** includes `profile` with:
  - `personaname` – display name
  - `avatar` / `avatarmedium` / `avatarfull` – avatar URLs
  - `profileurl` – Steam profile URL

So we can, when adding a member by ID (or in a background job), call OpenDota and store this data. Two clean options:

- **Option A – Store on DotaUser (recommended):** Add optional `display_name` and `avatar_url` (or `profile_url`) on `DotaUser`. When adding by ID, call OpenDota and set these. UI: `member.user?.username ?? member.display_name ?? member.account_id` (and same for avatar). No `User` record until they log in; when they do, Steam auth can overwrite/merge as needed.
- **Option B – Stub User:** Create a minimal `User` row (e.g. `username = personaname`, `avatar_url` from OpenDota) with no auth keys so they can’t log in yet. Requires care at first Steam login to match by `account_id` and attach keys / merge instead of creating a second User.

Option A avoids touching auth and keeps “display info for league members” on `DotaUser`.

---

## 3. Recent matches per member: turbo vs ranked

**Data we have:**

- **Match** table has `account_id` and `game_mode` (Int).
- **Game modes (Valve/OpenDota):** Turbo = **23**, Ranked All Pick = **22**. Other ranked modes exist (e.g. 19 Captains Mode); you can define a small set of “ranked” `game_mode` IDs.
- League members are **DotaUser**; each has `account_id`. Matches are keyed by `account_id`.

So we can:

- For a given league, take `member.account_id` for each member.
- Query **Match** (and/or your existing match-fetch pipeline) for those `account_id`s.
- **Turbo:** `WHERE account_id IN (...) AND game_mode = 23` (and optionally filter by `start_time` for “recent”, e.g. last 30 days).
- **Ranked:** `WHERE account_id IN (...) AND game_mode IN (22, 19, ...)` (same recency filter if desired).
- Aggregate per member: e.g. `COUNT(*)` grouped by `account_id` and `game_mode` (or “turbo” vs “ranked”), so you get “recent turbo count” and “recent ranked count” per league member.

Today, **updateMatchesForUser** only fetches **turbo** (`game_mode=23`). To get ranked counts you’d either:

- Extend that (or a similar job) to also fetch and store matches for ranked `game_mode`s, or
- Use OpenDota’s `GET /players/{account_id}/matches?game_mode=22&date=30` (and other modes) and aggregate without persisting, or
- Use Stratz GraphQL (as in `src/routes/api/players/[slug]/matches/+server.ts`) with the right `gameModeIds` and date window and then store or aggregate.

**Summary:** Yes – you can query how many recent matches each league member has, split by turbo vs ranked, using `Match.game_mode` (23 = turbo, 22 = ranked all pick, etc.) and optional date filters; filling that data may require also ingesting ranked matches (OpenDota/Stratz) in addition to turbo.

---

## Suggested next steps

1. **Profile for add-by-ID:** Add `display_name` and `avatar_url` to **DotaUser** (migration). In `addLeagueMembers`, after `createDotaUser(account_id)`, call `GET https://api.opendota.com/api/players/{account_id}` and update that DotaUser’s display fields (with rate-limit/error handling). Update league UI to use `member.user?.username ?? member.display_name ?? member.account_id` and the same for avatar.
2. **Recent matches (turbo vs ranked):** Define “recent” (e.g. last 30 days) and “ranked” game modes (e.g. 22). Add an API or load function that, for a league’s members, returns per `account_id`: `{ turbo: number, ranked: number }` from `Match` (and optionally from OpenDota/Stratz if you don’t store all modes yet). Optionally extend match ingestion to include ranked `game_mode`s so DB counts stay up to date.
