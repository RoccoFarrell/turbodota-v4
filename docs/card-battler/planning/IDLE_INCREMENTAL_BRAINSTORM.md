# Idle / Incremental Mechanics – Brainstorm

This document explores ways to add idle and incremental mechanics to the card battler **without replacing** the core loop (Dota wins → claim cards → forge → deck → battle). Idle mechanics should **augment** progression and give something meaningful to do or earn when not actively playing battles or Dota.

**Current architecture (summary):**
- **Acquisition**: Win Dota matches → claim 1–4 COMMON cards per win (performance-based).
- **Progression**: Forge 3→1 rarity; build decks (10 cards, 5 decks max).
- **Battle**: Turn-based, 10 floors, elites at 3/6/9, boss at 10; deterministic, full state persisted; gold on runs (shop/events planned later).
- **Stats**: `BattlerUserStats`, `BattlerCardStats` for lifetime battle/card stats.

---

## Design principles for idle/incremental

1. **Dota remains the main card source** – Idle should not make Dota wins irrelevant.
2. **Reuse existing systems** – Prefer hooks into battles, forge, decks, and stats.
3. **Optional depth** – Casual players can ignore idle; engaged players get extra progression.
4. **Deterministic where possible** – Aligns with current battle and testability goals.
5. **Clear caps or diminishing returns** – Avoid infinite offline gains that trivialize the game.

---

## Idea 1: Passive resource (“Dust” or “Shards”)

**Concept:** A currency that accumulates over real time (e.g. per hour, capped per day). Spend it to:
- Buy a small number of COMMON cards (e.g. 1 random COMMON per X dust), or
- “Dust discount” on forge (e.g. 2 cards + dust instead of 3 cards).

**Integration:**
- New: `BattlerUserStats.dustBalance` (or new `BattlerIdleProgress` table), `lastDustClaimAt`.
- Cron or on-login: compute elapsed time since `lastDustClaimAt`, add dust with cap (e.g. 24h max).
- New or extended API: `GET/POST .../idle/claim-dust`, `POST .../idle/spend-dust` (e.g. for random COMMON or forge assist).

**Pros:** Simple, clear, works offline (claim on next visit).  
**Cons:** Can dilute “play Dota for cards” if caps are too generous.  
**Mitigation:** Low cap (e.g. 1–2 COMMON equivalent per day), so Dota stays primary.

---

## Idea 2: Auto-battles / expeditions (background runs)

**Concept:** “Send” your active deck on an expedition. A simulated run (same battle engine, deterministic) runs over real time: e.g. 1 floor per 30 minutes. When you return, you get rewards (gold, maybe 1 COMMON, or dust) based on floors cleared. No manual turns; server “ticks” progress when you’re away.

**Integration:**
- Reuse: `BattlerRun`, battle state, encounter resolution.
- New: `BattlerExpedition` (or flag on `BattlerRun`): `type = EXPEDITION`, `startedAt`, `tickIntervalMinutes`, `lastTickAt`, `status`.
- Server: job or on-request “tick” that advances expedition by N turns/floors using existing deterministic battle logic; persist state; when encounter ends, advance to next or complete.
- Rewards: Grant gold to run or to a global “expedition gold” balance; optionally 1 COMMON or dust for full completion.

**Pros:** Uses existing battle system; adds idle without changing core manual battle.  
**Cons:** Implementation and tuning (speed, rewards, balance).  
**Fit:** High – reuses `BattlerRun`, encounter resolution, and deterministic design.

---

## Idea 3: Prestige / ascension (reset with permanent bonuses)

**Concept:** After beating floor 10, player can “prestige”: reset collection or run progress (or a separate “prestige tier”) and gain a permanent bonus, e.g.:
- +1 base energy per run,
- Start each run with a random relic,
- Small % boost to card stats in battles.

**Integration:**
- New: `BattlerUserStats.prestigeLevel` (or `BattlerPrestige` table), `prestigeBonuses` (JSON or columns).
- Battle/run start: read prestige level and apply bonuses to `maxEnergy`, starting relics, or card stat modifiers.
- UI: Prestige button after run completion; confirmation and one-way reset.

