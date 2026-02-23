<script lang="ts">
	import type { PageData } from './$types';
	import steam_logo from '$lib/assets/steam_logo.png';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	const features = [
		{
			icon: 'fi fi-br-dumbbell-fitness',
			title: 'Hero Training',
			desc: 'Train your heroes across 7 specialized barracks to unlock devastating stats.'
		},
		{
			icon: 'fi fi-br-pickaxe',
			title: 'Scavenging',
			desc: 'Dispatch hero parties to harvest gold, wood, and rare resources.'
		},
		{
			icon: 'fi fi-br-flame',
			title: 'Dark Rift Runs',
			desc: 'Brave progressively harder expeditions through the rift for prestige rewards.'
		},
		{
			icon: 'fi fi-br-globe',
			title: 'Atlas',
			desc: 'Explore hidden realms and uncover unique rewards across the map.'
		},
		{
			icon: 'fi fi-br-diploma',
			title: 'Talents & Upgrades',
			desc: 'Invest in permanent upgrades that reshape your gameplay.'
		},
		{
			icon: 'fi fi-rr-scroll',
			title: 'Quests',
			desc: 'Complete objectives to earn gold, items, and unlock new capabilities.'
		},
		{
			icon: 'fi fi-rr-briefcase',
			title: 'Bank & Inventory',
			desc: 'Safeguard wealth and manage rare items for maximum efficiency.'
		},
		{
			icon: 'fi fi-br-users-alt',
			title: 'Hero Synergies',
			desc: 'Combine heroes to unlock synergy bonuses and amplify power.'
		}
	];
</script>

<div class="relative min-h-screen overflow-hidden bg-gray-950">
	<!-- Background glow effects -->
	<div
		class="pointer-events-none absolute inset-0 overflow-hidden"
	>
		<div
			class="absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-red-900/20 blur-3xl"
		></div>
		<div
			class="absolute bottom-0 left-1/4 h-64 w-[400px] rounded-full bg-amber-900/15 blur-3xl"
		></div>
		<div
			class="absolute top-1/3 right-0 h-80 w-[300px] rounded-full bg-red-800/10 blur-3xl"
		></div>
	</div>

	<!-- Content -->
	<div class="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
		<!-- Badge -->
		<div class="flex justify-center">
			<span
				class="inline-flex items-center rounded-full border border-red-800/50 bg-red-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-400"
			>
				The Dark Rift
			</span>
		</div>

		<!-- Heading -->
		<h1
			class="mt-6 text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
		>
			<span class="bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent">
				The Dark Rift Awaits
			</span>
		</h1>

		<!-- Conditional auth section -->
		<div class="mt-10 flex flex-col items-center">
			{#if data.isAuthenticated}
				<!-- Logged in but no Dota account linked -->
				<p class="max-w-lg text-center text-lg text-gray-400">
					You're signed in, but you need to <strong class="text-gray-200">link a Dota 2 account</strong> before
					entering the Dark Rift. Head to your profile to connect your Steam account.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row">
					<a
						href="/profile"
						class="inline-flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-900/30 px-6 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-900/50 hover:border-amber-600/60"
					>
						<i class="fi fi-rr-user"></i>
						Go to Profile
					</a>
					<a
						href="/api/auth/steam"
						class="inline-flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-700/50 hover:border-gray-600/60"
					>
						<img class="h-4 w-4" alt="Steam" src={steam_logo} />
						Link Steam Account
					</a>
				</div>
			{:else}
				<!-- Not logged in at all -->
				<p class="max-w-lg text-center text-lg text-gray-400">
					<strong class="text-gray-200">Sign in and link your Dota 2 account</strong> to enter the
					Dark Rift. Your real match history powers your heroes in an idle RPG where every game you play matters.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row">
					<a
						href="/api/auth/google"
						data-sveltekit-preload-data="off"
						class="inline-flex items-center gap-3 rounded-lg border border-blue-700/50 bg-blue-900/30 px-6 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-900/50 hover:border-blue-600/60"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Sign in with Google
					</a>
					<a
						href="/api/auth/steam"
						class="inline-flex items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-700/50 hover:border-gray-600/60"
					>
						<img class="h-4 w-4" alt="Steam" src={steam_logo} />
						Sign in with Steam
					</a>
				</div>
			{/if}
		</div>

		<!-- Divider -->
		<div class="my-16 flex items-center gap-4">
			<div class="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
		</div>

		<!-- What Awaits Inside -->
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-200 sm:text-3xl">What Awaits Inside</h2>
			<p class="mt-2 text-gray-500">
				Your Dota 2 heroes become the foundation of an ever-growing idle empire.
			</p>
		</div>

		<!-- Feature cards grid -->
		<div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each features as feature}
				<div
					class="group rounded-xl border border-gray-800/80 bg-gray-900/60 p-5 transition hover:border-red-800/40 hover:bg-gray-900/80"
				>
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/50 text-red-400 transition group-hover:bg-red-900/40"
					>
						<i class="{feature.icon} text-lg"></i>
					</div>
					<h3 class="text-sm font-semibold text-gray-200">{feature.title}</h3>
					<p class="mt-1 text-xs leading-relaxed text-gray-500">{feature.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
