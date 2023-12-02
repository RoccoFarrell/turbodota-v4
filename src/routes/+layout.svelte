<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import steam_logo from '$lib/assets/steam_logo.png'
	//imports
	import type { PageData } from './$types';
	export let data: PageData;

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<!-- App Shell -->
<AppShell slotSidebarLeft="bg-surface-500/5 w-56 p-4">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Turbodota v3</strong>
			</svelte:fragment>
			
			<svelte:fragment slot="trail">
				<div class="flex justify-around space-x-8">
				<div>
					{#if data.session}
						{JSON.stringify(data.session.user)}
					{/if}
				</div>
				<form method="POST">
					<a class="btn btn-sm variant-ghost-surface" href="/"
						>Home</a
					>
					{#if !data.session || !data.session.user}
						<a
							class="btn btn-sm variant-ghost-surface"
							href="/register">Register</a
						>

						<a
							class="btn btn-sm variant-ghost-surface"
							href="/login"
							role="button">Login
							<img class="w-8 ml-1.5" alt="steamlogo" src={steam_logo} /> </a
						>
					{:else}
						<button class="btn btn-sm variant-ghost-surface" formaction="/logout" type="submit">Logout</button>
					{/if}
				</form>
				<LightSwitch/>
			</div>
			</svelte:fragment>
			
		</AppBar>
	</svelte:fragment>

	<svelte:fragment slot="sidebarLeft">
		<!-- Insert the list: -->
		<nav class="list-nav">
			<ul>
				<li><a href="/">Home</a></li>
				<li><a href="/turbotown">Turbo Town</a></li>
				<li><a href="/herostats">Hero Stats</a></li>
			</ul>
		</nav>
		<!-- --- -->
	</svelte:fragment>

	<!-- Page Route Content -->
	<slot />
</AppShell>
