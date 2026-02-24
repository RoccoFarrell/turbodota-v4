<script lang="ts">
	import type { User } from '@prisma/client';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import SaveSeasonPicker from '$lib/incremental/components/SaveSeasonPicker.svelte';

	interface Props {
		session: { user: User } | null;
	}

	let { session }: Props = $props();

	// Saves with season info come from the darkrift layout server data
	const darkriftSaves = $derived(
		$page.url.pathname.startsWith('/darkrift') ? ($page.data?.saves ?? []) : []
	);

	const PRIVILEGED = [34940151, 65110965, 68024789, 80636612, 113003047, 423076846];
	const isPrivileged = $derived(
		!!(session?.user?.account_id != null && PRIVILEGED.includes(session.user.account_id))
	);

	let incrementalExpanded = $state(true);

	function isActive(path: string, exact = false) {
		return exact ? $page.url.pathname === path : $page.url.pathname.startsWith(path);
	}

	const navLink =
		'nav-link relative flex items-center gap-2.5 py-1.5 px-3 rounded-md border-l-2 border-l-transparent w-full cursor-pointer text-left text-base font-medium text-slate-400 no-underline transition-colors duration-150 ease-in-out hover:bg-red-950/12 hover:text-amber-200 hover:border-l-red-500/40 [&.is-active]:bg-red-950/25 [&.is-active]:text-red-300 [&.is-active]:font-semibold [&.is-active]:border-l-[rgb(var(--clr-accent))]';
	const navLinkSub =
		'nav-link sub relative flex items-center gap-2.5 py-1.5 px-3 pl-[2.125rem] rounded-md border-l-2 border-l-transparent w-full cursor-pointer text-left text-sm font-normal text-slate-500 no-underline transition-colors duration-150 ease-in-out hover:bg-red-950/12 hover:text-amber-200 hover:border-l-red-500/40 [&.is-active]:bg-red-950/25 [&.is-active]:text-red-300 [&.is-active]:font-semibold [&.is-active]:border-l-[rgb(var(--clr-accent))]';
	const sectionHeader =
		'pt-3 pr-3 pb-1 pl-3 flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] uppercase text-slate-600 before:content-["◆"] before:text-[0.45rem] before:text-[rgb(var(--clr-accent)/0.5)] after:content-[""] after:flex-1 after:h-px after:bg-linear-to-r after:from-slate-600/50 after:to-transparent';

	const incrementalRoutes = [
		{ label: 'Enter the Rift', path: '/darkrift/dungeon', icon: 'fi fi-br-flame', featured: true },
		{ label: 'Dashboard', path: '/darkrift', exact: true, icon: 'fi fi-br-apps' },
		{ label: 'Scavenging', path: '/darkrift/scavenging', icon: 'fi fi-br-pickaxe' },
		{ label: 'Barracks', path: '/darkrift/barracks', icon: 'fi fi-br-dumbbell-fitness' },
		{ label: 'Tavern', path: '/darkrift/tavern', icon: 'fi fi-rr-beer' },
		{ label: 'Lineups', path: '/darkrift/lineup', icon: 'fi fi-br-users-alt' },
		{ label: 'Quests', path: '/darkrift/quests', icon: 'fi fi-rr-scroll' },
		{ label: 'Inventory', path: '/darkrift/inventory', icon: 'fi fi-rr-briefcase' },
		{ label: 'History', path: '/darkrift/history', icon: 'fi fi-rr-time-past' },
		{ label: 'Talents', path: '/darkrift/talents', icon: 'fi fi-br-diploma' },
		{ label: 'Atlas', path: '/darkrift/atlas', icon: 'fi fi-br-globe' },
	];
</script>

<style>
	nav {
		--clr-accent: 220 38 38;
		--clr-gold: 217 119 6;
	}
	/* Active nav link icon glow uses --clr-accent; child selector not expressible as utility */
	:global(.nav-link.is-active .nav-icon) {
		filter: drop-shadow(0 0 5px rgb(var(--clr-accent) / 0.65));
	}
	/* Featured rift link active state */
	:global(.featured-rift-link.is-active) {
		border-color: rgba(220, 38, 38, 0.5);
		box-shadow: 0 0 16px rgba(220, 38, 38, 0.2), inset 0 0 12px rgba(220, 38, 38, 0.06);
	}
	:global(.featured-rift-link.is-active .nav-icon) {
		filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.8));
		color: rgb(239, 68, 68);
	}
