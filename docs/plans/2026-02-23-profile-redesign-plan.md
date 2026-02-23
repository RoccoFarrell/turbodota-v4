# Profile Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the profile page with the Dark Rift violet palette, promote the Dota 2 Account ID to a prominent header position with locked/unlocked states, add an onboarding wizard overlay for `?welcome=true`, and fix pre-existing bugs in the Steam link callback.

**Architecture:** Backend-first approach — extract shared Steam utilities, update conflict resolution logic, then rebuild the frontend. No schema migration needed; account lock state is derived from existing `steam_id` + `account_id` fields.

**Tech Stack:** SvelteKit, Svelte 5 runes, Skeleton UI Dialog/Portal, Tailwind CSS v4, Prisma, Vitest

**Design doc:** `docs/plans/2026-02-23-profile-redesign-design.md`

---

### Task 1: Extract shared Steam utilities

**Files:**
- Create: `src/lib/server/steam-utils.ts`
- Create: `src/lib/server/steam-utils.test.ts`
- Modify: `src/routes/api/auth/steam/authenticate/+server.ts:15-19`
- Modify: `src/routes/api/auth/steam/link/callback/+server.ts:10-14`

**Step 1: Write tests for `deriveAccountId` and `isAccountLocked`**

```typescript
// src/lib/server/steam-utils.test.ts
import { describe, it, expect } from 'vitest';
import { deriveAccountId, isAccountLocked } from './steam-utils';

describe('deriveAccountId', () => {
	it('converts a known Steam ID to Dota 2 account_id', () => {
		// Steam ID 76561198046984233 → account_id 86718505
		expect(deriveAccountId('76561198046984233')).toBe(86718505);
	});

	it('handles the base Steam ID (account_id 0)', () => {
		expect(deriveAccountId('76561197960265728')).toBe(0);
	});
});

describe('isAccountLocked', () => {
	it('returns true when steam_id derives to account_id', () => {
		expect(isAccountLocked({
			steam_id: 76561198046984233n,
			account_id: 86718505
		})).toBe(true);
	});

	it('returns false when steam_id is null', () => {
		expect(isAccountLocked({ steam_id: null, account_id: 86718505 })).toBe(false);
	});

	it('returns false when account_id is null', () => {
		expect(isAccountLocked({ steam_id: 76561198046984233n, account_id: null })).toBe(false);
	});

	it('returns false when steam_id does not derive to account_id', () => {
		expect(isAccountLocked({
			steam_id: 76561198046984233n,
			account_id: 99999999
		})).toBe(false);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/server/steam-utils.test.ts`
Expected: FAIL — module not found

**Step 3: Implement `steam-utils.ts`**

```typescript
// src/lib/server/steam-utils.ts

const STEAM_ID_BASE = 76561197960265728n;

/**
 * Derive Dota 2 account_id from a Steam 64-bit ID string.
 * Formula: account_id = steam_id - 76561197960265728
 */
export function deriveAccountId(steamId: string): number {
	return Number(BigInt(steamId) - STEAM_ID_BASE);
}

/**
 * Check if a user's account_id is locked (verified via Steam login).
 * Locked means the account_id was derived from the user's steam_id,
 * proving they own the Steam account.
 */
export function isAccountLocked(user: {
	steam_id: bigint | null;
	account_id: number | null;
}): boolean {
	if (!user.steam_id || !user.account_id) return false;
	const derived = Number(BigInt(user.steam_id) - STEAM_ID_BASE);
	return user.account_id === derived;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/server/steam-utils.test.ts`
Expected: PASS (4 tests)

**Step 5: Update `authenticate/+server.ts` to import from shared util**

In `src/routes/api/auth/steam/authenticate/+server.ts`:
- Remove the local `deriveAccountId` function (lines 15-19)
- Add import: `import { deriveAccountId } from '$lib/server/steam-utils';`

**Step 6: Update `link/callback/+server.ts` to import from shared util**

In `src/routes/api/auth/steam/link/callback/+server.ts`:
- Remove the local `deriveAccountId` function (lines 10-14)
- Add import: `import { deriveAccountId } from '$lib/server/steam-utils';`

