# Essence & Browser Action System (Planning)

**Status**: Planning only — no code changes.  
**Purpose**: Define the foundation for (a) **building your hero roster** and (b) **passive incremental training** (idle-game style). This doc covers the **browser-based passive counter** and **Essence** as the first use of that system.

**Related**: [CORE_CONCEPT.md](./CORE_CONCEPT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).

---

## 1. Goals

1. **Essence** as the **meta-currency** for the incremental game (separate from run **gold**). Used for roster building, upgrades, and later for training-related unlocks.
2. **Mining** as the first **passive browser activity**: user “mines” Essence at a base rate, with a **progress bar per strike** (Melvor-idle style: action takes X seconds per completion).
3. A **robust, reusable browser action system** that will underpin:
   - Mining (Essence per strike)
   - Future: **Training** (e.g. “Train Axe – Health” → bar fills → stat progress)
   - Future: other passive activities (gathering, crafting, etc.)

The same “action takes time per completion, bar fills, reward on complete” loop should be **one generic system**, not one-off code per activity.

---

## 2. Browser Action System (Generic Foundation)

### 2.1 Core Abstraction

- **One active action per user** at a time (e.g. “Mining” or “Training Hero 5 – Health”). Switching action type is allowed; switching **resets progress** for the previous action (or we define a “pause and resume” rule; see open points).
- Each **action** has:
  - **Action type id** (e.g. `mining`, `training_hero_5_health`).
  - **Duration per completion** (seconds per “strike” or per “tick”). This is the **interval** the bar must fill.
  - **Rate modifier** (optional): a multiplier or additive modifier so we can support “+20% mining speed” later without changing the core loop. Default 1.0.
  - **Reward** (defined per action type): on completion, grant something (e.g. Essence for mining; stat progress for training).

So: **progress** goes from 0 to 1 over **duration (seconds) / rate**. When progress ≥ 1, we **complete** the action (grant reward, reset progress to 0 and continue, or stop if action is finite).

### 2.2 Progress and Time

- **Progress** is a number in [0, 1] (or 0–100% for display).
- **Elapsed time** within the current strike: `progress = elapsed / effectiveDuration`, where `effectiveDuration = baseDuration / rateModifier` (or equivalent formula).
- **Time source**: Real time in the browser (e.g. `Date.now()` or a tick driven by `requestAnimationFrame` / `setInterval`). The engine advances progress by **delta time** since last tick (so FPS-independent and easy to test).
- **Tick loop** (client):
  - Every N ms (e.g. 100–200 ms), compute `deltaTime = (now - lastTickAt) / 1000` (seconds).
  - Add `deltaTime` to “elapsed time for current strike.”
  - If elapsed ≥ effective duration: grant reward, reset elapsed to 0 (or to overflow if we allow partial carry).
  - Persist **lastTickAt** (and current action state) so that when the user returns to the tab we can either **resume** (simple) or **catch up** (offline progress; see below).

### 2.3 Persistence and Authority

- **Server** is the source of truth for:
  - User’s **Essence balance** (and any other currencies).
  - Which action type is active (if we persist “current action”).
  - Optional: last action tick timestamp, progress (so server can validate or run catch-up).
- **Client** holds:
  - Current action type, progress (0–1), lastTickAt.
  - On each “strike” completion (mining): client sends “I completed a strike” (or “grant me 1 Essence”) and server validates and adds Essence (e.g. rate-limit by time to prevent cheating).
- **Validation**: Server should not trust client for currency. Two patterns:
  - **A) Client ticks, server reconciles**: Client sends periodic “heartbeat” with lastTickAt and progress; server computes how many strikes could have happened in that time (with server-known rate), grants Essence, returns new balance. Prefer this for anti-cheat.
  - **B) Server ticks on request**: Client says “advance my action by deltaTime”; server advances and returns new state + rewards. Requires client to send deltaTime frequently (e.g. every 200 ms) or batch when tab regains focus. Same idea: server authoritatively applies time and rewards.

Either way: **reward granting is server-side**; client only displays and sends time/state for reconciliation.

### 2.4 Offline / Background Tab

