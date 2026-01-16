# Dependency Upgrade Plan: TurboDota v4

## 🎯 Current Status Summary

**Last Updated**: 2025-01-XX

### ✅ Completed Phases
- **Phase 1**: Pre-Upgrade Preparation ✅
- **Phase 2**: Non-Breaking Updates ✅
- **Phase 3**: Svelte 5 Migration ✅ (v5.43.3)
- **Phase 4**: SvelteKit v2 Migration ✅ (v2.48.4)
- **Phase 5**: Tailwind CSS v4 Migration ✅ **COMPLETE** (v4.1.16, config cleaned up, plugins updated)
- **Phase 6**: Skeleton v2 → v3 Migration ✅ (v3.2.2 installed)

### 🔄 Current Phase
**Phase 5.3**: Testing and verification (build/dev server testing)

### 📋 Next Steps
1. ✅ Clean up `tailwind.config.ts` - **COMPLETE**
2. ✅ Update `@tailwindcss/forms` and `@tailwindcss/typography` - **COMPLETE**
3. Test build and dev server to verify styles work correctly
4. Phase 7: Skeleton v3 → v4 Migration (if needed)
5. Final testing and cleanup

---

## Overview
This document outlines the plan to upgrade all dependencies to their latest stable versions, with special focus on:
- **Svelte 5** ✅ (upgraded to 5.43.3)
- **Tailwind CSS v4** ⚠️ (upgraded to 4.1.16, config cleanup needed)
- **Skeleton UI v3** ✅ (upgraded to 3.2.2)
- Latest stable versions of all core libraries

---

## Current State Analysis

### Core Framework Dependencies
- `svelte`: ~~^4.2.7~~ → **5.43.3** ✅ **COMPLETE**
- `@sveltejs/kit`: ~~^2.0.6~~ → **2.48.4** ✅ **COMPLETE**
- `@sveltejs/vite-plugin-svelte`: ~~^3.0.0~~ → **4.0.0** ✅ **COMPLETE**
- `@sveltejs/adapter-vercel`: **4.0.3** ✅ (current)

### UI Framework
- `@skeletonlabs/skeleton`: ~~2.5.1~~ → **3.2.2** ✅ **COMPLETE**
- `@skeletonlabs/tw-plugin`: ~~0.2.4~~ → **REMOVED** ✅ (not needed for v3)
- `tailwindcss`: ~~3.3.5~~ → **4.1.16** ✅ **COMPLETE**
- `@tailwindcss/forms`: 0.5.7 → **latest** (needs v4 update)
- `@tailwindcss/typography`: 0.5.10 → **latest** (needs v4 update)
- `@tailwindcss/vite`: **4.1.16** ✅ **INSTALLED**

### Testing & Development
- `vitest`: ^1.1.3 → **latest**
- `@vitest/ui`: ^1.1.3 → **latest**
- `@playwright/test`: ^1.40.1 → **latest**
- `@testing-library/svelte`: ^4.0.5 → **⚠️ CHECK SVELTE 5 COMPAT**

### Build Tools
- `vite`: ^5.0.0 → **latest**
- `typescript`: ^5.7.3 → **latest**
- `prettier`: ^3.0.0 → **latest**

### Other Key Dependencies
- `prisma`: ^5.6.0 → **latest**
- `lucia`: ^2.7.4 → **latest**
- `bits-ui`: ^0.11.8 → **⚠️ CHECK SVELTE 5 COMPAT**
- `svelte-chartjs`: ^3.1.2 → **⚠️ CHECK SVELTE 5 COMPAT** (has override in package.json)
- `chart.js`: ^4.4.1 → **latest**

---

## ⚠️ Critical Compatibility Concerns

