<script lang="ts">
	import { run } from 'svelte/legacy';

	import '../app.css';

	import { getContext, setContext } from 'svelte';

	import { dev } from '$app/environment';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { browser } from '$app/environment';

	//skeleton
	import { AppBar, Toast, Dialog } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/toaster';

	setContext('toaster', toaster);

	//types
	import type { PageData } from './$types';
	import type { User, UserSession, Hero } from '@prisma/client';

	//props - must be declared before use in Svelte 5
	interface Props {
		//page data
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	//components
	import Navigation from './_components/Navigation/Navigation.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import HeroGrid from './turbotown/_components/HeroGrid/HeroGrid.svelte';
	import AdminTools from '$lib/components/AdminTools.svelte';
	import DeckView from './dotadeck/_components/DeckView.svelte';

	//assets
	import '@flaticon/flaticon-uicons/css/all/all.css';
	//import HeroSprites from 'dota2-css-hero-sprites/assets/stylesheets/dota2minimapheroes.css'
	import 'dota2-css-hero-sprites/assets/stylesheets/dota2minimapheroes.css';

	//constants
	import { constant_patchLink, constant_townVersion } from '$lib/constants/turbotown';

	//images
	import steam_logo from '$lib/assets/steam_logo.png';
	import turbo_logo from '$lib/assets/turbologo.png';
	import ogImage from '$lib/assets/turbodota_1200-630.png';

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';

	//analytics
	import { inject } from '@vercel/analytics';
	inject({ mode: dev ? 'development' : 'production' });

	//mocks
	// Loaded from .env.local, guide covers this
	// step in a moment.
	const isMswEnabled = dev && import.meta.env.VITE_MSW_ENABLED === 'true';
	// Flag to defer rendering of components
	// until certain criteria are met on dev,
	// e.g. MSW init.
	let isReady = !isMswEnabled;
	// if (isMswEnabled) {
	// 	import('$mocks').then((res) => res.inject()).then(() => (isReady = true));
	// }
	// async function enableMocking() {
	// 	if (process.env.NODE_ENV !== 'development') {
	// 		return;
	// 	}

	// 	console.log('[msw] - enabling mocking')
	// 	const { worker } = await import('../mocks/browser');

	// 	// `worker.start()` returns a Promise that resolves
	// 	// once the Service Worker is up and ready to intercept requests.
	// 	return worker.start();
	// }

	// let isReady = enableMocking()
	// $: console.log(isReady)

	//visibility change

	if (browser) {
		document.addEventListener('visibilitychange', () => {
			if (window.document.visibilityState === 'visible') {
				console.log('[document] - visible - ', document.visibilityState);
			} else {
				console.log('[document] - hidden', document.visibilityState);
			}
		});
	}

	


	if (browser) {
		console.log('root data: ', data);
	}

	let user: User | null = data.user || null;
	let session: UserSession | null = data.session || null;

	const REFRESH_COOLDOWN_MS = 5000;

	let matchRefreshLoading = $state(false);
	let lastRefreshCompletedAt = $state<number>(0);

	async function refreshMatches() {
		const accountId = user?.account_id;
		if (!accountId || matchRefreshLoading) return;

		const now = Date.now();
		if (lastRefreshCompletedAt > 0 && now - lastRefreshCompletedAt < REFRESH_COOLDOWN_MS) {
			const remainingMs = REFRESH_COOLDOWN_MS - (now - lastRefreshCompletedAt);
			const secondsRemaining = Math.ceil(remainingMs / 1000);
			toaster.warning({
				title: 'Rate limit',
				description: `Please wait ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'} before refreshing matches again.`
			});
			return;
		}

		matchRefreshLoading = true;
		try {
			const res = await fetch(`/api/updateMatchesForUser/${accountId}`, { method: 'GET' });
			if (res.ok) {
				lastRefreshCompletedAt = Date.now();
				await invalidateAll();
				toaster.success({
					title: 'Matches refreshed',
					description: 'Your match data has been updated.'
				});
			}
		} finally {
			matchRefreshLoading = false;
		}
	}

	// For backwards compatibility with components expecting old Lucia session structure
	// Transform to match old { user: {...} } structure
	const legacySession = user ? { user } : null;

	//set session in context for components
	setContext('session', legacySession);
	setContext('userPreferences', data.userPreferences);
	setContext('openDotaDown', false);

	let openDotaDown = getContext('openDotaDown');

	let navigatingTest = false;

	//set context for modal component (always an array; fallback if layout load used DB)
	const allHeroes = data.heroDescriptions?.allHeroes ?? [];
	setContext('heroes', allHeroes);

	//create ban store
	import { banStore } from '$lib/stores/banStore';

	/* Initialize store */
	const ctxHeroes = getContext<Hero[] | undefined>('heroes');
	const heroes: Hero[] = allHeroes.length > 0 ? allHeroes : (Array.isArray(ctxHeroes) ? ctxHeroes : []);
	banStore.setAllHeroes(heroes);

	/* Set bans from preferences */
	let preferences = data.userPreferences;

	if (preferences && preferences.length > 0) {
		console.log(`[root layout] - evaluating userPreferencces`);
		let banListPref = preferences.filter((pref: any) => pref.name === 'randomBanList');

		try {
			if (banListPref.length > 0 && banListPref[0].value) {
				console.log(`[root layout] - evaluating saved ban list`);
				let randomBanListParsed = JSON.parse(banListPref[0].value);

				//console.log(randomBanListParsed);

				//console.log(heroes);
				let setList = heroes.filter((hero: Hero) => randomBanListParsed.includes(hero.id));

				//console.log(setList);
				banStore.setBanList(setList);
			}
		} catch (e) {
			console.error('error in setting preferences');
		}
	}

	//console.log('[root layout] setting banStore', $banStore);
	setContext('banStore', banStore);

	// Modal state (Skeleton v3)
	let showHeroGridModal = $state(false);
	let showAdminToolsModal = $state(false);
	let showDeckViewModal = $state(false);
	
	// Set modal triggers in context for child components
	setContext('showHeroGridModal', () => { showHeroGridModal = true; });
	setContext('showAdminToolsModal', () => { showAdminToolsModal = true; });
	setContext('showDeckViewModal', () => { showDeckViewModal = true; });

	//drawer
	// TODO: Skeleton v3 Drawer API is different - needs migration
	// const drawerStore = getDrawerStore();
	function drawerOpen(): void {
		// drawerStore.open({});
		console.warn('Drawer not yet implemented in Skeleton v3');
	}

	beforeNavigate(() => {
		// drawerStore.close();
	});

	// popup
	// TODO: Skeleton v3 API changes - PopupSettings may not exist
	// import type { PopupSettings } from '@skeletonlabs/skeleton-svelte';
	// const adminPopupClick: PopupSettings = {
	// 	event: 'click',
	// 	target: 'adminTools',
	// 	placement: 'right'
	// };

	// const modal: ModalSettings = {
	// 	type: 'component',
	// 	component: 'adminTools'
	// };
</script>

<svelte:head>
	<!-- 

		OG Meta Stuff
	 -->

	<!-- HTML Meta Tags -->
	{#if dev}
		<title>[DEV] Turbodota</title>
	{:else}
		<title>Turbodota - The Tracker for Turbo</title>
	{/if}

	<meta name="description" content="Track your randoms, and compete to become Mayor of Turbotown!" />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content="https://new.turbodota.com" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Turbodota - The Tracker for Turbo" />
	<meta property="og:description" content="Track your randoms, and compete to become Mayor of Turbotown!" />
	<meta property="og:image" content={ogImage} />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="new.turbodota.com" />
	<meta property="twitter:url" content="https://new.turbodota.com" />
	<meta name="twitter:title" content="Turbodota - The Tracker for Turbo" />
	<meta name="twitter:description" content="Track your randoms, and compete to become Mayor of Turbotown!" />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<!-- App Shell -->
{#await isReady}
	<div>Registering service worker {isReady}</div>
{:then}
	{#if browser}
		<Toast.Group toaster={toaster}>
			{#snippet children(toast)}
				<Toast toast={toast}>
					<Toast.Message>
						<Toast.Title>{toast.title}</Toast.Title>
						{#if toast.description}
							<Toast.Description>{toast.description}</Toast.Description>
						{/if}
					</Toast.Message>
					<Toast.CloseTrigger />
				</Toast>
			{/snippet}
		</Toast.Group>
	{/if}
	
	<!-- Basic layout structure (AppShell doesn't exist in Skeleton v3) -->
	<div class="flex flex-col h-screen bg-surface-900">
		<!-- Render Header -->
		{@render header()}
		
		<div class="flex flex-auto w-full h-full overflow-hidden">
			<!-- Sidebar -->
			<aside class="bg-surface-500/10 hidden lg:block overflow-y-auto w-0 lg:w-64 shrink-0">
				{@render sidebarLeft()}
			</aside>
			
			<!-- Main Content -->
			<div class="flex w-full overflow-y-auto" id="pageRoute">
				{#if ($navigating && !$navigating?.to?.url.pathname.includes('herostats')) || navigatingTest}
					<div class="m-8 w-full"><Loading /></div>
				{:else}
					{@render children?.()}
				{/if}
			</div>
		</div>
	</div>

	<!-- Snippet Definitions -->
	{#snippet header()}
		<!-- App Bar -->
		<AppBar class="shadow-lg shadow-surface-950 bg-surface-900 border-b-1 border-surface-500">
			<AppBar.Toolbar class="grid grid-cols-[auto_1fr_auto] items-center">
				<AppBar.Lead>
					<!-- Hamburger Button-->
					<div class="flex items-center">
						<button class="lg:hidden btn btn-sm mr-4" onclick={drawerOpen} aria-label="Open menu">
							<span>
								<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
									<rect width="100" height="20" />
									<rect y="30" width="100" height="20" />
									<rect y="60" width="100" height="20" />
								</svg>
							</span>
						</button>
						<img src={turbo_logo} class="w-14" alt="site logo" />
						<strong class="text-sm lg:text-xl uppercase ml-4 text-center">Turbodota v4</strong>
						
					</div>
				</AppBar.Lead>

				<AppBar.Headline>
					{#if dev}
							<div class="mx-8 flex flex-col">
								<p>{`env: ${process.env.NODE_ENV}`}</p>
							</div>
						{/if}
					<!-- Empty headline - takes up middle space -->
				</AppBar.Headline>

				<AppBar.Trail>
					<div class="flex items-center space-x-3 mr-4">
						{#if user}
							<!-- Profile link with Dota connection status (click = refresh when connected) -->
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<div
								class="flex items-center gap-2 p-1.5 rounded-full text-surface-300 text-xs min-w-0 {data.dotaAccountStatus?.connected && !matchRefreshLoading
									? 'hover:bg-surface-500/30 transition-colors cursor-pointer'
									: ''}"
								role={data.dotaAccountStatus?.connected ? 'button' : undefined}
								tabindex={data.dotaAccountStatus?.connected ? 0 : undefined}
								onclick={data.dotaAccountStatus?.connected ? refreshMatches : undefined}
								onkeydown={data.dotaAccountStatus?.connected
									? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), refreshMatches())
									: undefined}
							>
								<a href="/profile" class="shrink-0" aria-label="Profile" onclick={(e) => e.stopPropagation()}>
									<span
										class="w-3 h-3 rounded-full block {matchRefreshLoading
											? 'bg-amber-500 animate-pulse'
											: data.dotaAccountStatus?.connected
												? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
												: 'bg-surface-500'}"
										aria-hidden="true"
									></span>
								</a>
								<span class="flex flex-col leading-tight min-w-0">
									{#if matchRefreshLoading}
										<span class="text-amber-400">Refreshing matches…</span>
									{:else if data.dotaAccountStatus?.connected}
										<span>Last Match Parsed</span>
										<span class="text-surface-400">
											{data.dotaAccountStatus?.lastMatchesFetched
												? new Date(data.dotaAccountStatus.lastMatchesFetched).toLocaleString()
												: '—'}
											{#if data.dotaAccountStatus?.lastMatchId}
												{' · '}
												<a
													href={`https://dotabuff.com/matches/${data.dotaAccountStatus.lastMatchId}`}
													target="_blank"
													rel="noopener noreferrer"
													class="text-primary-400 hover:underline"
													onclick={(e) => e.stopPropagation()}
												>
													Match {data.dotaAccountStatus.lastMatchId}
												</a>
											{/if}
										</span>
									{:else}
										<a href="/profile" class="text-surface-300 hover:text-surface-100" onclick={(e) => e.stopPropagation()}>Connect Dota in profile</a>
									{/if}
								</span>
							</div>
							<!-- Notifications -->
							{#if !$page.url.pathname.includes('herostats')}
								<a href="/feed" class="h-10 w-10" aria-label="Notifications">
									<div class="relative inline-block mt-2">
										<span class="vibrating badge-icon bg-primary-500 absolute -top-2 right-0 z-50"
											><p class="inline text-amber-500 font-bold"></p></span
										>
										<button class="hover:bg-amber-500/50 rounded-full w-10 h-10" aria-label="Notifications">
											<i class="fi fi-rr-bell text-xl h-10 w-10"></i>
										</button>
									</div>
								</a>
							{/if}
							<!-- Logout -->
							<form method="POST">
								<button class="btn bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50" formaction="/logout" type="submit">
									<span class="leading-[0]"><i class="fi fi-br-sign-out-alt"></i></span>
									<span class="hidden sm:inline">Logout</span>
								</button>
							</form>
						{:else}
							<!-- Google Login -->
							<a class="btn preset-filled-primary-500 flex items-center space-x-2" href="/api/auth/google" data-sveltekit-preload-data="off">
								<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
									<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
									<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
									<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
								</svg>
								<span class="hidden sm:inline">Sign in with Google</span>
							</a>
							<!-- Steam Login -->
							<a class="btn preset-tonal flex items-center space-x-2" href="/api/auth/steam" data-sveltekit-preload-data="tap">
								<img class="w-5 h-5" alt="Steam logo" src={steam_logo} />
								<span class="hidden sm:inline">Sign in with Steam</span>
							</a>
						{/if}
					</div>
				</AppBar.Trail>
			</AppBar.Toolbar>
		</AppBar>
	{/snippet}

	{#snippet sidebarLeft()}
		<!-- Insert the list: -->
		<div class="border-r-1 border-surface-500 h-full flex flex-col justify-between w-full" id="sidebarLeft">
			<Navigation session={legacySession} />
			<div class="flex flex-col items-center w-full justify-center bottom-0 relative">
				<div class="p-2 flex flex-col justify-center items-center">
					<a href={`/blog/${constant_patchLink}`}>
						<p class="text-xs italic text-tertiary-500">Patch: {constant_townVersion}</p>
					</a>
					<a href="https://twitter.com/nosaltstudios" target="_blank" class="hover:text-blue-900">
						<p class="text-sm font-bold italic text-slate-300 dark:text-surface-400 hover:text-blue-900">
							© No Salt Studios 2026
						</p>
					</a>

					<p class="text-sm italic text-slate-300 dark:text-surface-400 text-center">
						Dota 2 is a trademark of Valve Corporation
					</p>
				</div>
				{#if openDotaDown}
					<div class="h-16 w-[90%] bg-warning-500 p-2 flex flex-col justify-center items-center rounded-xl m-2">
						<p class="font-bold text-lg text-primary-500 vibrating">WARNING</p>
						<p class="font-bold text-red-500">Open Dota Down</p>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
{/await}

<!-- Skeleton v3 Modals -->
{#if showHeroGridModal}
	<Dialog 
		open={showHeroGridModal} 
		onOpenChange={(details) => showHeroGridModal = details.open}
	>
		<HeroGrid 
			heroes={heroes}
			onClose={() => showHeroGridModal = false}
		/>
	</Dialog>
{/if}

{#if showAdminToolsModal}
	<Dialog 
		open={showAdminToolsModal} 
		onOpenChange={(details) => showAdminToolsModal = details.open}
	>
		<AdminTools onClose={() => showAdminToolsModal = false} />
	</Dialog>
{/if}

{#if showDeckViewModal}
	<Dialog 
		open={showDeckViewModal} 
		onOpenChange={(details) => showDeckViewModal = details.open}
	>
		<DeckView onClose={() => showDeckViewModal = false} />
	</Dialog>
{/if}
