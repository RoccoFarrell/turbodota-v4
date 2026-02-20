# Plan: Attack Speed Scaling Redesign

## Context

The current `attackInterval` formula is `base / (1 + attackSpeed)`, which scales linearly — a hero reaches 5 attacks/sec after just ~7-8 training points (seconds of training). There is no effective cap. The user wants attack speed to follow a meaningful progression: hard cap at 5 attacks/sec, taking approximately 1 week of constant training to reach it.

## Approach: Exponential Decay (Asymptotic)

Replace the linear formula with an exponential decay that naturally approaches — but never exceeds — the 5 attacks/sec ceiling.

**New formula:**
```
effectiveInterval = minInterval + (BAT - minInterval) × e^(−N / TAU)
```

Where:
- `MIN_ATTACK_INTERVAL = 0.2` s (5 attacks/sec — the asymptote/hard floor)
- `ATTACK_SPEED_TAU = 20_000` training points (time constant)
- `BAT` = hero's base attack interval (unchanged from DB)
- `N` = accumulated `attack_speed` training points (unchanged — still 1 pt/completion)

**Calibration** (BAT=1.7, non-AGI hero = 720 pts/hr):
- Day 1: ~1.20 attacks/sec
- Day 3: ~3.19 attacks/sec
- Day 7: ~4.91 attacks/sec ("there" for non-AGI)
- Day 7, AGI hero (900 pts/hr): ~5.00 attacks/sec (affinity bonus pays off exactly at 1 week)

## Files to Change

### 1. `src/lib/incremental/stats/formulas.ts`

Add two exported constants above `attackInterval`:
```ts
export const MIN_ATTACK_INTERVAL = 0.2; // seconds (5 attacks/sec maximum)
export const ATTACK_SPEED_TAU = 20_000; // training points time constant (~1 week to reach cap)
```

Replace the `attackInterval` function body:
```ts
export function attackInterval(
    baseInterval: number,
    attackSpeed: number,
    options?: { minInterval?: number }
): number {
    const minInterval = options?.minInterval ?? MIN_ATTACK_INTERVAL;
    if (baseInterval <= minInterval) return minInterval;
    return minInterval + (baseInterval - minInterval) * Math.exp(-attackSpeed / ATTACK_SPEED_TAU);
}
```

Note: `options.minInterval` now sets the asymptote (not just a clamp). No production callers pass this option, so the semantic change is safe. The function signature is unchanged.

### 2. `src/lib/incremental/stats/formulas.test.ts`

Update the `attackInterval` describe block. Replace existing tests and add:
- `attackSpeed=0` → returns `baseInterval` exactly
- `attackSpeed=TAU` → interval is roughly `minInterval + (BAT - minInterval) * e^-1` (≈ 36.8% of gap remaining)
- `attackSpeed=120960` (7 days non-AGI) with `BAT=1.7` → attacks/sec ≈ 4.9 (between 4.8 and 5.0)
- `attackSpeed=151200` (7 days AGI) with `BAT=1.7` → attacks/sec ≈ 5.0 (very close to cap)
- Never below `MIN_ATTACK_INTERVAL`: high `attackSpeed` (e.g. 1,000,000) → interval ≥ 0.2
- Old `minInterval` option test: update it to reflect asymptote semantics (e.g. with custom minInterval=0.3, result approaches 0.3 but stays above it)

## No Other Changes Needed

The following files call `attackInterval()` and will automatically use the new formula:
- `src/lib/incremental/engine/battle-loop.ts` — attack trigger check
- `src/lib/incremental/engine/resolution.ts` — attack reset (resets timer to 0)
- `src/lib/incremental/stats/lineup-stats.ts` — DPS calculations for lineup display

No changes to: DB schema, training reward handler, hero affinity, action-definitions.

## Verification

1. Run `npm run test` — all formula tests pass (update count of `attackInterval` tests from ~3 to ~6+)
2. Run `npm run check` — no TypeScript errors in changed files
3. Manual check: Start a battle with a highly trained hero and verify attack rate visually approaches 5/sec and doesn't exceed it
