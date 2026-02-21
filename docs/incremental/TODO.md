# Incremental – TODO

Backlog and near-term improvements for the incremental game. See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for the full phased plan.

---

## 1. User onboarding journey

**Goal:** Guided first-time experience (e.g. mine → recruit → train → lineup → run + rewards).

- [ ] Define onboarding steps and copy (tooltips, short tutorials, or a step-by-step flow).
- [ ] Implement state/cookie/DB flag so we know if the user has completed onboarding.
- [ ] Add UI (modals, highlights, or a small “first run” path) that guides through core actions.
- [ ] Optionally tie a small reward or badge to completing onboarding.

**Relevant:** [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) Phase 16 (User Onboarding), layout/navigation in `src/routes/+layout.svelte`, incremental routes under `src/routes/incremental/`.

---

## 2. Profile: reorganize and add user search

**Goal:** Reorganize profile features and add a way to search for users in the UI.

- [ ] Move/reorganize profile sections (e.g. stats, incremental progress, Dota deck, etc.) for clearer layout and navigation.
- [ ] Add a “Search for user” control (by name, Steam id, or other identifier) and results list or redirect to that user’s profile.
- [ ] Ensure profile and search work for both the current user and other users (permissions, public vs private data as needed).

**Relevant:** `src/routes/profile/+page.svelte`, `src/routes/profile/+page.server.ts`, navigation in `src/routes/_components/Navigation/Navigation.svelte`. Consider a shared user-lookup API if one doesn’t exist.

---

## 3. Profile: edit linked Dota ID

**Goal:** Let users view and edit the Dota account ID tied to their profile.

- [x] Add a section in the profile page showing the currently linked Dota ID.
- [x] Add an edit control (inline edit or modal) to update the Dota ID.
- [x] Add/update API endpoint to persist the changed Dota ID.
- [x] Validate the input (numeric, reasonable length) before saving.

**Relevant:** `src/routes/profile/+page.svelte`, `src/routes/profile/+page.server.ts`, user model in `prisma/schema.prisma`.

---

## 4. Attack speed scaling redesign

**Goal:** Replace linear attack speed formula with exponential decay so heroes approach (but never exceed) 5 attacks/sec, taking ~1 week of training to reach the cap.

- [x] Update `attackInterval` in `src/lib/incremental/stats/formulas.ts` with exponential decay formula and new constants (`MIN_ATTACK_INTERVAL`, `ATTACK_SPEED_TAU`).
- [x] Update tests in `src/lib/incremental/stats/formulas.test.ts` to cover new formula behavior (asymptote, calibration at 1-day/3-day/7-day, AGI affinity bonus, hard floor).
- [x] Verify downstream callers (`battle-loop.ts`, `resolution.ts`, `lineup-stats.ts`) work correctly with the new formula.

**Relevant:** [attack-speed-scaling-redesign.md](./attack-speed-scaling-redesign.md) for the full plan.

---

*Last updated: 2026-02-20*
