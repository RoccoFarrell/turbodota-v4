<script lang="ts">
	import '../app.postcss';
	import {
		AppShell,
		AppBar,
		LightSwitch,
		initializeStores,
		Drawer,
		getDrawerStore
	} from '@skeletonlabs/skeleton';

	import { beforeNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';

	//types
	import type { PageData } from './$types';
	import type { Session } from 'lucia';

	//components
	import Navigation from '$lib/Navigation/Navigation.svelte';
	import Loading from '$lib/components/Loading.svelte';

	//imports
	import steam_logo from '$lib/assets/steam_logo.png';
	import turbo_logo from '$lib/assets/turbologo.png';
	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	

	export let data: PageData;

	//console.log(data.session);
	let session: Session = data.session || null;

	//drawer
	initializeStores();

	const drawerStore = getDrawerStore();

	function drawerOpen(): void {
		drawerStore.open({});
	}

	beforeNavigate(() => {
		drawerStore.close();
	});
</script>

<!-- App Shell -->
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
					<strong class="text-sm lg:text-xl uppercase ml-4 text-center">Turbodota v3</strong>
				</div>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<div class="flex justify-around space-x-8 items-center">
					<div class="h-full m-auto">
						{#if data.session}
							<div class="m-auto h-full text-center">
								Welcome <p class="font-bold text-red-400">{`${data.session.user.username}`}</p>
							</div>
						{/if}
					</div>
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
		<Navigation {session} />
		<!-- --- -->
	</svelte:fragment>

	<!-- Page Route Content -->
	<div class="my-8 mx-4 lg:mx-12 h-max">
		{#if $navigating}
		<Loading />

		{:else}
			<slot />
		{/if}
	</div>
</AppShell>
