/**
 * Shared test setup for the project.
 * Used by Vitest via vitest-setup.ts (globals, matchers).
 *
 * Incremental game tests under src/lib/incremental/ do not require
 * database or other global hooks; they run as plain unit tests.
 *
 * No card-battler / deck-battler setup lives here. Battler tests
 * that need a DB should use their own setup module if reintroduced.
 */