**Step 7: Run existing tests to verify nothing broke**

Run: `npx vitest run`
Expected: All existing tests pass

**Step 8: Commit**

```bash
git add src/lib/server/steam-utils.ts src/lib/server/steam-utils.test.ts src/routes/api/auth/steam/authenticate/+server.ts src/routes/api/auth/steam/link/callback/+server.ts
git commit -m "refactor: extract deriveAccountId and isAccountLocked to shared steam-utils"
```

---

### Task 2: Fix Steam link callback — add DotaUser upsert + account clearing

**Files:**
- Modify: `src/routes/api/auth/steam/link/callback/+server.ts`

**Context:** This file currently has two bugs:
1. Missing `createDotaUser` upsert before setting `account_id` (FK constraint violation risk)
2. Hard `error(400)` when another user has the same `account_id` — should instead clear their manually-entered ID

**Step 1: Update the link callback with DotaUser upsert and conflict clearing**

Replace the full `GET` handler in `src/routes/api/auth/steam/link/callback/+server.ts`:

```typescript
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { steamLink } from '../steam-link';
import { deriveAccountId, isAccountLocked } from '$lib/server/steam-utils';
import { createDotaUser } from '../../../helpers';

/**
 * Handle Steam OpenID callback for account linking
 * GET /api/auth/steam/link/callback
 */
export const GET: RequestHandler = async ({ request, locals }) => {
	// User must still be logged in
	if (!locals.user) {
		throw error(401, 'Session expired. Please log in again.');
	}

	try {
		// Verify Steam OpenID response
		const steamUser = await steamLink.authenticate(request);

		if (!steamUser || !steamUser.steamid) {
			throw error(400, 'Failed to authenticate with Steam');
		}

		// Check if this Steam account is already linked to another user
		const existingUser = await prisma.user.findUnique({
			where: { steam_id: BigInt(steamUser.steamid) }
		});

		if (existingUser && existingUser.id !== locals.user.id) {
			throw error(400, 'This Steam account is already linked to another user');
		}

		// Derive account_id from steam_id
		const account_id = deriveAccountId(steamUser.steamid);

		// Check if this account_id is already used by another user
		const accountIdUser = await prisma.user.findUnique({
			where: { account_id }
		});

		if (accountIdUser && accountIdUser.id !== locals.user.id) {
			// The other user had this ID via manual entry (they can't have a matching
			// steam_id because we already checked steam_id uniqueness above).
			// Clear their manually-entered account_id since we're now verifying ownership.
			await prisma.user.update({
				where: { id: accountIdUser.id },
				data: { account_id: null }
			});
		}

		// Ensure DotaUser row exists before setting FK (fixes pre-existing bug)
		await createDotaUser(account_id);

		// Update user with Steam information
		await prisma.user.update({
			where: { id: locals.user.id },
			data: {
				steam_id: BigInt(steamUser.steamid),
				account_id: account_id,
				username: locals.user.username || steamUser.username,
				avatar_url: steamUser.avatar?.small || locals.user.avatar_url,
				profile_url: steamUser.profile
			}
		});

		// Redirect to profile with success message
		throw redirect(302, '/profile?linked=steam');
	} catch (err) {
		console.error('Steam linking error:', err);
		if (err instanceof Response) {
			throw err; // Re-throw redirects and errors
		}
		throw error(500, 'Failed to link Steam account');
	}
};
```

