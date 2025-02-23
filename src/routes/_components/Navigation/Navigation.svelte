<script lang="ts">
	import type { Session } from 'lucia';
	export let session: Session | null;

	import { page } from '$app/stores';
	import { dev } from '$app/environment';

	import steam_logo from '$lib/assets/steam_logo.png';
	import TurboTownDark from '$lib/assets/turbotown_dark_noText.png'

	//console.log(session);

	//console.log($page.url.pathname);
	//console.log(session);

	interface RouteInfo {
		label: string;
		path: string;
		iconClassAndColor: string;
		sectionHeader: boolean;
		turbotown?: boolean;
	}

	let routeList: RouteInfo[] = [
		{
			label: 'Home',
			path: '/',
			iconClassAndColor: 'fi fi-br-house-chimney text-green-500',
			sectionHeader: false,
		},
		{
			label: 'Blog',
			path: '/blog',
			iconClassAndColor: 'fi fi-rr-blog-text text-pink-500',
			sectionHeader: false,
		},
		// {
		// 	label: 'Turbo Town',
		// 	path: '/turbotown',
		// 	iconClassAndColor: 'fi fi-br-house-turret text-blue-500',
		// 	sectionHeader: true,
		// 	turbotown: true,
		// },
		// {
		// 	label: 'Quests',
		// 	path: '/turbotown/quests',
		// 	iconClassAndColor: 'fi fi-rr-dice-alt text-purple-500',
		// 	sectionHeader: false,
		// },
		// {
		// 	label: 'Shop',
		// 	path: '/turbotown/shop',
		// 	iconClassAndColor: 'fi fi-rs-shopping-cart text-orange-500',
		// 	sectionHeader: false,
		// },
		{
			label: 'DotaDeck',
			path: '/dotadeck',
			iconClassAndColor: 'fi fi-rr-playing-cards text-amber-500',
			sectionHeader: false,
		},
		// {
		// 	label: 'Skills',
		// 	path: '/turbotown/skills',
		// 	iconClassAndColor: 'fi fi-rr-head-side-brain text-red-500',
		// 	sectionHeader: false,
		// },
		// {
		// 	label: 'Cards',
		// 	path: '/cards',
		// 	iconClassAndColor: 'fi fi-rr-playing-cards text-amber-500',
		// 	sectionHeader: false,
		// },
		{
			label: 'Leagues',
			path: '/leagues',
			iconClassAndColor: 'fi fi-br-users-alt text-teal-500',
			sectionHeader: true,
		}
	];
</script>

<nav class="list-nav p-6">
	<ul class="w-full">
		{#each routeList as route, i}
			{#if route.sectionHeader}
				<hr class="!border-t-4" />
				{#if route.turbotown}
					<img src={TurboTownDark} class="w-1/2 mx-auto" alt="turbotown header"/>
				{/if}
			{/if}
			<li
				class={'flex items-center justify-start rounded-full ' +
					($page.url.pathname === route.path ? 'border border-secondary-500/60' : '')}
			>
				<a href={route.path} data-sveltekit-preload-data="tap" class="w-full">
					<i class={route.iconClassAndColor} />
					<p class={$page.url.pathname === route.path ? 'font-bold' : ''}>{route.label}</p></a
				>
			</li>
		{/each}

		<!-- Town Routes -->
		{#if session && session.user && [34940151, 65110965, 68024789, 80636612, 113003047, 423076846].includes(session.user.account_id)}
			<li
				class={'flex items-center justify-start rounded-full ' +
					($page.url.pathname === '/herostats' ? 'border border-secondary-500/60' : '')}
			>
				<a href="/herostats" data-sveltekit-preload-data="tap" class="w-full"
					><i class="fi fi-br-chart-histogram dark:text-amber-400 text-amber-600"></i>
					<p class={$page.url.pathname === '/herostats' ? 'font-bold' : ''}>Hero Stats</p></a
				>
			</li>
		{/if}
		{#if dev}
			<hr class="!border-t-4" />
			<li class="text-center text-orange-500">Dev Routes</li>
			<li class="h-32 lg:h-4"></li>
			<li
				class={'flex items-center justify-start rounded-full ' +
					($page.url.pathname.includes('/admin/login') ? 'border border-secondary-500/60' : '')}
			>
				<a href="/admin/login" data-sveltekit-preload-data="tap" class="w-full flex items-center space-x-8">
					<i class="fi fi-br-binary h-4 text-sky-500" />
					<p class={$page.url.pathname === '/admin/login' ? 'font-bold' : ''}>Login</p></a
				>
			</li>
			<li
				class={'flex items-center justify-start rounded-full ' +
					($page.url.pathname.includes('/admin/register') ? 'border border-secondary-500/60' : '')}
			>
				<a href="/admin/register" data-sveltekit-preload-data="tap" class="w-full flex items-center space-x-8">
					<i class="fi fi-br-binary h-4 text-sky-500" />
					<p class={$page.url.pathname === '/admin/register' ? 'font-bold' : ''}>Register</p></a
				>
			</li>
		{/if}
		<hr class="!border-t-4" />
		<!-- Steam Login-->
		{#if !session || !session.user}
			<li>
				<a class="" href="/api/auth/steam" data-sveltekit-preload-data="tap">
					<span><img class="w-6 ml-1.5" alt="steamlogo" src={steam_logo} /></span>
					<span>Login</span>
				</a>
			</li>
		{:else}
			<form method="POST">
				<li class="flex items-center justify-start">
					<button class="btn w-full flex justify-center items-center space-x-4" formaction="/logout" type="submit">
						<i class="fi fi-br-sign-out-alt text-slate-500"></i>
						<p>Logout</p>
					</button>
				</li>
			</form>
		{/if}
	</ul>
</nav>
