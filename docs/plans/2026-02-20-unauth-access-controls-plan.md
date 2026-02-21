# Unauthenticated Access Controls — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide DotaDeck, Leagues, and Dark Rift game routes from unauthenticated users; show a placeholder welcome page for the Dark Rift that explains login + Dota 2 account linking.

**Architecture:** Server-side redirect in `/incremental/+layout.server.ts` sends unauthenticated users to `/incremental/welcome`. The welcome route skips the redirect via a URL path check. Navigation sidebar shows DotaDeck/Leagues greyed out with lock icons, and hides Dark Rift sub-items for unauthenticated users.

**Tech Stack:** SvelteKit, Svelte 5, Tailwind CSS v4, existing rift-auth button styles

---

### Task 1: Add auth redirect in incremental layout server

**Files:**
- Modify: `src/routes/incremental/+layout.server.ts`

**Step 1: Update the layout server load to redirect unauthenticated users**

Replace the early return `return {}` with a redirect to `/incremental/welcome`, but skip the redirect if the user is already navigating to `/incremental/welcome`:

```typescript
import type { LayoutServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

/** If match data is older than this, we refresh from OpenDota when entering incremental. */
const MATCH_REFRESH_STALE_MINUTES = 30;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (!user?.account_id) {
		// Allow the welcome page to render without redirect loop
		if (url.pathname === '/incremental/welcome') {
			return {};
		}
		redirect(302, '/incremental/welcome');
	}

	const accountId = user.account_id;
	const dotaUser = await prisma.dotaUser.findUnique({
		where: { account_id: accountId },
		select: { lastUpdated: true }
	});

	const staleThreshold = new Date(Date.now() - MATCH_REFRESH_STALE_MINUTES * 60 * 1000);
	const isStale = !dotaUser?.lastUpdated || dotaUser.lastUpdated < staleThreshold;

	if (isStale) {
		try {
			await fetch(`${url.origin}/api/updateMatchesForUser/${accountId}`, { method: 'GET' });
		} catch (e) {
			console.error(`[incremental layout] updateMatchesForUser failed for ${accountId}:`, e);
		}
	}

	return { accountId };
};
```

**Step 2: Verify the redirect works**