**Step 2: Verify the app still builds**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/routes/api/auth/steam/link/callback/+server.ts
git commit -m "fix: add DotaUser upsert to Steam link callback, clear manual claims on verification"
```

---

### Task 3: Update `setAccountId` with lock-aware conflict resolution

**Files:**
- Modify: `src/routes/profile/+page.server.ts:165-204`

**Step 1: Update the `setAccountId` action**

Replace the `setAccountId` action in `src/routes/profile/+page.server.ts` (lines 165-204):

```typescript
setAccountId: async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const data = await request.formData();
	const accountIdStr = data.get('account_id');

	if (!accountIdStr || typeof accountIdStr !== 'string') {
		return fail(400, { setAccountId: { error: 'Account ID is required' } });
	}

	const account_id = parseInt(accountIdStr, 10);
	if (isNaN(account_id) || account_id <= 0) {
		return fail(400, { setAccountId: { error: 'Invalid account ID' } });
	}

	const existing = await prisma.user.findUnique({ where: { account_id } });
	if (existing && existing.id !== locals.user.id) {
		// Check if the other user's claim is locked (verified via Steam)
		if (isAccountLocked(existing)) {
			return fail(400, {
				setAccountId: { error: 'This account ID is verified by another user via Steam' }
			});
		}
		// Otherwise it's a manual claim — allow last-write-wins
	}

	// User.account_id is a FK → DotaUser.account_id.
	// Ensure a DotaUser row exists before setting the FK.
	await prisma.dotaUser.upsert({
		where: { account_id },
		create: { account_id, lastUpdated: new Date() },
		update: {}
	});

	await prisma.user.update({
		where: { id: locals.user.id },
		data: { account_id }
	});

	// Update locals so the load function (which re-runs after the action)
	// sees the new account_id instead of the stale pre-action value.
	locals.user.account_id = account_id;

	return { success: true };
}
```

Add import at top of file:
```typescript
import { isAccountLocked } from '$lib/server/steam-utils';
```

**Step 2: Verify the app still builds**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/routes/profile/+page.server.ts
git commit -m "feat: lock-aware conflict resolution in setAccountId"
```

---

### Task 4: Add `isAccountLocked` to profile page load data

**Files:**
- Modify: `src/routes/profile/+page.server.ts:5-133`

**Step 1: Update the load function to include `isAccountLocked`**

In `src/routes/profile/+page.server.ts`, update the return statement (line 133):

From:
```typescript
return { user, saves, matchStats };
```

To:
```typescript
return { user, saves, matchStats, isAccountLocked: isAccountLocked(user) };
```

The `isAccountLocked` import was already added in Task 3.

**Step 2: Commit**

```bash
git add src/routes/profile/+page.server.ts
git commit -m "feat: pass isAccountLocked to profile frontend"
```

---

### Task 5: Redesign profile page — violet palette + new layout

**Files:**
- Modify: `src/routes/profile/+page.svelte` (full rewrite)

This is the largest task. The page is rewritten with:
1. Dark Rift violet CSS variables replacing gold
2. Identity header with prominent account ID display (locked/unlocked/unlinked states)
3. Match stats, signature heroes, saves — same data, new palette
4. Linked accounts management at bottom

**Step 1: Rewrite the `<style>` block**

Replace the CSS variables and classes:

```css
.profile-root {
	--violet: rgb(139, 92, 246);
	--violet-dim: rgb(88, 28, 135);
	--violet-glow: rgba(139, 92, 246, 0.18);
	--violet-border: rgba(139, 92, 246, 0.15);
	--panel-bg: rgba(15, 10, 30, 0.5);
	--text-primary: rgb(209, 213, 219);
	--text-muted: rgb(156, 163, 175);
	--emerald: rgb(52, 211, 153);
	--amber: rgb(251, 191, 36);
}

.reveal {
	animation: fadeUp 0.4s ease both;
}
.reveal-1 { animation-delay: 0.04s; }
.reveal-2 { animation-delay: 0.1s; }
.reveal-3 { animation-delay: 0.18s; }
.reveal-4 { animation-delay: 0.26s; }
.reveal-5 { animation-delay: 0.34s; }

@keyframes fadeUp {
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
}

.panel {
	background: var(--panel-bg);
	border: 1px solid var(--violet-border);
	border-radius: 0.75rem;
	position: relative;
	overflow: hidden;
}
.panel::before {
	content: '';
	position: absolute;
	top: 0;
	left: 10%;
	right: 10%;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
}

.section-label {
	font-size: 0.75rem;
	font-weight: 800;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--text-muted);
	padding-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.section-label::after {
	content: '';
	flex: 1;
	height: 1px;
	background: linear-gradient(90deg, var(--violet-border), transparent);
}

.hero-sprite-wrap :global(.d2mh) {
	transform: scale(1.5);
	image-rendering: pixelated;
}
```

