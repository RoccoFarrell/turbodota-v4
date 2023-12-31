<script lang="ts">
	import type { Session } from 'lucia';
	export let session: Session;

	import { page } from '$app/stores';

	import steam_logo from '$lib/assets/steam_logo.png';

	//console.log(session);

	console.log($page.url.pathname);
	console.log(session);
</script>

<nav class="list-nav p-6">
	<ul class="w-full">
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/" data-sveltekit-preload-data="tap" class="w-full">
				<i class="fi fi-br-house-chimney text-green-500" />
				<p class={$page.url.pathname === '/' ? 'font-bold' : ''}>Home</p></a
			>
		</li>
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/random' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/random" data-sveltekit-preload-data="tap" class="w-full"
				><i class="fi fi-rr-dice-alt text-purple-500"></i>
				<p class={$page.url.pathname === '/random' ? 'font-bold' : ''}>Random Tracker</p></a
			>
		</li>
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/random/leaderboard' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/random/leaderboard" data-sveltekit-preload-data="tap" class="w-full"
				><i class="fi fi-rr-trophy-star text-red-500"></i>
				<p class={$page.url.pathname === '/random/leaderboard' ? 'font-bold' : ''}>Leaderboard</p></a
			>
		</li>
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/leagues' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/leagues" data-sveltekit-preload-data="tap" class="w-full">
				<i class="fi fi-br-users-alt text-teal-500" />
				<p class={$page.url.pathname === '/leagues' ? 'font-bold' : ''}>Leagues</p></a
			>
		</li>
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/snakedraft' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/snakedraft" data-sveltekit-preload-data="tap" class="w-full">
				<i class="fi fi-ss-snake text-orange-500" />
				<p class={$page.url.pathname === '/snakedraft' ? 'font-bold' : ''}>Snake Draft</p></a
			>
		</li>
		<li
			class={'flex items-center justify-start rounded-full ' +
				($page.url.pathname === '/turbotown' ? 'border border-secondary-500/60' : '')}
		>
			<a href="/turbotown" data-sveltekit-preload-data="tap" class="w-full">
				<i class="fi fi-br-house-turret text-blue-500" />
				<p class={$page.url.pathname === '/turbotown' ? 'font-bold' : ''}>Turbo Town</p></a
			>
		</li>

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
		<li class="h-32 lg:h-4"></li>
		<hr class="!border-t-4" />
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