### 1. Skeleton UI + Svelte 5
**Status**: Unknown - needs verification
- Check [Skeleton Labs documentation](https://www.skeleton.dev) for Svelte 5 support
- May need to wait for official Svelte 5 support or find alternatives
- **Risk**: High - extensively used throughout the codebase

### 2. Tailwind CSS v4 Migration
**Status**: Major breaking changes
- Configuration moves from JS/TS to CSS-first approach
- `tailwind.config.ts` will need significant refactoring
- Plugin system may have changed
- **Risk**: Medium-High - requires config migration

### 3. Svelte 5 Migration
**Status**: Major breaking changes
- New runes reactivity system replaces `$:` syntax
- Event handling changes
- Component composition with snippets
- **Risk**: High - requires codebase refactoring

---

## Phased Upgrade Strategy

⚠️ **IMPORTANT**: Skeleton v3 requires Svelte 5, SvelteKit v2, and latest Tailwind CSS. The upgrade order is critical.

### Phase 1: Pre-Upgrade Preparation (Estimated: 1-2 days)
**Goal**: Prepare codebase and verify compatibility

#### 1.1 Create Backup Branch
```bash
git checkout -b upgrade/dependencies-v5
git push -u origin upgrade/dependencies-v5
```
✅ **Complete**: Already on upgrade branch

#### 1.2 Verify Compatibility
- [x] Check Skeleton UI v3 requirements (Svelte 5, SvelteKit v2, Tailwind version)
- [x] Check bits-ui Svelte 5 compatibility
- [x] Check svelte-chartjs Svelte 5 compatibility
- [x] Review all Svelte-related package changelogs
- [x] Document breaking changes for each package

**See**: [compatibility-check.md](./compatibility-check.md) for detailed results

#### 1.3 Audit Current Codebase
- [x] Run `npm audit` to identify security issues (19 vulnerabilities found)
- [x] Run `npm outdated` to see current vs latest versions
- [x] Document all Svelte 4 patterns used (reactive statements, stores, etc.)
- [x] Count usage of `$:` reactive statements (98 instances across 29 files)
- [x] Identify all components using Skeleton UI

**See**: [compatibility-check.md](./compatibility-check.md) for detailed analysis

#### 1.4 Set Up Testing Baseline
- [x] Document test status (tests currently failing due to version mismatches)
- [x] Document manual testing checklist
- [ ] Set up CI/CD to catch issues early (optional)

**See**: [testing-baseline.md](./testing-baseline.md) for testing checklist

---

### Phase 2: Non-Breaking Updates (Estimated: 2-3 hours)
**Goal**: Update dependencies that don't require code changes (excluding Svelte ecosystem)

**⚠️ Note**: The `node_modules` directory is from a previous migration attempt. We'll do a clean install at the start of this phase.

#### 2.0 Clean Install (If Needed)
```bash
# Optional: Remove old node_modules for clean start
# rm -rf node_modules package-lock.json  # Unix/Mac
# Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows PowerShell
# npm install  # Fresh install from package.json
```

#### 2.1 Update Build & Dev Tools
```bash
npm install -D vite@latest typescript@latest prettier@latest
npm install -D @types/node@latest tsx@latest ts-node@latest
```

#### 2.2 Update Testing Tools
```bash
npm install -D vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest
npm install -D @playwright/test@latest
npm install -D @testing-library/jest-dom@latest jsdom@latest
```

#### 2.3 Update Non-Svelte Dependencies
```bash
npm install prisma@latest @prisma/client@latest
npm install lucia@latest @lucia-auth/adapter-prisma@latest
npm install dayjs@latest chart.js@latest clsx@latest
npm install @vercel/analytics@latest
npm install @floating-ui/dom@latest @internationalized/date@latest
```

#### 2.4 Update Utilities
```bash
npm install -D concurrently@latest cross-env@latest
npm install -D postcss@latest autoprefixer@latest
npm install tailwind-merge@latest tailwind-variants@latest
```

#### 2.5 Update Additional Packages
```bash
# Update packages that may have Svelte 5 compatible versions
npm install -D mdsvex@latest
npm install svelte-headless-table@latest
npm install svelte-confetti@latest
```

#### 2.6 Clean Install After Updates
```bash
# Ensure clean state after all updates
npm install
```

#### 2.7 Test After Updates
- [x] Run `npm run build` - ensure build succeeds ✅ (build successful, only adapter warning about Node version)
- [ ] Run `npm run test` - ensure tests pass (may still fail if Svelte 5 not yet installed)
- [ ] Run `npm run dev` - verify dev server works
- [ ] Manual smoke test of application

**Note on Lucia/Prisma Compatibility**: 
- Lucia v3 is deprecated and requires a full migration (breaking change)
- Lucia v2 doesn't support Prisma v6
- **Decision**: Kept lucia v2 and Prisma v5 for Phase 2 compatibility
- Lucia v3 migration should be handled separately as a breaking change
- svelte-confetti v2.3.2 uses Svelte 5 runes but build still succeeds (warnings only)

---

### Phase 3: Svelte 5 Migration (Estimated: 3-5 days)
**Goal**: Upgrade to Svelte 5 FIRST (required for Skeleton v3)

#### 3.1 Update Svelte Core
```bash
npm install svelte@latest
npm install -D svelte-check@latest prettier-plugin-svelte@latest
```
- [x] Updated Svelte to v5.43.3 ✅
- [x] Updated svelte-check to v4.3.3 ✅
- [x] Updated prettier-plugin-svelte to v3.4.0 ✅

#### 3.2 Run Svelte Migration Tool
```bash
npx sv migrate
```
- [x] Review all migration changes ✅
- [x] Test migrated code ✅ (build succeeds)

#### 3.3 Manual Migration Tasks

##### 3.3.1 Convert Reactive Statements to Runes
- [ ] Replace `$:` with `$state`, `$derived`, `$effect`
- [ ] Update reactive declarations in all components
- [ ] Migrate reactive assignments

##### 3.3.2 Update Component Props
- [ ] Convert `export let` props to `let { prop }: { prop: Type }`
- [ ] Update all component prop definitions

##### 3.3.3 Migrate Stores (if needed)
- [ ] Review store usage patterns
- [ ] Determine if runes can replace stores
- [ ] Migrate context stores if applicable

##### 3.3.4 Update Event Handlers
- [ ] Review event handling patterns
- [ ] Update to new event system if needed

##### 3.3.5 Update Transitions
- [ ] Verify transitions still work
- [ ] Update transition usage if API changed

#### 3.4 Update Svelte-Specific Packages
- [x] Update `@testing-library/svelte` if Svelte 5 compatible ✅ (updated to latest)
- [x] Update `svelte-confetti` if available ✅ (already at latest, uses Svelte 5 runes)
- [x] Update `svelte-headless-table` if available ✅ (already at latest)
- [ ] Update `radix-icons-svelte` if available (version warning but works)
- [x] Update `svelte-chartjs` - removed (incompatible with Svelte 5, chart temporarily disabled)

#### 3.5 Update package.json Overrides
- [x] Remove or update `svelte-chartjs` override if no longer needed ✅ (removed)
- [x] Check if other overrides are needed ✅ (none needed)

#### 3.6 Test After Svelte 5 Migration
- [x] Run `npm run build` - ensure build succeeds ✅ (build successful)
- [ ] Run `npm run test` - ensure tests pass (may have issues due to Svelte 5 changes)
- [ ] Run `npm run dev` - verify dev server works
- [ ] Manual smoke test of application

**Note on TypeScript Errors:**
- Many TypeScript errors are pre-existing and not related to Svelte 5 migration
- Some errors are due to Svelte 5 changes (e.g., $props() usage, snippets)
- Errors don't block the build - application builds successfully
- These can be addressed incrementally as code is refactored

**Note on Manual Migration Tasks (3.3):**
- The migration tool has already made the code Svelte 5 compatible
- Many patterns have been automatically converted using compatibility helpers (e.g., `run()` from `svelte/legacy`)
- The remaining manual tasks are **optimizations** - not required for functionality
- Reactive statements (`$:`) still work via compatibility layer but can be converted to runes for better performance
- Component props (`export let`) still work but can be converted to `$props()` for better type safety
- These can be done incrementally as code is refactored - not blocking for Phase 4

**Fix Applied: Props Initialization Order (Svelte 5)**
- Fixed "Cannot access 'data' before initialization" error in `src/routes/+layout.svelte` and `src/routes/turbotown/quests/+page.svelte`
- In Svelte 5, `$props()` must be declared before any usage of the props
- Moved `interface Props` and `let { data, ... }: Props = $props()` declarations to the top of the script blocks, right after type imports
- This is a critical fix for runtime errors - the migration tool may place `$props()` declarations later in the file, but they must be at the top

---

### Phase 4: SvelteKit v2 Migration (Estimated: 1-2 days)
**Goal**: Upgrade to SvelteKit v2 (required for Skeleton v3, requires Svelte 5)

#### 4.1 Update SvelteKit Ecosystem
```bash
npm install @sveltejs/kit@latest @sveltejs/vite-plugin-svelte@latest
npm install @sveltejs/adapter-vercel@latest
```

#### 4.2 Run SvelteKit Migration Tool
```bash
npx svelte-migrate@latest sveltekit-2
```
- [x] Packages already on SvelteKit v2.48.4 ✅
- [x] Config already updated (moduleResolution: "bundler", vitePreprocess import) ✅
- [x] Manual code changes applied ✅

#### 4.3 Manual Migration Tasks
- [x] Fixed `throw redirect()` → `redirect()` in load functions and actions ✅
- [x] Fixed `throw error()` → `error()` in load functions and API routes ✅
- [x] Updated files:
  - `src/routes/admin/login/+page.server.ts`
  - `src/routes/admin/register/+page.server.ts`
  - `src/routes/admin/logout/+server.ts`
  - `src/routes/blog/[slug]/+page.ts`
  - `src/routes/api/dotadeck/new-game/+server.ts`
  - `src/routes/api/cards/delete/+server.ts`
  - `src/routes/dotadeck/+page.svelte`
- [x] Verified routing configurations (no changes needed) ✅
- [x] Verified load functions use correct syntax ✅

#### 4.4 Test After SvelteKit v2 Migration
- [ ] Run `npm run build` - ensure build succeeds (blocked by Prisma file lock - Windows issue)
- [ ] Run `npm run test` - ensure tests pass
- [ ] Run `npm run dev` - verify dev server works
- [ ] Manual smoke test of application

**Note on SvelteKit v2 Migration:**
- Project was already on SvelteKit v2.48.4 (package.json showed ^2.5.27, but installed version is 2.48.4)
- Config files (`tsconfig.json`, `svelte.config.js`) were already correctly configured for v2
- Main migration task was updating `throw redirect()`/`throw error()` to just `redirect()`/`error()`
- In SvelteKit v2, `redirect()` and `error()` throw internally, so no `throw` keyword needed

---

### Phase 5: Tailwind CSS v4 Migration (Estimated: 1-2 days)
**Goal**: Complete Tailwind v4 migration and cleanup

**Status**: ✅ **COMPLETE** - Tailwind v4.1.16 installed, config cleaned up, plugins updated to latest versions

#### 5.1 Completed Steps ✅
- [x] Tailwind v4.1.16 installed ✅
- [x] @tailwindcss/vite 4.1.16 installed and configured ✅
- [x] Skeleton plugin removed from `tailwind.config.ts` ✅
- [x] `app.css` exists and uses Tailwind v4 syntax (`@import 'tailwindcss'`) ✅
- [x] PostCSS config removed (using Vite plugin) ✅
- [x] Vite plugin configured in `vite.config.ts` ✅

#### 5.2 Completed Config Cleanup ✅
- [x] Simplified `tailwind.config.ts` to essential items only ✅
  - Kept content paths for file scanning
  - Kept plugin configuration (forms, typography)
  - Kept theme extensions (container, backgroundImage, borderRadius, colors)
  - Colors reference CSS variables (CSS-first approach)
- [x] Added `@config` directive in `app.css` to reference config file ✅
- [x] Updated `@tailwindcss/forms` to latest (0.5.11) ✅
- [x] Updated `@tailwindcss/typography` to latest (0.5.19) ✅
- [x] Removed `safelist` (not supported in v4 config, use `@source` in CSS if needed) ✅
- [x] Fixed `darkMode` config (changed from array to string) ✅

**Note**: The config file is kept for:
- Content paths (required for file scanning)
- Plugin configuration (forms, typography work with v4)
- Theme extensions that reference CSS variables (hybrid approach)

#### 5.3 Test Tailwind Styles
- [ ] Build application (blocked by Prisma file lock on Windows - known issue)
- [ ] Run dev server and verify styles render correctly
- [ ] Check dark mode functionality
- [ ] Test Skeleton UI theme integration
- [ ] Verify custom background images work (bg-questBoard, bg-questBoardPoster, etc.)
- [ ] Test container utilities with custom breakpoints

---

### Phase 6: Skeleton v2 → v3 Migration (Estimated: 1-2 days)
**Goal**: Migrate Skeleton UI to v3 (requires Svelte 5, SvelteKit v2, latest Tailwind)

**Status**: ✅ **COMPLETE** - Skeleton v3.2.2 is already installed

#### 6.1 Completed Steps ✅
- [x] Skeleton v3.2.2 installed ✅
- [x] `@skeletonlabs/skeleton-svelte` v1.5.3 installed ✅
- [x] Skeleton v3 imports in `app.css` (`@import "@skeletonlabs/skeleton"`) ✅
- [x] Theme configuration updated for v3 ✅

#### 6.2 Verification Tasks
- [ ] Verify all Skeleton components work correctly
- [ ] Test theme switching (crimson theme)
- [ ] Check for any deprecated component usage
- [ ] Verify no console errors related to Skeleton

---

### Phase 7: Skeleton v3 → v4 Migration (Estimated: 1 day)
**Goal**: Migrate Skeleton UI to v4

#### 7.1 Run Skeleton v4 Migration
```bash
npx skeleton migrate skeleton-4
```
- [ ] Answer prompts if needed
- [ ] Review all migration changes

#### 7.2 Manual Migration Tasks
- [ ] Review Skeleton v4 breaking changes
- [ ] Update component props if needed
- [ ] Migrate utility classes if needed

#### 7.3 Test After Skeleton v4 Migration
- [ ] Run `npm run build` - ensure build succeeds
- [ ] Run `npm run dev` - verify dev server works
- [ ] Test all Skeleton UI components
- [ ] Verify themes work correctly

---

### Phase 8: Other UI Library Updates (Estimated: 1-2 days)
**Goal**: Update remaining UI libraries compatible with Svelte 5

#### 8.1 bits-ui
- [ ] Check Svelte 5 compatibility
- [ ] Update if compatible
- [ ] Test all UI components using bits-ui

#### 8.2 Other UI Packages
- [ ] Update `radix-icons-svelte` if compatible
- [ ] Check other icon/UI packages

---

### Phase 6: Final Updates & Cleanup (Estimated: 1 day)
**Goal**: Finalize all updates and clean up

#### 6.1 Update Remaining Dependencies
```bash
npm install -D mdsvex@latest
npm install node-fetch@latest
npm install supabase@latest
npm install -D tslib@latest
```

#### 6.2 Update Minor Versions
- [ ] Run `npm-check-updates` for remaining packages
- [ ] Review and update minor/patch versions
- [ ] Ensure no breaking changes

#### 6.3 Clean Up
- [ ] Remove unused dependencies
- [ ] Update lockfile: `npm install`
- [ ] Remove any deprecated code patterns

---

### Phase 7: Testing & Validation (Estimated: 2-3 days)
**Goal**: Ensure everything works correctly

#### 7.1 Automated Testing
- [ ] Run all unit tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type checking: `npm run check`
- [ ] Run linter: `npm run lint`

#### 7.2 Build Validation
- [ ] Test production build: `npm run build`
- [ ] Test preview: `npm run preview`
- [ ] Verify build output size
- [ ] Check for build warnings/errors

#### 7.3 Manual Testing Checklist
- [ ] **Authentication**: Steam login, session management
- [ ] **Navigation**: All routes, navigation drawer
- [ ] **Forms**: Form submissions, validation
- [ ] **Modals**: Modal dialogs from Skeleton UI
- [ ] **Tables**: Data tables, sorting, filtering
- [ ] **Charts**: Chart.js visualizations
- [ ] **Dark Mode**: Theme switching
- [ ] **API Routes**: All API endpoints
- [ ] **Database**: Prisma operations
- [ ] **Real-time Features**: Any live updates

#### 7.4 Performance Testing
- [ ] Check bundle size (compare before/after)
- [ ] Test page load times
- [ ] Verify no performance regressions
- [ ] Check memory usage

#### 7.5 Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile viewport testing

---

## Rollback Plan

### If Issues Arise
1. **Immediate Rollback**
   ```bash
   git checkout main
   npm install  # Restore lockfile
   ```

2. **Partial Rollback**
   - Revert specific package updates
   - Use git to restore individual files
   - Test incremental rollbacks

3. **Branch Management**
   - Keep upgrade branch for reference
   - Create fixes on separate branches
   - Merge incrementally

---

## Command Reference

### Useful Commands During Upgrade

```bash
# Check outdated packages
npm outdated

# Update all packages (after manual review)
npx npm-check-updates -u
npm install

# Check for vulnerabilities
npm audit
npm audit fix

# Verify installations
npm list --depth=0

# Clear cache if issues
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Type checking
npm run check

# Build verification
npm run build
npm run preview
```

---

## Risk Assessment

### High Risk Items
1. **Skeleton UI Compatibility** - If not Svelte 5 compatible, major refactoring needed
2. **Svelte 5 Migration** - Extensive codebase changes required
3. **Tailwind v4 Migration** - Configuration rewrite needed
4. **Third-party Svelte Packages** - Unknown compatibility status

### Medium Risk Items
1. **Testing Library Updates** - May require test updates
2. **Chart.js Integration** - svelte-chartjs compatibility
3. **Build Tool Updates** - Possible config changes

### Low Risk Items
1. **Non-Svelte Dependencies** - Standard updates
2. **Dev Tools** - Usually backward compatible
3. **Utility Libraries** - Minimal impact

---

## Timeline Estimate

- **Phase 1 (Prep)**: 1-2 days
- **Phase 2 (Non-breaking)**: 2-3 hours
- **Phase 3 (Tailwind)**: 1-2 days
- **Phase 4 (Svelte 5)**: 3-5 days
- **Phase 5 (UI Libraries)**: 1-2 days
- **Phase 6 (Cleanup)**: 1 day
- **Phase 7 (Testing)**: 2-3 days

**Total Estimated Time**: 10-16 days

*Note: This estimate assumes Skeleton UI and other packages have Svelte 5 support. If not, timeline may extend significantly.*

---

## Success Criteria

- [ ] All dependencies updated to latest stable versions
- [ ] Svelte 5 fully integrated with runes
- [ ] Tailwind CSS v4 configured and working
- [ ] All tests passing
- [ ] Production build succeeds
- [ ] No runtime errors in application
- [ ] Performance maintained or improved
- [ ] Documentation updated (if needed)

---

## Resources & Documentation

- [Svelte 5 Migration Guide](https://svelte.dev/docs/v5-migration-guide)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-alpha)
- [Skeleton UI Documentation](https://www.skeleton.dev)
- [SvelteKit Documentation](https://kit.svelte.dev)
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)

---

## Notes

- **Tailwind CSS v4** may still be in alpha/beta. Verify stable release before production upgrade.
- **Skeleton UI** may require waiting for official Svelte 5 support announcement.
- Consider creating a feature flag system to incrementally migrate Svelte 5 features.
- Keep detailed migration notes for reference and documentation.

---

*Last Updated: [Date]*  
*Version: 1.0*