**Step 2: Rewrite the `<script>` block**

Key changes:
- Add `Dialog` and `Portal` imports from Skeleton UI
- Add `onboardingStep` state for the wizard (`'choice' | 'manual' | null`)
- Derive `showWelcome` from URL params + `!data.user.account_id` (only show if no account linked)
- Add URL cleanup function using `history.replaceState`
- Read `data.isAccountLocked` for lock/unlock display

```typescript
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import essenceIcon from '$lib/assets/essence.png';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	// Onboarding overlay — show when ?welcome=true AND no account linked
	const welcomeParam = $derived($page.url.searchParams.get('welcome') === 'true');
	let onboardingDismissed = $state(false);
	const showOnboarding = $derived(welcomeParam && !data.user.account_id && !onboardingDismissed);
	let onboardingStep = $state<'choice' | 'manual'>('choice');

	const linkedSteam = $derived($page.url.searchParams.get('linked') === 'steam');

	let editingUsername = $state(false);
	let usernameInput = $state(data.user.username);
	let editingAccountId = $state(false);
	let accountIdInput = $state(data.user.account_id?.toString() ?? '');

	// Onboarding manual entry state (separate from the main edit form)
	let onboardingAccountIdInput = $state('');

	$effect(() => { usernameInput = data.user.username; });
	$effect(() => { accountIdInput = data.user.account_id?.toString() ?? ''; });

	function dismissOnboarding() {
		onboardingDismissed = true;
		onboardingStep = 'choice';
		cleanWelcomeParam();
	}

	function cleanWelcomeParam() {
		const url = new URL(window.location.href);
		url.searchParams.delete('welcome');
		history.replaceState({}, '', url.toString());
	}

	function formatNum(n: number | null): string {
		if (n === null) return '—';
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
		return n.toString();
	}

	const currencyConfig: Record<string, { label: string; icon: string; color: string; imageUrl?: string }> = {
		essence: { label: 'Essence', icon: '', color: '', imageUrl: essenceIcon },
		gold: { label: 'Gold', icon: 'fi fi-rr-coin', color: 'text-amber-400' },
		loot_coins: { label: 'Loot', icon: 'fi fi-rr-treasure-chest', color: 'text-violet-400' },
		wood: { label: 'Wood', icon: 'fi fi-rr-tree', color: 'text-emerald-400' }
	};

	const currencyOrder = ['essence', 'gold', 'loot_coins', 'wood'];
</script>
```

**Step 3: Rewrite the template**

The full template structure (replace everything from `<svelte:head>` to `</div>` at end of file). Key sections:

**Page wrapper:**
```svelte
<div
	class="profile-root min-h-full p-6 flex flex-col gap-4 max-w-[1100px] mx-auto text-(--text-primary)"
	style="background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(88,28,135,0.05) 0%, transparent 40%), #030712"
>
```

**Success banner** (for `?linked=steam`):
```svelte
{#if linkedSteam}
	<div class="reveal reveal-1 py-3 px-4 rounded-lg text-sm bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">
		Steam account linked successfully! Your Dota 2 Account ID is now verified and locked.
	</div>
{/if}
```

**Identity Header** — left side (avatar + username), right side (account ID + badges). Use `flex` with `sm:flex-row flex-col` for mobile stacking. Account ID section:
- If `data.isAccountLocked`: show ID with emerald lock icon, "Verified via Steam" tooltip
- If `data.user.account_id && !data.isAccountLocked`: show ID with amber pencil icon, clickable to edit
- If `!data.user.account_id`: show "No account linked" + "Link now" button

