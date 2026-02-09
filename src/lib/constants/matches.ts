/**
 * Site-wide match date cutoff for testing and data volume.
 * Matches with start_time before this (Unix seconds) are not stored or returned.
 * 2026-01-01 00:00:00 UTC
 */
export const MATCH_CUTOFF_START_TIME = BigInt(
	Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000)
);

/** Number of days to consider "recent" for league member match counts (turbo vs ranked). */
export const RECENT_MATCH_DAYS = 30;

/**
 * When a DotaUser has no newestMatch yet, we fetch this many days from OpenDota for the initial backfill.
 * Otherwise the code would use "days since created" and only get 0–1 day for newly added users.
 */
export const INITIAL_FETCH_DAYS = 30;

/** Turbo mode (Valve/OpenDota game_mode ID). */
export const GAME_MODE_TURBO = 23;

/** Ranked game modes for "recent ranked" counts (22 = Ranked All Pick, 19 = Captains Mode, etc.). */
export const GAME_MODES_RANKED = [22, 19];
