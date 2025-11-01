# Dependency Upgrade Plan: TurboDota v4

## Overview
This document outlines the plan to upgrade all dependencies to their latest stable versions, with special focus on:
- **Svelte 5** (currently on Svelte 4.2.7)
- **Tailwind CSS v4** (currently on v3.3.5)
- Latest stable versions of all core libraries

---

## Current State Analysis

### Core Framework Dependencies
- `svelte`: ^4.2.7 → **5.x** (major upgrade)
- `@sveltejs/kit`: ^2.0.6 → **2.x** (check latest)
- `@sveltejs/vite-plugin-svelte`: ^3.0.0 → **latest**
- `@sveltejs/adapter-vercel`: ^4.0.3 → **latest**

### UI Framework
- `@skeletonlabs/skeleton`: 2.5.1 → **⚠️ NEEDS VERIFICATION** (Svelte 5 compatibility unknown)
- `@skeletonlabs/tw-plugin`: 0.2.4 → **⚠️ NEEDS VERIFICATION**
- `tailwindcss`: 3.3.5 → **4.x** (major upgrade - breaking changes)
- `@tailwindcss/forms`: 0.5.7 → **latest**
- `@tailwindcss/typography`: 0.5.10 → **latest**

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

### Phase 1: Pre-Upgrade Preparation (Estimated: 1-2 days)
**Goal**: Prepare codebase and verify compatibility

#### 1.1 Create Backup Branch
```bash
git checkout -b upgrade/dependencies-v5
git push -u origin upgrade/dependencies-v5
```

#### 1.2 Verify Compatibility
- [ ] Check Skeleton UI Svelte 5 compatibility status
- [ ] Check bits-ui Svelte 5 compatibility
- [ ] Check svelte-chartjs Svelte 5 compatibility
- [ ] Review all Svelte-related package changelogs
- [ ] Document breaking changes for each package

#### 1.3 Audit Current Codebase
- [ ] Run `npm audit` to identify security issues
- [ ] Run `npm outdated` to see current vs latest versions
- [ ] Document all Svelte 4 patterns used (reactive statements, stores, etc.)
- [ ] Count usage of `$:` reactive statements
- [ ] Identify all components using Skeleton UI

#### 1.4 Set Up Testing Baseline
- [ ] Ensure all tests pass before upgrade
- [ ] Document manual testing checklist
- [ ] Set up CI/CD to catch issues early

---

### Phase 2: Non-Breaking Updates (Estimated: 2-3 hours)
**Goal**: Update dependencies that don't require code changes

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

#### 2.5 Test After Updates
- [ ] Run `npm run build` - ensure build succeeds
- [ ] Run `npm run test` - ensure tests pass
- [ ] Run `npm run dev` - verify dev server works
- [ ] Manual smoke test of application

---

### Phase 3: Tailwind CSS v4 Migration (Estimated: 1-2 days)
**Goal**: Migrate from Tailwind v3 to v4

#### 3.1 Research Tailwind v4 Changes
- [ ] Review [Tailwind CSS v4 documentation](https://tailwindcss.com/docs/v4-alpha)
- [ ] Understand CSS-first configuration approach
- [ ] Review plugin migration guide

#### 3.2 Update Tailwind CSS
```bash
npm install -D tailwindcss@next # or @latest when stable
```

#### 3.3 Migrate Configuration
- [ ] Convert `tailwind.config.ts` to CSS `@config` syntax
- [ ] Update theme configuration in CSS file
- [ ] Migrate plugin configurations (@tailwindcss/forms, @tailwindcss/typography)
- [ ] Update @skeletonlabs/tw-plugin if needed

#### 3.4 Update PostCSS Configuration
- [ ] Check if PostCSS config changes needed
- [ ] Update `postcss.config.js` if required

#### 3.5 Update Vite Plugin
- [ ] Check if `vite-plugin-tailwind-purgecss` needs updates
- [ ] Verify safelist configuration still works

#### 3.6 Test Tailwind Styles
- [ ] Build application
- [ ] Verify all styles render correctly
- [ ] Check dark mode functionality
- [ ] Test Skeleton UI theme integration

---

### Phase 4: Svelte 5 Migration (Estimated: 3-5 days)
**Goal**: Upgrade to Svelte 5 and migrate codebase

#### 4.1 Update Svelte Ecosystem (if compatible)
```bash
# Only if Skeleton UI and other packages support Svelte 5
npm install svelte@latest
npm install @sveltejs/kit@latest @sveltejs/vite-plugin-svelte@latest
npm install @sveltejs/adapter-vercel@latest
npm install -D svelte-check@latest prettier-plugin-svelte@latest
```

#### 4.2 Run Migration Tool
```bash
npx sv migrate
```
- [ ] Review all migration changes
- [ ] Test migrated code

#### 4.3 Manual Migration Tasks

##### 4.3.1 Convert Reactive Statements to Runes
- [ ] Replace `$:` with `$state`, `$derived`, `$effect`
- [ ] Update reactive declarations in all components
- [ ] Migrate reactive assignments

##### 4.3.2 Update Component Props
- [ ] Convert `export let` props to `let { prop }: { prop: Type }`
- [ ] Update all component prop definitions

##### 4.3.3 Migrate Stores (if needed)
- [ ] Review store usage patterns
- [ ] Determine if runes can replace stores
- [ ] Migrate context stores if applicable

##### 4.3.4 Update Event Handlers
- [ ] Review event handling patterns
- [ ] Update to new event system if needed

##### 4.3.5 Update Transitions
- [ ] Verify transitions still work
- [ ] Update transition usage if API changed

#### 4.4 Update Svelte-Specific Packages
- [ ] Update `@testing-library/svelte` if Svelte 5 compatible
- [ ] Update `svelte-confetti` if available
- [ ] Update `svelte-headless-table` if available
- [ ] Update `radix-icons-svelte` if available
- [ ] Update `svelte-chartjs` - remove override if compatible

#### 4.5 Update package.json Overrides
- [ ] Remove or update `svelte-chartjs` override if no longer needed
- [ ] Check if other overrides are needed

---

### Phase 5: UI Library Updates (Estimated: 1-2 days)
**Goal**: Update UI libraries if compatible with Svelte 5

#### 5.1 Skeleton UI
- [ ] Check for Svelte 5 compatible version
- [ ] If not available, consider alternatives or wait
- [ ] If available, update and test thoroughly

#### 5.2 bits-ui
- [ ] Check Svelte 5 compatibility
- [ ] Update if compatible
- [ ] Test all UI components using bits-ui

#### 5.3 Other UI Packages
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