- **v1 (simple)**: Progress only while the **tab is open** (and optionally **focused**). When the user leaves and comes back, we **resume** from stored progress and lastTickAt; no “catch-up” for time spent away. Prevents exploit and keeps logic simple.
- **v2 (idle-style)**: When user returns, send “I was away since lastTickAt”; server computes elapsed time, caps it (e.g. max 24 h), and runs **catch-up**: advance action by elapsed time, grant all earned rewards (Essence, training progress, etc.). Same tick function, different input (one big deltaTime). Design the **tick function** to accept `deltaTime` so both “real-time ticks” and “catch-up” use the same path.
- **Recommendation**: Design the **engine** (duration, progress, reward per completion) to support catch-up from the start; **ship v1** with “progress only when tab open” and no catch-up; add **v2** later by enabling server-side catch-up when client reconnects.

### 2.5 Extensibility

- **New action types**: Add a new type (e.g. `training_hero_5_health`) with its own `baseDuration`, `rateModifier` (or lookup from upgrades), and **reward handler** (Essence vs. training progress vs. other).
- **Upgrades**: “Mining speed +20%” → store on user or run; when resolving **effective duration** for mining, apply `baseDuration / (1 + 0.2)`. Same for “Training speed” later. The **browser action system** only needs a way to read “current rate” for the active action (from constants, user upgrades, or server).
- **Multiple resources**: Mining grants Essence; training grants “stat progress” for a (userId, heroId, statKey). The **reward** step is a plug-in per action type; the bar and timer logic stay generic.

---

## 3. Essence

### 3.1 Role

- **Essence** = primary **meta-currency** for the incremental game (persistent across runs).
- **Gold** = in-run currency (StS map: combat rewards, shops). Not used for roster building or training unlocks.
- Essence is used (current and future design) for:
  - **Converting a Dota 2 win into a roster hero**: spend Essence to turn **one win from the user’s last 10 games** into adding that hero to their roster (see §5).
  - Upgrading **mining** (faster rate, more Essence per strike).
  - Possibly: training-related unlocks or boosts (e.g. unlock “Training slot 2”).

### 3.2 Storage and API

- **Storage**: Per-user balance, e.g. `User.essence` or `IncrementalWallet` (userId, essence, updatedAt). Server-only; never trust client balance for spending.
- **API** (to be added in implementation phase):
  - `GET /api/incremental/wallet` or `GET /api/incremental/essence` — return current Essence balance (and any other meta-currencies).
  - When mining completes a strike: server grants Essence (via reconciliation or tick endpoint). No client “add Essence” call; grant is a side effect of **action tick** or **action complete**.
  - Spending: e.g. `POST /api/incremental/roster/convert-win` with body `{ matchId }` (or `{ gameIndex }`); server validates win is in last 10, deducts Essence, adds that hero to roster. See §5.

---

## 4. Mining (First Action)

### 4.1 Behavior

- **Action type**: `mining`.
- **Mechanic**: One “strike” every **X seconds** (base). Each strike grants **Y Essence** (base). Example: 1 Essence per 3 seconds (base); tune for feel.
- **Progress bar**: Fills from 0% to 100% over the **effective duration** of one strike. On 100%, grant reward (Essence), reset bar to 0%, continue to next strike (infinite loop until user switches action).
- **UI**: Bar visible on the incremental page (or a dedicated “Mining” / “Idle” panel). Optional: numeric countdown “Next strike in 2.1s” and “+1 Essence per strike.”

### 4.2 Extensibility

- **Base rate**: Stored in constants or config (e.g. `MINING_BASE_DURATION_SEC = 3`, `MINING_ESSENCE_PER_STRIKE = 1`).
- **Upgrades** (later): e.g. “Mining speed +10%” (reduce effective duration) or “Double Essence” (2 per strike). Applied via **rate modifier** or **reward modifier** when resolving the action. No change to the generic bar/tick loop.

### 4.3 Single Active Action

- While user is “mining,” the **active action** is mining. When we add **Training**, user can switch to “Train Axe – Health”; then the **active action** is training, and mining **pauses** (progress saved and resumed when they switch back, or progress reset — TBD). Same backend and UI pattern: one active action, one bar, one reward type.

---

## 5. Roster Building: Convert Win → Roster Hero

- **Roster** = the set of heroes the user has **unlocked** for use in lineups (and training). Heroes get on the roster via Dota 2 integration (e.g. wins, forge) and/or by spending **Essence** to convert a recent win.

### 5.1 Convert one win from last 10 games