</style>

<nav class="flex flex-col py-3 gap-0.5">

	<!-- ── USER CARD (link to profile) ───── -->
	{#if session?.user}
		<a
			href="/profile"
			class="mx-3 mb-2.5 no-underline py-2.5 px-3 rounded-lg bg-linear-to-br from-red-950/90 to-[rgb(12_12_20)]/60 border border-red-800/40 flex items-center gap-2.5 hover:border-red-800/60 transition-colors"
			aria-label="Profile"
		>
			{#if session.user.avatar_url}
				<div class="relative shrink-0">
					<img
						src={session.user.avatar_url}
						alt="avatar"
						class="block w-9 h-9 rounded-full border border-red-800/60"
					/>
					<div
						class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-[1.5px] border-[rgb(15,15,20)] shadow-[0_0_6px_rgba(34,197,94,0.7)]"
					></div>
				</div>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="text-sm font-bold truncate text-red-100">
					{session.user.username}
				</p>
				<p class="text-xs truncate text-slate-600">
					{session.user.email ?? 'Steam'}
				</p>
			</div>
		</a>
	{/if}

	<!-- ── HOME ───────────────────────── -->
	<a href="/" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/', true)}>
		<i class="fi fi-br-house-chimney nav-icon text-emerald-400 w-4 text-center text-sm leading-none"></i>
		<span>Home</span>
	</a>

	<!-- ── THE DARK RIFT ──────────────── -->
	<div class="section-header mt-1 {sectionHeader}">The Dark Rift</div>

	<button
		type="button"
		class={navLink}
		class:is-active={isActive('/darkrift') && !incrementalExpanded}
		onclick={() => (incrementalExpanded = !incrementalExpanded)}
	>
		<i class="fi fi-br-flame nav-icon text-violet-400 w-4 text-center text-sm leading-none"></i>
		<span class="bg-linear-to-r from-red-400 via-amber-300 to-red-400 bg-clip-text text-transparent font-bold">The Dark Rift</span>
		<i
			class="fi fi-br-angle-down ml-auto text-xs opacity-35 transition-transform duration-200 ease-in-out {incrementalExpanded ? 'rotate-180' : ''}"
		></i>
	</button>

	{#if incrementalExpanded}
		<div transition:slide={{ duration: 180, easing: quintOut }}>
			<SaveSeasonPicker saves={darkriftSaves} />
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
		</div>
	{/if}

	<!-- ── DOTA 2 ──────────────────────── -->
	<div class="section-header mt-1 {sectionHeader}">Dota 2</div>

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

	{#if isPrivileged}
		<a href="/herostats" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/herostats')}>
			<i class="fi fi-br-chart-histogram nav-icon text-amber-400 w-4 text-center text-sm leading-none"></i>
			<span>Hero Stats</span>
		</a>
	{/if}

	<!-- ── BOTTOM ─────────────────────── -->
	<div class="mt-auto"></div>

	<div
		class="flex items-center gap-2 py-1 px-3 opacity-25 before:content-[''] before:flex-1 before:h-px before:bg-red-950 after:content-[''] after:flex-1 after:h-px after:bg-red-950"
	>
		<span class="text-xs text-red-600 tracking-[0.2em]">✦ ✦ ✦</span>
	</div>

	<a href="/blog" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/blog')}>
		<i class="fi fi-rr-blog-text nav-icon text-pink-400 w-4 text-center text-sm leading-none"></i>
		<span>Blog</span>
	</a>

	{#if session?.user}
		<a href="/profile" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/profile')}>
			<i class="fi fi-rr-user nav-icon text-cyan-400 w-4 text-center text-sm leading-none"></i>
			<span>Profile</span>
		</a>
	{/if}
</nav>