**Match Stats, Signature Heroes, Saves, Linked Accounts** — same structural HTML as current, with all gold/warm color references replaced by violet equivalents:
- `--gold` → `var(--violet)`
- `--gold-dim` → `var(--violet-dim)`
- `--gold-glow` → `var(--violet-glow)`
- `--card-bg` → `var(--panel-bg)`
- `--card-border` → `var(--violet-border)`
- `--text-warm` → `var(--text-primary)`
- `--text-muted` → `var(--text-muted)` (same name, different value)
- `bg-[rgb(10_7_5)]` → `#030712`
- `bg-[rgb(12_8_4)]` → `rgba(15, 10, 30, 0.6)`
- `bg-[rgb(14_9_5)]` → `rgba(15, 10, 30, 0.5)`
- `bg-[rgb(20_12_6)]` → `rgba(15, 10, 30, 0.8)`
- `bg-[rgb(30_15_8)]` → `rgba(25, 18, 45, 0.7)`
- `bg-[rgb(30_18_8)]` → `rgba(25, 18, 45, 0.6)`
- `bg-[rgb(40_24_10/0.8)]` → `rgba(139, 92, 246, 0.15)`
- `bg-[rgb(5_46_22/0.8)]` → `bg-emerald-500/15`
- `bg-[rgb(8_20_46/0.8)]` → `bg-blue-500/15`
- Win rate bar: `from-green-500 to-green-700` → `from-violet-600 to-purple-400`
- Win rate bar bg: `bg-[rgb(30_15_8)]` → `bg-[rgba(17,12,35,0.8)]`
- Win rate bar loss: `bg-[rgb(60_20_20)]` → `bg-gray-800/50`
- KDA colors: keep green-300/red-300/blue-300 (these are semantic)
- Accent text (`text-(--gold)`): → `text-violet-400`

**Step 4: Add onboarding overlay**

After the main `</div>`, add the Skeleton UI Dialog:

```svelte
{#if showOnboarding}
	<Dialog open={showOnboarding} onOpenChange={(d) => { if (!d.open) dismissOnboarding(); }}>
		<Portal>
			<Dialog.Backdrop class="fixed inset-0 z-50 bg-[rgba(3,7,18,0.85)] backdrop-blur-sm" />
			<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
				<Dialog.Content class="w-full max-w-md rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(15,10,30,0.95)] shadow-[0_0_40px_rgba(139,92,246,0.1)] p-6 space-y-5">
					{#if onboardingStep === 'choice'}
						<!-- Step 1: Choice -->
						<div class="text-center space-y-2">
							<Dialog.Title class="text-xl font-bold text-gray-100">Welcome to TurboDota</Dialog.Title>
							<Dialog.Description class="text-sm text-gray-400">
								Link your Dota 2 account to unlock match tracking, stats, and the Dark Rift idle RPG.
							</Dialog.Description>
						</div>

						<div class="space-y-3">
							<!-- Steam option (recommended) -->
							<a
								href="/api/auth/steam/link"
								class="block w-full rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3.5 text-left transition-all hover:border-emerald-400/50 hover:bg-emerald-500/15"
							>
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
										<i class="fi fi-brands-steam text-emerald-300 leading-none"></i>
									</div>
									<div>
										<div class="text-sm font-semibold text-gray-100">Sign in with Steam <span class="text-xs font-normal text-emerald-400 ml-1">Recommended</span></div>
										<div class="text-xs text-gray-400 mt-0.5">Verifies ownership & locks your ID permanently</div>
									</div>
								</div>
							</a>

							<!-- Manual option -->
							<button
								type="button"
								class="block w-full rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.08)] px-4 py-3.5 text-left transition-all hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(139,92,246,0.12)] cursor-pointer"
								onclick={() => { onboardingStep = 'manual'; }}
							>
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
										<i class="fi fi-rr-gamepad text-violet-400 leading-none"></i>
									</div>
									<div>
										<div class="text-sm font-semibold text-gray-100">Enter Account ID manually</div>
										<div class="text-xs text-gray-400 mt-0.5">Quick setup — anyone can claim any ID until verified via Steam</div>
									</div>
								</div>
							</button>
						</div>

						<div class="text-center">
							<button
								type="button"
								class="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
								onclick={dismissOnboarding}
							>
								Skip for now
							</button>
						</div>

					{:else if onboardingStep === 'manual'}
						<!-- Step 2b: Manual entry -->
						<div class="space-y-2">
							<Dialog.Title class="text-lg font-bold text-gray-100">Enter your Dota 2 Account ID</Dialog.Title>
						</div>

						<form
							method="POST"
							action="?/setAccountId"
							class="space-y-3"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') {
										dismissOnboarding();
									}
								};
							}}
						>
							<div class="flex gap-2">
								<input
									type="number"
									name="account_id"
									placeholder="e.g. 86745213"
									bind:value={onboardingAccountIdInput}
									class="flex-1 bg-[rgba(15,10,30,0.8)] border border-[rgba(139,92,246,0.2)] text-gray-200 rounded-md px-3 py-2 text-sm [font-family:inherit] outline-none min-w-0 focus:border-violet-500 focus:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
								/>
								<button type="submit" class="bg-violet-600 text-white rounded-md px-4 py-2 text-sm font-semibold cursor-pointer [font-family:inherit] hover:bg-violet-500 transition-colors">
									Link
								</button>
							</div>

							{#if form && 'setAccountId' in form && form.setAccountId && 'error' in form.setAccountId}
								<p class="text-sm text-red-400">{form.setAccountId.error}</p>
							{/if}
						</form>

						<p class="text-xs text-gray-500">
							Find your ID at <a href="https://www.opendota.com" target="_blank" rel="noopener" class="text-violet-400 hover:underline">opendota.com</a> or in the Dota 2 client under Settings.
						</p>

						<div class="rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
							<p class="text-xs text-amber-300/80">
								Anyone can enter any ID. Sign in with Steam to verify ownership and lock it to your account permanently.
							</p>
						</div>

						<button
							type="button"
							class="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
							onclick={() => { onboardingStep = 'choice'; }}
						>
							← Back
						</button>
					{/if}
				</Dialog.Content>
			</Dialog.Positioner>
		</Portal>
	</Dialog>
{/if}
```