**Pros:** Classic incremental loop; gives long-term goal after “beat the game.”  
**Cons:** Need to define what resets (only run progress vs. cards) and balance bonuses.  
**Fit:** Complements existing run/completion stats and battle constants.

---

## Idea 4: Offline gold / merchant caravan

**Concept:** Gold already exists on runs. Add a **global** idle gold that accumulates over time (e.g. “merchant caravan” or “quest board”), capped per day. Spend in a future shop (remove card, upgrade card, buy relic for run, etc.).

**Integration:**
- New: `BattlerUserStats.idleGoldBalance`, `lastIdleGoldClaimAt` (or in a small `BattlerIdleProgress` table).
- Same pattern as dust: compute time since last claim, add gold with daily cap; claim on login or explicit “Collect” button.
- Shop (future): can consume both run gold and idle gold, or keep them separate (e.g. run gold = in-run only; idle gold = meta shop).

**Pros:** Fits planned shop/events; simple additive table/fields.  
**Cons:** Shop not built yet; can add idle gold now and wire spend later.

---

## Idea 5: Hero reputation / favor (idle per hero)

**Concept:** Per-hero “reputation” that grows over real time and/or number of battles in which that hero’s card was used. Reputation gives small bonuses when that hero’s card is played (e.g. +1 damage per 5 reputation, or +1% per level).

**Integration:**
- New: `BattlerHeroReputation` (userId, heroId, reputationPoints, lastUpdated). Grow by: time (idle) and/or battles (from `BattlerCardStats` / encounter data).
- Battle: when resolving card damage/block, look up reputation for the card’s hero and apply modifier (deterministic).

**Pros:** Encourages variety and long-term attachment to heroes; ties into existing `heroId` and card stats.  
**Cons:** Many heroes → many rows; balance must stay subtle so one hero doesn’t dominate.

---

## Idea 6: Daily / weekly idle login rewards

**Concept:** Time-gated rewards for returning: e.g. “Away 8+ hours → 1 random COMMON” or “Day 3 streak → dust + gold.” Capped so it’s a bonus, not main acquisition.

**Integration:**
- New: `BattlerUserStats.lastLoginAt`, `dailyStreak`, `lastDailyRewardDate` (or small `BattlerIdleProgress`).
- On login (or first battler page load): if elapsed > threshold, grant reward and update streak/date.
- Reuse existing card grant path (e.g. same as claim, but for “idle” source) so collection and forge stay consistent.

**Pros:** Easy to add; encourages retention.  
**Cons:** Can feel “mobile game” if overdone; keep rewards small.

---

## Idea 7: “Training” or resting bonus (deck idle)

**Concept:** Cards in your active deck “rest” over real time. When you start a run, “well-rested” cards get a small one-time bonus for that run (e.g. +1 damage or +1 block for first use). Adds an idle reason to have a deck set without changing core battle rules.

**Integration:**
- New: per-deck or per-user “lastRunStartedAt” or “lastRestAt”; compute “rest duration” when starting a run.
- Run start: store in run or battle state a modifier per card (e.g. `restBonus: 1`). First time that card is played this run, add the bonus then clear it (or apply once per card per run).

**Pros:** Lightweight; ties deck choice to idle.  
**Cons:** Risk of feeling mandatory; keep bonus small and optional.

---

## Idea 8: Dispatch / missions (cards “busy” on a mission)

**Concept:** Send a subset of your cards (e.g. “3 heroes”) on a timed mission (2h, 8h, 24h). Those cards are locked (not usable in deck) until the mission completes. On completion: gold, dust, or 1 COMMON.

**Integration:**
- New: `BattlerMission` (userId, cardIds or heroIds, startedAt, durationMinutes, status, rewardsClaimed).
- Deck validation: if a card is on an active mission, it can’t be in any deck (or greyed out with “on mission”).
- When mission ends (cron or on next request): mark complete, grant rewards, unlock cards.

**Pros:** Idle loop that uses the collection; encourages multiple decks or heroes.  
**Cons:** More state and UI (“Mission” tab, timers); balance so missions don’t feel punishing.

---

## Idea 9: Tower / base (generates resources over time)

**Concept:** A simple “base” or “tower” that the user upgrades with gold/dust. Each level increases passive generation (gold or dust per hour). Upgrades take time and/or resources. Fits a classic idle game fantasy.

