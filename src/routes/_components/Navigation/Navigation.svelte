<script lang="ts">
	import type { User } from '@prisma/client';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		session: { user: User } | null;
	}

	let { session }: Props = $props();

	const PRIVILEGED = [34940151, 65110965, 68024789, 80636612, 113003047, 423076846];
	const isPrivileged = $derived(
		!!(session?.user?.account_id != null && PRIVILEGED.includes(session.user.account_id))
	);

	let incrementalExpanded = $state($page.url.pathname.startsWith('/incremental'));

	$effect(() => {
		if ($page.url.pathname.startsWith('/incremental')) {
			incrementalExpanded = true;
		}
	});

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
		{ label: 'Dashboard', path: '/incremental', exact: true, icon: 'fi fi-br-apps' },
		{ label: 'Training', path: '/incremental/training', icon: 'fi fi-br-dumbbell-fitness' },
		{ label: 'Tavern', path: '/incremental/tavern', icon: 'fi fi-rr-beer' },
		{ label: 'Lineups', path: '/incremental/lineup', icon: 'fi fi-br-users-alt' },
		{ label: 'Map Run', path: '/incremental/run', icon: 'fi fi-br-map-marker' },
		{ label: 'Talents', path: '/incremental/talents', icon: 'fi fi-br-diploma' },
		{ label: 'Inventory', path: '/incremental/inventory', icon: 'fi fi-rr-briefcase' },
		{ label: 'Quests', path: '/incremental/quests', icon: 'fi fi-rr-scroll' },
		{ label: 'History', path: '/incremental/history', icon: 'fi fi-rr-time-past' },
		{ label: 'Atlas', path: '/incremental/atlas', icon: 'fi fi-br-globe' },
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

	<!-- ── EXPLORE ─────────────────────── -->
	<div class="section-header {sectionHeader}">Explore</div>

	<a href="/" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/', true)}>
		<i class="fi fi-br-house-chimney nav-icon text-emerald-400 w-4 text-center text-sm leading-none"></i>
		<span>Home</span>
	</a>

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

	<!-- ── DOTA 2 ──────────────────────── -->
	<div class="section-header mt-1 {sectionHeader}">Dota 2</div>

	<a href="/dotadeck" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/dotadeck')}>
		<i class="fi fi-rr-playing-cards nav-icon text-amber-400 w-4 text-center text-sm leading-none"></i>
		<span>DotaDeck</span>
	</a>

	<a href="/leagues" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/leagues')}>
		<i class="fi fi-br-users-alt nav-icon text-teal-400 w-4 text-center text-sm leading-none"></i>
		<span>Leagues</span>
	</a>

	{#if isPrivileged}
		<a href="/herostats" data-sveltekit-preload-data="tap" class={navLink} class:is-active={isActive('/herostats')}>
			<i class="fi fi-br-chart-histogram nav-icon text-amber-400 w-4 text-center text-sm leading-none"></i>
			<span>Hero Stats</span>
		</a>
	{/if}

	<!-- ── INCREMENTAL ─────────────────── -->
	<div class="section-header mt-1 {sectionHeader}">Incremental</div>

	<button
		type="button"
		class={navLink}
		class:is-active={isActive('/incremental') && !incrementalExpanded}
		onclick={() => (incrementalExpanded = !incrementalExpanded)}
	>
		<i class="fi fi-br-gamepad nav-icon text-violet-400 w-4 text-center text-sm leading-none"></i>
		<span>Idle RPG</span>
		<i
			class="fi fi-br-angle-down ml-auto text-xs opacity-35 transition-transform duration-200 ease-in-out {incrementalExpanded ? 'rotate-180' : ''}"
		></i>
	</button>

	{#if incrementalExpanded}
		<div transition:slide={{ duration: 180, easing: quintOut }}>
			{#each incrementalRoutes as route}
				<a
					href={route.path}
					data-sveltekit-preload-data="tap"
					class={navLinkSub}
					class:is-active={isActive(route.path, route.exact)}
				>
					<i class="{route.icon} nav-icon w-3 text-center text-xs leading-none text-slate-600"></i>
					<span>{route.label}</span>
				</a>
			{/each}
		</div>
	{/if}

	<!-- ── DEV ────────────────────────── -->
	{#if dev}
		<div
			class="flex items-center gap-2 py-1 px-3 opacity-25 before:content-[''] before:flex-1 before:h-px before:bg-red-950 after:content-[''] after:flex-1 after:h-px after:bg-red-950"
		>
			<span class="text-xs text-red-600 tracking-[0.2em]">✦ ✦ ✦</span>
		</div>
		<div class="section-header {sectionHeader} text-orange-400/60">Dev</div>
		<a href="/admin/login" class={navLink} class:is-active={isActive('/admin/login')}>
			<i class="fi fi-br-binary nav-icon text-sky-400 w-4 text-center text-sm leading-none"></i>
			<span>Login</span>
		</a>
		<a href="/admin/register" class={navLink} class:is-active={isActive('/admin/register')}>
			<i class="fi fi-br-binary nav-icon text-sky-400 w-4 text-center text-sm leading-none"></i>
			<span>Register</span>
		</a>
	{/if}
</nav>