**Step 5: Verify the page renders**

Run: `npm run dev` — open `/profile` in browser, verify violet palette renders correctly. Then visit `/profile?welcome=true` to verify the onboarding overlay appears.

**Step 6: Commit**

```bash
git add src/routes/profile/+page.svelte
git commit -m "feat: redesign profile page with dark rift violet palette and onboarding wizard"
```

---

### Task 6: Visual polish and manual testing

**Files:**
- Modify: `src/routes/profile/+page.svelte` (adjustments)

**Step 1: Test all account ID states**

Manually test in the browser:
- No account ID linked → "No account linked" + "Link now" button in header
- Manually linked account ID → amber pencil icon, editable
- Steam-verified account ID → emerald lock icon, not editable
- Visit `/profile?welcome=true` → overlay appears with two options
- Click "Enter Account ID manually" → form appears, back button works
- Click "Skip for now" → overlay dismisses, URL cleaned
- Submit manual entry → overlay dismisses on success, page shows stats

**Step 2: Test mobile responsiveness**

Resize browser to mobile widths:
- Identity header stacks vertically (avatar + name on top, account ID below)
- Match stats grid collapses to single column
- Save cards stack vertically
- Onboarding overlay is centered and fits within the viewport

**Step 3: Test error states**

- Submit empty account ID → validation error
- Submit account ID locked by Steam user → "This account ID is verified by another user via Steam"

**Step 4: Fix any visual issues found during testing**

Adjust spacing, colors, responsive breakpoints as needed.

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/profile/+page.svelte
git commit -m "fix: profile page visual polish and responsive adjustments"
```

---

## Summary of all tasks

| Task | Description | Files |
|---|---|---|
| 1 | Extract shared Steam utilities + tests | `steam-utils.ts`, `steam-utils.test.ts`, 2 API routes |
| 2 | Fix Steam link callback (DotaUser upsert + clear manual claims) | `link/callback/+server.ts` |
| 3 | Lock-aware conflict resolution in setAccountId | `+page.server.ts` |
| 4 | Pass isAccountLocked to frontend | `+page.server.ts` |
| 5 | Full profile page redesign (palette + layout + onboarding) | `+page.svelte` |
| 6 | Visual polish and manual testing | `+page.svelte` |
