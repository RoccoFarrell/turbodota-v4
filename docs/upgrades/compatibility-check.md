# Compatibility Check - Phase 1.2

Generated: 2025-11-03

## ⚠️ Important Note

The `node_modules` directory is from a previous migration attempt and will be discarded. This analysis is based on **current `package.json` versions**, not what's installed.

We will perform a fresh `npm install` after updating `package.json` during the migration process.

## Current State Analysis

### Package.json Versions (Current)

| Package | Current (package.json) | Target | Status |
|---------|------------------------|--------|--------|
| svelte | ^4.2.7 | ^5.x | ⏸️ Needs upgrade |
| @sveltejs/kit | ^2.0.6 | ^2.x (latest) | ⚠️ May need minor update |
| tailwindcss | 3.3.5 | 4.x | ⏸️ Needs major upgrade |
| @skeletonlabs/skeleton | 2.5.1 | 4.x (via v3 → v4) | ⏸️ Needs upgrade |
| @skeletonlabs/tw-plugin | 0.2.4 | 0.4.x | ⏸️ Needs upgrade |
| bits-ui | ^0.11.8 | ^2.x (for Svelte 5) | ⏸️ Needs upgrade |
| svelte-chartjs | ^3.1.2 | ^3.x (latest) | ✅ Should work with Svelte 5 |

## Compatibility Verification

### ✅ Expected to be Compatible with Svelte 5

1. **svelte-chartjs v3.1.2**
   - Status: ✅ Should work with Svelte 5
   - Note: Package.json has override `"svelte": ">=4.x"` which will need updating after Svelte 5 migration
   - Action: Update to latest v3.x and remove/update override after Svelte 5 upgrade

2. **bits-ui**
   - Current: ^0.11.8 (v0.x series - Svelte 4)
   - Target: ^2.x (Svelte 5 compatible)
   - Status: ⏸️ Needs upgrade to v2.x for Svelte 5 support

### ⚠️ Compatibility Concerns

1. **svelte-headless-table v0.17.7**
   - Status: ⚠️ May not fully support Svelte 5
   - Notes: Latest version is v0.18.3 according to npm outdated
   - Action: Update to v0.18.3 during Phase 2 non-breaking updates

2. **mdsvex v0.11.0**
   - Status: ⚠️ May need update for Svelte 5
   - Notes: Latest version is v0.12.6
   - Action: Update to v0.12.6 during Phase 2 non-breaking updates

3. **@testing-library/svelte ^4.0.5**
   - Status: ⚠️ v4.x is for Svelte 4
   - Target: v5.x for Svelte 5
   - Action: Update to v5.x after Svelte 5 migration

4. **svelte-confetti ^1.3.1**
   - Status: ⚠️ May need update
   - Action: Check for Svelte 5 compatible version during Phase 4

### Skeleton v3 Requirements Check

According to [Skeleton v3 migration guide](https://v3.skeleton.dev/docs/get-started/migrate-from-v2):

**Prerequisites** (must be completed in order):
1. ⏸️ **Svelte v5**: Currently ^4.2.7 - needs upgrade (Phase 3)
2. ⏸️ **SvelteKit v2**: Currently ^2.0.6 - needs verification (Phase 4)
3. ⏸️ **Tailwind v4**: Currently 3.3.5 - needs upgrade (Phase 5)

**Before Tailwind v4 migration** (Phase 5.1):
1. Remove Skeleton plugin from `tailwind.config.ts`
2. Rename `app.pcss` to `app.css`
3. Remove `purgecss` plugin from `vite.config.ts`

### Migration Order Summary

The correct order based on package.json (not installed versions):
1. Phase 3: Upgrade Svelte to v5
2. Phase 4: Upgrade SvelteKit to v2 (latest)
3. Phase 5: Upgrade Tailwind to v4 (with manual prep steps)
4. Phase 6: Migrate Skeleton v2 → v3
5. Phase 7: Migrate Skeleton v3 → v4

## Recommendations

1. **Clean Install**: After each phase, run `npm install` to ensure clean state
2. **Update svelte-headless-table**: Update to v0.18.3 in Phase 2 (non-breaking updates)
3. **Update mdsvex**: Update to v0.12.6 in Phase 2 (non-breaking updates)
4. **Follow migration order strictly**: Follow the phases in order - don't skip ahead
5. **Test after each phase**: Verify build and basic functionality after each major upgrade
6. **Remove svelte-chartjs override**: After Svelte 5 migration, verify if override is still needed

## Security Audit Results (Phase 1.3)

**npm audit** found **19 vulnerabilities**:
- 2 low
- 11 moderate
- 4 high
- 2 critical

### Critical Issues
1. **vitest** (1.0.0 - 1.6.0): Remote Code Execution vulnerability
   - Fix: Update to latest version
2. **form-data** (4.0.0 - 4.0.3): Unsafe random function
   - Fix: Update via `npm audit fix`

### High Severity Issues
1. **axios** (1.0.0 - 1.11.0): SSRF and credential leakage
   - Fix: Update to latest
2. **devalue** (<5.3.2): Prototype pollution
   - Fix: Update via `npm audit fix`
3. **playwright** (<1.55.1): SSL certificate verification issue
   - Fix: Update to latest

### Moderate Issues
- @babel/runtime, @sveltejs/kit, esbuild, nanoid, prismjs, tar

**Note**: Many of these will be resolved when upgrading packages to latest versions during the migration process.

## Codebase Analysis (Phase 1.3)

### Svelte 4 Patterns to Migrate

**Reactive Statements (`$:`):**
- **Count**: 98 instances across 29 files
- **Files with most usage**:
  - `src/routes/+layout.svelte` (2 instances)
  - `src/routes/turbotown/*` (multiple files)
  - `src/routes/dotadeck/*` (multiple files)
  - `src/routes/leagues/*` (multiple files)

These will need to be converted to Svelte 5 runes (`$state`, `$derived`, `$effect`) during migration.

### Components Using Skeleton UI

Based on codebase structure, Skeleton UI is used in:
- Layout components (`+layout.svelte`)
- Navigation components
- Various route pages

## Next Steps

1. ✅ Verify Compatibility (Phase 1.2) - Complete
2. ✅ Audit Current Codebase (Phase 1.3) - Complete
3. ⏭️ Phase 1.4: Set Up Testing Baseline

