# Incremental – TODO

Backlog and near-term improvements for the incremental game. See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for the full phased plan.

---

## 1. Run history feature

**Goal:** Let players view completed runs (past runs, outcomes, stats).

- [ ] Persist completed run summaries (e.g. run id, level, outcome, duration, rewards).
- [ ] Add API endpoint(s) to list/filter run history for the current user.
- [ ] Add UI (e.g. under Map/Run or a dedicated “Run history” section) to browse and inspect completed runs.

**Relevant:** Run/encounter flow in `src/lib/incremental/run/`, save/load in `src/lib/server/incremental-save.ts`, API under `src/routes/api/incremental/`.

---

## 2. Run levels (1, 2, 3, 4) with scaled enemies

**Goal:** Introduce run levels; scale difficulty by level. Initial implementation: double all enemy stats per level.

- [ ] Extend run structure to include a `level` (e.g. 1–4). Decide where it’s stored (run config, DB, or both).
- [ ] When resolving encounters, apply a level multiplier to all enemy stats (e.g. `multiplier = 2^(level - 1)` so level 1 = 1x, 2 = 2x, 3 = 4x, 4 = 8x, or a simpler “double per level”).
- [ ] Wire level selection into run start (UI + API) and ensure battle engine uses scaled stats.

**Relevant:** Run types and encounter resolution in `src/lib/incremental/run/`, battle/encounter data in `src/lib/incremental/engine/` and encounter definitions.

---

## 3. User onboarding journey

**Goal:** Guided first-time experience (e.g. mine → recruit → train → lineup → run + rewards).

- [ ] Define onboarding steps and copy (tooltips, short tutorials, or a step-by-step flow).
- [ ] Implement state/cookie/DB flag so we know if the user has completed onboarding.
- [ ] Add UI (modals, highlights, or a small “first run” path) that guides through core actions.
- [ ] Optionally tie a small reward or badge to completing onboarding.

**Relevant:** [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) Phase 16 (User Onboarding), layout/navigation in `src/routes/+layout.svelte`, incremental routes under `src/routes/incremental/`.

---

## 4. Profile: reorganize and add user search

**Goal:** Reorganize profile features and add a way to search for users in the UI.

- [ ] Move/reorganize profile sections (e.g. stats, incremental progress, Dota deck, etc.) for clearer layout and navigation.
- [ ] Add a “Search for user” control (by name, Steam id, or other identifier) and results list or redirect to that user’s profile.
- [ ] Ensure profile and search work for both the current user and other users (permissions, public vs private data as needed).

**Relevant:** `src/routes/profile/+page.svelte`, `src/routes/profile/+page.server.ts`, navigation in `src/routes/_components/Navigation/Navigation.svelte`. Consider a shared user-lookup API if one doesn’t exist.

---

*Last updated: 2025-02-18*