Run: `npm run dev` and visit `/incremental` while logged out.
Expected: Redirected to `/incremental/welcome` (404 for now — welcome page doesn't exist yet).

**Step 3: Commit**

```bash
git add src/routes/incremental/+layout.server.ts
git commit -m "feat: redirect unauthenticated users from incremental to welcome page"
```

---

### Task 2: Create the welcome placeholder page

**Files:**
- Create: `src/routes/incremental/welcome/+page.svelte`
- Create: `src/routes/incremental/welcome/+page.server.ts`

**Step 1: Create the server load**

`src/routes/incremental/welcome/+page.server.ts`:

```typescript
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	// If user is fully authenticated with a Dota account, send them to the game
	if (user?.account_id) {
		redirect(302, '/incremental');
	}
	return {
		isAuthenticated: !!user,
		hasAccount: !!user?.account_id
	};
};
```

**Step 2: Create the welcome page component**

`src/routes/incremental/welcome/+page.svelte` — a dark-themed page with:
- Atmospheric heading
- Login/link-account messaging (conditional on auth state)
- Google + Steam login buttons (for unauthenticated)
- "Link your Dota 2 account" message (for authenticated but no Dota link)
- Feature teaser cards (reused content from homepage)

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import steam_logo from '$lib/assets/steam_logo.png';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const features = [
		{ icon: 'fi fi-br-dumbbell-fitness', title: 'Hero Training', desc: 'Train your heroes across 7 specialized barracks to unlock devastating stats.' },
		{ icon: 'fi fi-br-pickaxe', title: 'Scavenging', desc: 'Dispatch hero parties to harvest gold, wood, and rare resources.' },
		{ icon: 'fi fi-br-flame', title: 'Dark Rift Runs', desc: 'Brave progressively harder expeditions through the rift for prestige rewards.' },
		{ icon: 'fi fi-br-globe', title: 'Atlas', desc: 'Explore hidden realms and uncover unique rewards across the map.' },
		{ icon: 'fi fi-br-diploma', title: 'Talents & Upgrades', desc: 'Invest in permanent upgrades that reshape your gameplay.' },
		{ icon: 'fi fi-rr-scroll', title: 'Quests', desc: 'Complete objectives to earn gold, items, and unlock new capabilities.' },
		{ icon: 'fi fi-rr-briefcase', title: 'Bank & Inventory', desc: 'Safeguard wealth and manage rare items for maximum efficiency.' },
		{ icon: 'fi fi-br-users-alt', title: 'Hero Synergies', desc: 'Combine heroes to unlock synergy bonuses and amplify power.' }
	];
</script>

<div class="flex flex-col items-center w-full min-h-full">
	<!-- Hero section -->
	<div class="relative w-full flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 overflow-hidden">
		<!-- Background glow -->
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-[-20%] left-[15%] w-[400px] h-[400px] rounded-full bg-red-600/8 blur-[80px] animate-pulse"></div>
			<div class="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-amber-600/6 blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>
		</div>

		<div class="relative z-10 max-w-2xl">
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-800/40 bg-red-950/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
				<i class="fi fi-br-flame text-[0.6rem]"></i>
				<span>The Dark Rift</span>
			</div>

			<h1 class="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-red-400 via-amber-300 to-red-400 bg-clip-text text-transparent leading-tight">
				The Dark Rift Awaits
			</h1>

			{#if data.isAuthenticated}
				<!-- Authenticated but no Dota account linked -->
				<p class="text-lg text-slate-400 mb-8 leading-relaxed">
					Your account is ready, but you need to <strong class="text-amber-300">link a Dota 2 account</strong> to begin your journey.
					Connect via Steam to import your match history and unlock the Dark Rift.
				</p>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
					<a
						href="/profile"
						class="inline-flex items-center gap-2.5 px-6 py-3 rounded-md border border-amber-600/50 bg-gradient-to-r from-amber-950/60 to-red-950/60 text-amber-200 font-bold text-sm uppercase tracking-wider hover:border-amber-500/70 hover:shadow-[0_0_20px_rgba(217,119,6,0.2)] transition-all duration-300"
					>
						<i class="fi fi-rr-user text-sm"></i>
						<span>Go to Profile</span>
					</a>
					<a
						href="/api/auth/steam"
						class="inline-flex items-center gap-2.5 px-6 py-3 rounded-md border border-orange-700/40 bg-gradient-to-r from-orange-950/40 to-red-950/40 text-orange-200 font-bold text-sm uppercase tracking-wider hover:border-orange-600/60 hover:shadow-[0_0_20px_rgba(255,107,53,0.15)] transition-all duration-300"
					>
						<img class="w-4 h-4" alt="Steam" src={steam_logo} />
						<span>Link Steam Account</span>
					</a>
				</div>
			{:else}
				<!-- Not authenticated at all -->
				<p class="text-lg text-slate-400 mb-8 leading-relaxed">
					Your Dota 2 matches are just the beginning. Build a meta-game empire, manage legendary heroes,
					and ascend through an incremental dark fantasy world.
					<strong class="text-slate-300">Sign in and link your Dota 2 account</strong> to begin.
				</p>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
					<a
						href="/api/auth/google"
						class="inline-flex items-center gap-2.5 px-6 py-3 rounded-md border border-cyan-700/40 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 text-cyan-200 font-bold text-sm uppercase tracking-wider hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300"
						data-sveltekit-preload-data="off"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span>Sign in with Google</span>
					</a>
					<a
						href="/api/auth/steam"
						class="inline-flex items-center gap-2.5 px-6 py-3 rounded-md border border-orange-700/40 bg-gradient-to-r from-orange-950/40 to-red-950/40 text-orange-200 font-bold text-sm uppercase tracking-wider hover:border-orange-600/60 hover:shadow-[0_0_20px_rgba(255,107,53,0.15)] transition-all duration-300"
					>
						<img class="w-4 h-4" alt="Steam" src={steam_logo} />
						<span>Sign in with Steam</span>
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Divider -->
	<div class="w-full max-w-4xl px-6">
		<div class="h-px bg-gradient-to-r from-transparent via-red-800/40 to-transparent"></div>
	</div>

	<!-- Feature teaser grid -->
	<div class="w-full max-w-5xl px-6 py-12">
		<h2 class="text-2xl font-bold text-center text-slate-300 mb-8">What Awaits Inside</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each features as f}
				<div class="flex flex-col gap-2 p-4 rounded-lg border border-red-800/20 bg-red-950/15 hover:border-red-700/35 transition-colors">
					<i class="{f.icon} text-red-500/70 text-lg"></i>
					<h3 class="text-sm font-bold text-slate-200">{f.title}</h3>
					<p class="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
```

**Step 3: Verify the page renders**

Run: `npm run dev` and visit `/incremental/welcome` while logged out.
Expected: See the welcome page with login buttons and feature teaser cards.

**Step 4: Commit**

```bash
git add src/routes/incremental/welcome/+page.svelte src/routes/incremental/welcome/+page.server.ts
git commit -m "feat: add Dark Rift welcome/placeholder page for unauthenticated users"
```

---

### Task 3: Update Navigation to grey out DotaDeck/Leagues and hide Dark Rift sub-items

**Files:**
- Modify: `src/routes/_components/Navigation/Navigation.svelte`

**Step 1: Grey out DotaDeck and Leagues for unauthenticated users**

In the "Dota 2" section (lines 126-136), replace the `<a>` tags for DotaDeck and Leagues with conditional rendering:
- If `session?.user` → render as `<a>` (current behavior)
- Else → render as `<span>` with `opacity-50 cursor-not-allowed` and a lock icon

**Step 2: Hide Dark Rift sub-items for unauthenticated users**

In the Dark Rift section (lines 161-188), only show the "Enter the Rift" featured link when unauthenticated. The non-featured sub-items (Dashboard, Scavenging, Barracks, etc.) should be hidden.

Change the `{#each}` block inside `{#if incrementalExpanded}` to conditionally filter:
- Always show routes where `route.featured === true`
- Only show non-featured routes when `session?.user` exists

The full updated Navigation.svelte (relevant sections):

**Dota 2 section** — replace lines 128-136:
```svelte
{#if session?.user}
	<a href="/dotadeck" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/dotadeck')}>
		<i class="fi fi-rr-playing-cards nav-icon text-amber-400 w-4 text-center text-sm leading-none"></i>
		<span>DotaDeck</span>
	</a>
{:else}
	<span class="{navLink} opacity-40 !cursor-not-allowed hover:!bg-transparent hover:!text-slate-400 hover:!border-l-transparent" title="Login required">
		<i class="fi fi-rr-playing-cards nav-icon text-amber-400/40 w-4 text-center text-sm leading-none"></i>
		<span>DotaDeck</span>
		<i class="fi fi-br-lock text-[0.6rem] ml-auto text-slate-600"></i>
	</span>
{/if}

{#if session?.user}
	<a href="/leagues" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/leagues')}>
		<i class="fi fi-br-users-alt nav-icon text-teal-400 w-4 text-center text-sm leading-none"></i>
		<span>Leagues</span>
	</a>
{:else}
	<span class="{navLink} opacity-40 !cursor-not-allowed hover:!bg-transparent hover:!text-slate-400 hover:!border-l-transparent" title="Login required">
		<i class="fi fi-br-users-alt nav-icon text-teal-400/40 w-4 text-center text-sm leading-none"></i>
		<span>Leagues</span>
		<i class="fi fi-br-lock text-[0.6rem] ml-auto text-slate-600"></i>
	</span>
{/if}
```

**Dark Rift expanded section** — replace the `{#each}` block inside `{#if incrementalExpanded}` (lines 163-186):
```svelte
{#each incrementalRoutes as route}
	{#if route.featured}
		<a
			href={route.path}
			data-sveltekit-preload-data="tap"
			class="featured-rift-link group relative flex items-center gap-2.5 py-2 px-3 pl-[2.125rem] my-0.5 rounded-md border border-red-800/30 bg-linear-to-r from-red-950/40 via-red-900/20 to-red-950/40 cursor-pointer text-left text-sm font-semibold no-underline transition-all duration-200 ease-in-out hover:border-red-600/50 hover:from-red-950/60 hover:via-red-900/30 hover:to-red-950/60 hover:shadow-[0_0_12px_rgba(220,38,38,0.15)]"
			class:is-active={isActive(route.path, route.exact)}
		>
			<i class="{route.icon} nav-icon w-3 text-center text-xs leading-none text-red-500 group-hover:text-red-400 transition-colors"></i>
			<span class="bg-linear-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">{route.label}</span>
			<i class="fi fi-br-angle-right ml-auto text-[0.6rem] text-red-700/60 group-hover:text-red-500/80 transition-colors"></i>
		</a>
	{:else if session?.user}
		<a
			href={route.path}
			data-sveltekit-preload-data="tap"
			class={navLinkSub}
			class:is-active={isActive(route.path, route.exact)}
		>
			<i class="{route.icon} nav-icon w-3 text-center text-xs leading-none text-slate-600"></i>
			<span>{route.label}</span>
		</a>
	{/if}
{/each}
```

**Step 3: Verify navigation behavior**

Run: `npm run dev`
- Logged out: DotaDeck/Leagues greyed out with lock icons, only "Enter the Rift" shown in Dark Rift section
- Logged in: All items visible and clickable as before

**Step 4: Commit**

```bash
git add src/routes/_components/Navigation/Navigation.svelte
git commit -m "feat: grey out DotaDeck/Leagues and hide Rift sub-items for unauthenticated users"
```

---

### Task 4: Fix DotaDeck auth guard to redirect instead of returning 401

**Files:**
- Modify: `src/routes/dotadeck/+page.server.ts`

**Step 1: Replace 401 return with redirect**

Change line 10 from:
```typescript
if (!authUser) return { status: 401 };
```
to:
```typescript
if (!authUser) {
	redirect(302, '/');
}
```

The `redirect` import is already present on line 5.

**Step 2: Verify the redirect**

Run: `npm run dev` and visit `/dotadeck` while logged out.
Expected: Redirected to `/` (homepage).

**Step 3: Commit**

```bash
git add src/routes/dotadeck/+page.server.ts
git commit -m "fix: redirect unauthenticated users from DotaDeck to homepage instead of returning 401"
```

---

### Task 5: Manual smoke test

**No files changed — verification only.**

**Step 1: Test unauthenticated flow**
1. Log out
2. Visit `/` — should see homepage with "Enter the Dark Rift" section (no "Continue Your Journey" button)
3. Sidebar: DotaDeck + Leagues greyed out with lock icons; Dark Rift section shows only "Enter the Rift"
4. Click "Enter the Rift" → should redirect to `/incremental/welcome`
5. Welcome page shows login buttons + feature teasers
6. Visit `/dotadeck` directly → redirects to `/`
7. Visit `/leagues` directly → redirects to `/`
8. Visit `/incremental` directly → redirects to `/incremental/welcome`

**Step 2: Test authenticated flow**
1. Log in
2. Sidebar: DotaDeck + Leagues are clickable links; Dark Rift section shows all sub-items
3. Visit `/incremental/welcome` → redirects to `/incremental` (since user has account)
4. All incremental sub-routes work normally
