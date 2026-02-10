<script lang="ts">
	import { run } from 'svelte/legacy';

	import '../app.css';

	import { getContext, setContext } from 'svelte';

	import { dev } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { browser } from '$app/environment';

	//skeleton
	import { AppBar, Toast, Dialog } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/toaster';

	setContext('toaster', toaster);

	//types
	import type { PageData } from './$types';
	import type { Session } from 'lucia';
	import type { Hero } from '@prisma/client';

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

	let session: Session | null = data.session || null;

	//set session in context for components
	setContext('session', session);
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
					<div class="flex justify-around space-x-8 items-center mr-8">
						{#key data.session}
							<div class={"h-full m-auto grid grid-cols-2"}>
								{#if data.session && !$page.url.pathname.includes('herostats')}
									<div class="flex justify-center items-center">
										<a href="/feed" class="h-10 w-10">
											<div class="relative inline-block mt-2">
												<span class="vibrating badge-icon bg-primary-500 absolute -top-2 right-0 z-50"
													><p class="inline text-amber-500 font-bold"></p></span
												>
												<button class="hover:bg-amber-500/50 rounded-full w-10 h-10" aria-label="Notifications">
													<i class="fi fi-rr-bell text-xl h-10 w-10"></i>
												</button>
											</div>
										</a>
									</div>
									<div class="m-auto h-full text-center">
										Welcome <p class="font-bold text-red-400">{`${data.session.user.username}`}</p>
									</div>
								{/if}
							</div>
						{/key}
					</div>
				</AppBar.Trail>
			</AppBar.Toolbar>
		</AppBar>
	{/snippet}

	{#snippet sidebarLeft()}
		<!-- Insert the list: -->
		<div class="border-r-1 border-surface-500 h-full flex flex-col justify-between w-full" id="sidebarLeft">
			<Navigation {session} />
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