- **Mechanic**: The user spends **Essence** to **convert one win from their last 10 Dota 2 games** into adding that hero to their roster.
- **Flow**:
  1. User has match history (last 10 games) from existing Dota 2 integration. Some of those may be **wins**; each win is on a specific **hero** (Hero.id).
  2. User chooses **one** of those wins (e.g. “Game 3: won on Lina”) and pays an **Essence cost**.
  3. Server validates: (a) the match is in the user’s last 10, (b) the match was a **win**, (c) user has enough Essence, (d) optionally that the hero is not already on the roster (or allow duplicate for stars/dupes; TBD).
  4. Server deducts Essence and adds that **hero** (Hero.id) to the user’s roster (persist in e.g. `IncrementalRoster` or “unlocked hero” list per user).
- **Result**: That hero is now available for lineups and training. The **same win** cannot be converted again (one conversion per match; mark match as “converted” or remove from eligible pool after use).

### 5.2 Design details (to pin down in implementation)

- **Eligible pool**: “Last 10 games” = last 10 matches we have for this user (from existing match-fetch / Stratz etc.). Only **wins** are eligible for conversion.
- **Cost**: Flat Essence cost per conversion (tune for balance), or cost that depends on hero rarity / role (TBD).
- **Already on roster**: If the user already has that hero on their roster, either (a) disallow (“already unlocked”), or (b) allow and grant a “dupe” effect (e.g. star, shard, or stat boost). Recommend (a) for v1.
- **Idempotency**: Each real match (matchId) can only be converted once. Store “converted match ids” per user so we don’t double-spend the same win.

### 5.3 Passive training (later)

- Same browser action system; action type “training” with parameters (heroId, statKey). Bar fills per “training tick”; reward = progress to that hero’s stat. Training will be **per-hero, per-stat** and persist (as in CORE_CONCEPT and ARCHITECTURE). No change to the generic action system.

---

## 6. Summary Table

| Concept | Description |
|--------|-------------|
| **Browser action system** | One active action; progress 0→1 over effective duration; on complete, grant reward (type-specific); tick with deltaTime; server authoritatively applies time and rewards. |
| **Time source** | Real time in browser; deltaTime since last tick; design supports optional offline catch-up (v2). |
| **Essence** | Meta-currency; server-stored; earned by mining; spent to **convert one win from last 10 games** into adding that hero to roster, and on upgrades. |
| **Convert win → roster** | User picks a **win** from last 10 Dota 2 games; pays Essence; that hero is added to roster. One conversion per match; only wins eligible. |
| **Mining** | First action: bar fills per strike; base X s per strike, Y Essence per strike; extensible with upgrades. |
| **Extensibility** | New action types (e.g. training); rate/reward modifiers; same bar and tick loop. |

---

## 7. Open Decisions (for later)

- **Pause vs. reset on action switch**: When user switches from Mining to Training, do we save mining progress and resume later, or reset mining progress? (Affects UX and persistence shape.)
- **Tab focus**: Should progress only advance when the tab is **focused**, or whenever the tab is **open**? (Melvor often uses “open” so background tabs still progress; some games use “focused” to encourage engagement.)
- **Catch-up cap**: If we add offline catch-up, what cap? (e.g. 24 h, 8 h, or “no cap” with diminishing returns.)
- **Exact base numbers**: Mining base duration and Essence per strike (tune in implementation).
- **Convert-win cost**: Flat Essence per conversion vs. variable by hero (tune for balance).
- **Convert win when hero already on roster**: Disallow (v1) vs. allow and grant dupe/star effect.

---

## 8. Suggested Implementation Order (when you leave planning)

1. **Types and constants**: Action type enum/union; mining constants (duration, reward); wallet/essence in schema.
2. **Server action engine** (pure logic): Given (actionType, progress, lastTickAt, now), compute new progress and list of “completions” (rewards). No persistence yet.
3. **API**: Persist Essence; endpoint to “tick” or “reconcile” action (client sends lastTickAt + progress; server returns new balance + new progress).
4. **Client**: Tick loop (requestAnimationFrame or setInterval); progress bar; on interval send tick to server; display Essence from server.
5. **Mining UI**: Dedicated bar and label “Mining” with “Next strike in X.Xs” and “+Y Essence per strike.”
6. **Roster building**: Separate doc + implementation (spend Essence to unlock heroes, etc.).
7. **Training**: Reuse same action system with action type “training” and reward = stat progress; separate design doc for training content and persistence.

This document stays **planning-only** until you approve; then it can drive a new “Phase 7.5” or “Phase 8a” in the roadmap (Essence + browser actions before or alongside Battle UI).
