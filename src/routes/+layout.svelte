<script lang="ts">
	import '../app.pcss';

	import { setContext } from 'svelte'

	import { dev } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { browser } from '$app/environment';

	//skeleton
	import {
		AppShell,
		AppBar,
		LightSwitch,
		initializeStores,
		Drawer,
		getDrawerStore,
		Modal,
		getModalStore,
		Toast
	} from '@skeletonlabs/skeleton';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	//must be called in root layout, one time
	initializeStores();

	//types
	import type { PageData } from './$types';
	import type { Session } from 'lucia';

	//components
	import Navigation from './_components/Navigation/Navigation.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import HeroGrid from '$lib/components/HeroGrid/HeroGrid.svelte';

	//assets
	import '@flaticon/flaticon-uicons/css/all/all.css';
	//import HeroSprites from 'dota2-css-hero-sprites/assets/stylesheets/dota2minimapheroes.css'
	import 'dota2-css-hero-sprites/assets/stylesheets/dota2minimapheroes.css';

	//images
	import steam_logo from '$lib/assets/steam_logo.png';
	import turbo_logo from '$lib/assets/turbologo.png';

	import ogImage from '$lib/assets/turbodota_1200-630.png';
	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

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

	//page data

	export let data: PageData;

	let session: Session | null = data.session || null;

	//set session in context for components
	setContext('session', session)
	setContext('userPreferences', data.userPreferences)

	let navigatingTest = false;

	//set context for modal component

	setContext('heroes', data.heroDescriptions.allHeroes)

	//modal
	const modalStore = getModalStore();

	const modalRegistry: Record<string, ModalComponent> = {
		// Set a unique modal ID, then pass the component reference
		heroGrid: { ref: HeroGrid }
		// ...
	};

	//drawer

	const drawerStore = getDrawerStore();

	function drawerOpen(): void {
		drawerStore.open({});
	}

	beforeNavigate(() => {
		drawerStore.close();
	});
</script>

<svelte:head>
	<!-- 

		OG Meta Stuff
	 -->

	<!-- HTML Meta Tags -->
	<title>Turbodota - The Tracker for Turbo</title>
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
	<Toast />
	<Modal components={modalRegistry} />
	<Drawer><Navigation {session} /></Drawer>
	<AppShell slotSidebarLeft="bg-surface-500/10 w-0 lg:w-64">
		<svelte:fragment slot="header">
			<!-- App Bar -->
			<AppBar shadow="shadow-md">
				<svelte:fragment slot="lead">
					<!-- Hamburger Button-->
					<div class="flex items-center">
						<button class="lg:hidden btn btn-sm mr-4" on:click={drawerOpen}>
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
						{#if dev}
							<div class="mx-8 flex flex-col">
								<!-- <p>{`isReady: ${JSON.stringify(isReady)}`}</p> -->
								<p>{`env: ${process.env.NODE_ENV}`}</p>
							</div>
							<button class="btn variant-ghost-warning">Admin tools</button>
						{/if}
					</div>
				</svelte:fragment>

				<svelte:fragment slot="trail">
					<div class="flex justify-around space-x-8 items-center">
						{#key data.session}
							<div class="h-full m-auto">
								{#if data.session && !$page.url.pathname.includes('herostats')}
									<div class="m-auto h-full text-center">
										Welcome <p class="font-bold text-red-400">{`${data.session.user.username}`}</p>
									</div>
								{/if}
							</div>
						{/key}
						<!-- <form method="POST">
						<div class="flex flex-col lg:flex-row lg:space-x-2">	
							<a class="btn btn-sm variant-ghost-surface" href="/">Home</a>
							{#if !data.session || !data.session.user}
								<a class="btn btn-sm variant-ghost-surface" href="/register">Register</a>
	
								<a class="btn btn-sm variant-ghost-surface" href="/login" role="button"
									>Login
									<img class="w-8 ml-1.5" alt="steamlogo" src={steam_logo} />
								</a>
							{:else}
								<button class="btn btn-sm variant-ghost-surface" formaction="/logout" type="submit"
									>Logout</button
								>
							{/if}
						</div>
					</form> -->
						<LightSwitch />
					</div>
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>

		<svelte:fragment slot="sidebarLeft">
			<!-- Insert the list: -->
			<div class="border-r border-primary-500/30 h-full"><Navigation {session} /></div>

			<!-- --- -->
		</svelte:fragment>

		<!-- <svelte:fragment slot="pageFooter">
			{#if $page.url.pathname.includes('turbotown')}
				<div class="flex h-32 w-full justify-center m-auto border border-red-500">
					<p class="text-xs text-slate-300 dark:text-slate-700">Copyright No Salt Studios 2023</p>
				</div>
			{/if}
		</svelte:fragment> -->

		<!-- Page Route Content -->
		<div class="h-[calc(100vh-80px)] flex w-full" id="pageRoute">
			{#if ($navigating && !$navigating?.to?.url.pathname.includes('herostats')) || navigatingTest}
				<div class="m-8 w-full"><Loading /></div>
			{:else}
				<slot />
			{/if}
		</div>
	</AppShell>
{/await}
