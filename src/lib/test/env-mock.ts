/**
 * Mock for $env/dynamic/private used by Vitest.
 * Provides empty env values so server modules can be imported in tests.
 */
export const env: Record<string, string> = {};