**Integration:**
- New: `BattlerBase` or `BattlerTower` (userId, level, lastCollectedAt, upgradeFinishedAt).
- Generation: level → rate; collect on interval (capped). Upgrade: spend resources, set `upgradeFinishedAt`; after that time, increment level.

**Pros:** Clear long-term progression.  
**Cons:** More systems (buildings, upgrade curves); can be a later phase after simpler idle (e.g. dust/gold) is in.

---

## Idea 10: Run modifiers / contracts (idle-unlocked)

**Concept:** Special run types (“Double gold,” “Extra relic,” “Elite every floor”) that unlock over real time (e.g. one “contract” every 24h). Player chooses when to consume one for a run. Runs stay the same; only modifiers change.

**Integration:**
- New: `BattlerUserStats.contractsAvailable`, `lastContractGrantedAt` (or small table).
- Run start: if “contract” run selected, consume one and apply modifier (e.g. double gold in encounter rewards, or force elite).
- Encounter generation and rewards already support modifiers; this just gates and applies them.

**Pros:** Reuses run/encounter design; no new battle mechanics.  
**Cons:** Need to define and balance modifier set.

---

## Suggested implementation order (if you add idle)

1. **Low risk, high clarity**
   - **Idle gold** (Idea 4) and/or **dust** (Idea 1): one small table or a few columns, claim-on-login, daily cap. No change to battles.
   - **Daily/login rewards** (Idea 6): similar; reuses card grant and stats.

2. **Reuse battle system**
   - **Expeditions** (Idea 2): reuses deterministic battles and run/encounter model; adds an “expedition” run type and tick job.

3. **Long-term meta**
   - **Prestige** (Idea 3): once floor 10 is beatable and rewarding; then **tower/base** (Idea 9) or **contracts** (Idea 10) if you want more depth.

4. **Collection depth**
   - **Hero reputation** (Idea 5) and **dispatch missions** (Idea 8): after core idle and shop are in, to avoid scope creep.

---

## Schema hooks (minimal)

To keep options open without committing to one design:

- **Option A – columns on existing stats**
  - Add to `BattlerUserStats`: `idleGold`, `dustBalance`, `lastIdleClaimAt`, `prestigeLevel` (nullable). Good for 1–2 simple idle currencies and prestige.

- **Option B – dedicated idle table**
  - `BattlerIdleProgress`: userId, dustBalance, idleGold, lastDustClaimAt, lastGoldClaimAt, dailyStreak, lastDailyRewardDate, contractsAvailable, lastContractAt. Keeps `BattlerUserStats` battle-focused and groups all idle state.

- **Option C – both**
  - Prestige and “active” run-related stats stay on `BattlerUserStats`; all time-based currencies and login rewards in `BattlerIdleProgress`. Expeditions/missions/tower get their own tables when you implement those ideas.

---

## Summary table

| Idea              | Idle? | New DB/API      | Reuses battle/forge? | Complexity |
|-------------------|-------|-----------------|----------------------|------------|
| 1. Dust/Shards    | Yes   | Balance + claim | Forge / card grant   | Low        |
| 2. Expeditions    | Yes   | Expedition + tick | Run + encounters  | High       |
| 3. Prestige       | No    | Prestige level  | Run start / stats    | Medium     |
| 4. Idle gold      | Yes   | Balance + claim | Future shop          | Low        |
| 5. Hero reputation| Partial | Reputation table | Card resolution   | Medium     |
| 6. Login rewards  | Yes   | Streak + dates  | Card grant           | Low        |
| 7. Rest bonus     | Yes   | Rest timestamp  | Run start / play     | Low        |
| 8. Dispatch       | Yes   | Missions table  | Deck validation      | Medium–High|
| 9. Tower/Base     | Yes   | Base + upgrades | Generation only      | Medium     |
| 10. Contracts     | Yes   | Count + date    | Run modifiers        | Low–Medium |

You can adopt one or two ideas for a “Phase 1 idle” (e.g. dust + daily rewards, or idle gold + contracts) and leave the rest for a later phase so that Phase 1.1 of the main roadmap stays focused on enums, types, and core utilities.
