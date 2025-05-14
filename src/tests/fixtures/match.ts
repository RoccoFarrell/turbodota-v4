/**
 * Creates a mock Dota 2 match with optional overrides
 */
export const createMockMatch = (overrides: Record<string, any> = {}) => ({
  match_id: 123456,
  player_slot: 0,
  radiant_win: true,
  hero_id: 1,
  start_time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  duration: 1800, // 30 minutes
  kills: 5,
  deaths: 3,
  assists: 10,
  gold_per_min: 500,
  xp_per_min: 600,
  ...overrides
});

/**
 * Creates a mock OpenDota API response with optional overrides
 */
export const createMockOpenDotaResponse = (overrides: Record<string, any> = {}) => ({
  json: () => Promise.resolve([createMockMatch(overrides)])
});

/**
 * Creates a mock fetch response for OpenDota API
 */
export const createMockFetchResponse = (overrides: Record<string, any> = {}) => ({
  json: () => Promise.resolve([createMockMatch(overrides)])
}); 