<script lang="ts">
	import '../app.pcss';

	import { getContext, setContext } from 'svelte';

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
		Toast
	} from '@skeletonlabs/skeleton';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	//must be called in root layout, one time
	initializeStores();

	//types
	import type { PageData } from './$types';
	import type { Session } from 'lucia';
	import type { Hero } from '@prisma/client';

	//components
	import Navigation from './_components/Navigation/Navigation.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import HeroGrid from './turbotown/_components/HeroGrid/HeroGrid.svelte';
	import AdminTools from '$lib/components/AdminTools.svelte';

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

	//set context for modal component

	setContext('heroes', data.heroDescriptions.allHeroes);

	//create ban store
	import { banStore } from '$lib/stores/banStore';

	/* Initialize store */
	let heroes = data.heroDescriptions.allHeroes;
	if (heroes.length === 0) heroes = getContext('heroes');
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

	//modal
	const modalStore = getModalStore();

	const modalRegistry: Record<string, ModalComponent> = {
		// Set a unique modal ID, then pass the component reference
		heroGrid: { ref: HeroGrid },
		adminTools: { ref: AdminTools }
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

	// popup
	$: console.log(storePopup);
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	const adminPopupClick: PopupSettings = {
		event: 'click',
		target: 'adminTools',
		placement: 'right'
	};

	const modal: ModalSettings = {
		type: 'component',
		component: 'adminTools'
	};
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
							<!-- <button 
							class="btn variant-ghost-warning" 
							use:popup={adminPopupClick}>
							Admin tools
						</button> -->
							<button
								class="btn variant-ghost-warning"
								on:click={() => {
									modalStore.trigger(modal);
								}}>Admin Tools</button
							>
							<div class="z-50 card p-4 variant-filled-primary" data-popup="adminTools">
								<p>Click Content</p>
								<div class="arrow variant-filled-primary" />
							</div>
						{/if}
					</div>
				</svelte:fragment>

				<svelte:fragment slot="trail">
					<div class="flex justify-around space-x-8 items-center mr-8">
						{#key data.session}
							<div class={"h-full m-auto grid" + (dev ? " grid-cols-2" : "grid-cols-1")}>
								{#if data.session && !$page.url.pathname.includes('herostats')}
										<div class="flex justify-center items-center">
											<a href="/feed" class="h-10 w-10">
												<div class="relative inline-block mt-2">
													<span class="vibrating badge-icon bg-primary-500 absolute -top-2 -right-0 z-50"
														><p class="inline text-amber-500 font-bold"></p></span
													>
													<button class="hover:bg-amber-500/50 rounded-full w-10 h-10">
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
						<!-- <LightSwitch /> -->
					</div>
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>

		<svelte:fragment slot="sidebarLeft">
			<!-- Insert the list: -->
			<div class="border-r border-primary-500/30 h-full flex flex-col justify-between">
				<Navigation {session} />
				<div class="flex flex-col items-center w-full justify-center bottom-0 relative">
					<div class="p-2 flex flex-col justify-center items-center">
						<a href={`/blog/${constant_patchLink}`}>
							<p class="text-xs italic text-tertiary-500">Patch: {constant_townVersion}</p>
						</a>
						<a href="https://twitter.com/nosaltstudios" target="_blank" class="hover:text-blue-900">
							<p class="text-sm font-bold italic text-slate-300 dark:text-surface-400 hover:text-blue-900">
								No Salt Studios 2024
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

			<!-- --- -->
		</svelte:fragment>

		<!-- <svelte:fragment slot="pageFooter">
				<div class="flex w-full justify-center m-auto p-2">
					<p class="text-md text-slate-300 dark:text-surface-400">No Salt Studios 2024 | Dota 2 is a trademark of Valve Corporation</p>
				</div>
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
