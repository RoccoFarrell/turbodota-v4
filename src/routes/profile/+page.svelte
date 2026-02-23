<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import essenceIcon from '$lib/assets/essence.png';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	// Onboarding overlay state
	const welcomeParam = $derived($page.url.searchParams.get('welcome') === 'true');
	let onboardingDismissed = $state(false);
	const showOnboarding = $derived(welcomeParam && !data.user.account_id && !onboardingDismissed);
	let onboardingStep = $state<'choice' | 'manual'>('choice');

	const linkedSteam = $derived($page.url.searchParams.get('linked') === 'steam');

	let editingUsername = $state(false);
	let usernameInput = $state(data.user.username);
	let editingAccountId = $state(false);
	let accountIdInput = $state(data.user.account_id?.toString() ?? '');
	let onboardingAccountIdInput = $state('');

	$effect(() => {
		usernameInput = data.user.username;
	});
	$effect(() => {
		accountIdInput = data.user.account_id?.toString() ?? '';
	});

	function dismissOnboarding() {
		onboardingDismissed = true;
		onboardingStep = 'choice';
		cleanWelcomeParam();
	}

	function cleanWelcomeParam() {
		const url = new URL(window.location.href);
		url.searchParams.delete('welcome');
		history.replaceState({}, '', url.toString());
	}

	function formatNum(n: number | null): string {
		if (n === null) return '\u2014';
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
		return n.toString();
	}

	const currencyConfig: Record<string, { label: string; icon: string; color: string; imageUrl?: string }> = {
		essence: { label: 'Essence', icon: '', color: '', imageUrl: essenceIcon },
		gold: { label: 'Gold', icon: 'fi fi-rr-coin', color: 'text-amber-400' },
		loot_coins: { label: 'Loot', icon: 'fi fi-rr-treasure-chest', color: 'text-violet-400' },
		wood: { label: 'Wood', icon: 'fi fi-rr-tree', color: 'text-emerald-400' }
	};

	const currencyOrder = ['essence', 'gold', 'loot_coins', 'wood'];
</script>

<svelte:head>
	<title>Profile | TurboDota</title>
</svelte:head>

<style>
	.profile-root {
		--violet: rgb(139, 92, 246);
		--violet-dim: rgb(88, 28, 135);
		--violet-glow: rgba(139, 92, 246, 0.18);
		--violet-border: rgba(139, 92, 246, 0.15);
		--panel-bg: rgba(15, 10, 30, 0.5);
		--text-primary: rgb(209, 213, 219);
		--text-muted: rgb(156, 163, 175);
	}

	.reveal {
		animation: fadeUp 0.4s ease both;
	}
	.reveal-1 { animation-delay: 0.04s; }
	.reveal-2 { animation-delay: 0.1s; }
	.reveal-3 { animation-delay: 0.18s; }
	.reveal-4 { animation-delay: 0.26s; }
	.reveal-5 { animation-delay: 0.34s; }

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(10px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.panel {
		background: var(--panel-bg);
		border: 1px solid var(--violet-border);
		border-radius: 0.75rem;
		position: relative;
		overflow: hidden;
	}
	.panel::before {
		content: '';
		position: absolute;
		top: 0;
		left: 10%;
		right: 10%;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.section-label::after {
		content: '';
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, var(--violet-border), transparent);
	}

	.hero-sprite-wrap :global(.d2mh) {
		transform: scale(1.5);
		image-rendering: pixelated;
	}
</style>

<div
	class="profile-root min-h-full p-6 flex flex-col gap-4 max-w-[1100px] mx-auto text-(--text-primary)"
	style="background: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(88, 28, 135, 0.05) 0%, transparent 40%), #030712"
>

	<!-- Success banners -->
	{#if linkedSteam}
		<div class="reveal reveal-1 py-3 px-4 rounded-lg text-sm bg-[rgba(5,46,22,0.5)] border border-[rgba(34,197,94,0.3)] text-green-300">
			Steam account linked successfully! Your Dota 2 Account ID is now verified and locked.
		</div>
	{/if}

	<!-- ── IDENTITY HEADER ──────────────────────────────── -->
	<div class="panel reveal reveal-1">
		<div class="flex flex-col sm:flex-row items-stretch">
			<!-- Left: Avatar + Username + Member since -->
			<div class="flex items-start gap-5 p-6 flex-1 min-w-0">
				<div class="relative shrink-0">
					{#if data.user.avatar_url}
						<img
							src={data.user.avatar_url}
							alt="avatar"
							class="w-20 h-20 rounded-full border-2 border-violet-800 shadow-[0_0_18px_var(--violet-glow)] block"
						/>
					{:else}
						<div class="w-20 h-20 rounded-full border-2 border-violet-800 shadow-[0_0_18px_var(--violet-glow)] bg-[rgba(30,15,50,0.8)] flex items-center justify-center text-3xl font-extrabold text-violet-400">
							{data.user.username.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="absolute bottom-[3px] right-[3px] w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] border-2 border-[#030712]"></div>
				</div>

				<div class="flex-1 min-w-0">
					{#if editingUsername}
						<form
							method="POST"
							action="?/updateUsername"
							class="flex items-center gap-2 flex-wrap mt-1"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') editingUsername = false;
								};
							}}
						>
							<input
								class="bg-[rgba(15,10,30,0.8)] border border-violet-800 text-(--text-primary) rounded-md px-3 py-[0.4rem] text-base [font-family:inherit] outline-none transition-[border-color] duration-150 w-64 max-w-full focus:border-violet-500 focus:shadow-[0_0_0_2px_var(--violet-glow)]"
								type="text"
								name="username"
								bind:value={usernameInput}
								minlength="3"
								maxlength="30"
								autocomplete="off"
							/>
							<button type="submit" class="bg-violet-500 text-white rounded-md px-3.5 py-[0.4rem] text-sm font-bold cursor-pointer transition-opacity duration-150 [font-family:inherit] hover:opacity-85">
								Save
							</button>
							<button
								type="button"
								class="bg-[rgba(15,10,30,0.6)] border border-(--violet-border) text-(--text-muted) rounded-md px-3 py-[0.4rem] text-sm cursor-pointer [font-family:inherit] hover:text-(--text-primary)"
								onclick={() => { editingUsername = false; usernameInput = data.user.username; }}
							>
								Cancel
							</button>
						</form>
						{#if form && 'updateUsername' in form && form.updateUsername && 'error' in form.updateUsername}
							<p class="text-sm text-red-300 mt-1">
								{form.updateUsername.error}
							</p>
						{/if}
					{:else}
						<div class="flex items-center gap-3 flex-wrap">
							<span class="text-3xl font-extrabold text-(--text-primary) tracking-[-0.01em] leading-[1.1]">
								{data.user.username}
							</span>
							<button
								class="bg-[rgba(139,92,246,0.1)] border border-violet-800 text-violet-400 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 hover:bg-(--violet-glow) hover:border-violet-500"
								onclick={() => (editingUsername = true)}
							>
								<i class="fi fi-rr-pencil text-xs leading-none"></i>
								Edit
							</button>
						</div>
					{/if}

					<p class="text-sm text-(--text-muted) mt-2">
						Member since {new Date(data.user.createdDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</p>
				</div>
			</div>

			<!-- Vertical divider (hidden on mobile, visible sm+) -->
			<div class="hidden sm:block w-px bg-[rgba(139,92,246,0.2)] self-stretch my-4"></div>
			<!-- Horizontal divider on mobile -->
			<div class="sm:hidden h-px bg-[rgba(139,92,246,0.2)] mx-6"></div>

			<!-- Right: Account ID + Auth Badges -->
			<div class="flex flex-col justify-center p-6 sm:min-w-[280px]">
				{#if data.user.account_id}
					<div class="flex items-center gap-3">
						<span class="text-3xl font-black tabular-nums font-mono text-(--text-primary) tracking-wider leading-none">
							{data.user.account_id}
						</span>
						{#if data.isAccountLocked}
							<span title="Verified via Steam — cannot be changed" class="text-emerald-400 cursor-help">
								<i class="fi fi-sr-lock text-base leading-none"></i>
							</span>
						{:else}
							<button
								title="Manually linked — click to edit"
								class="text-amber-400 hover:text-amber-300 cursor-pointer transition-colors duration-150"
								onclick={() => { editingAccountId = true; document.querySelector('#linked-accounts')?.scrollIntoView({ behavior: 'smooth' }); }}
							>
								<i class="fi fi-rr-pencil text-sm leading-none"></i>
							</button>
						{/if}
					</div>
					<span class="text-xs text-(--text-muted) mt-1 uppercase tracking-widest">Dota 2 Account ID</span>
				{:else}
					<span class="text-sm text-(--text-muted)">No account linked</span>
					<a
						href="/api/auth/steam/link"
						class="mt-2 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors duration-150 w-fit"
					>
						Link now
					</a>
				{/if}

				<!-- Auth badges -->
				<div class="flex items-center gap-2.5 mt-3 flex-wrap">
					{#if data.user.steam_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgba(5,46,22,0.8)] border border-[rgba(34,197,94,0.4)] text-green-300">
							<i class="fi fi-br-check text-xs leading-none"></i>
							Steam
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgba(15,10,30,0.6)] border border-(--violet-border) text-(--text-muted)">
							Steam
						</span>
					{/if}
					{#if data.user.google_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgba(8,20,46,0.8)] border border-[rgba(59,130,246,0.4)] text-blue-300">
							<i class="fi fi-br-check text-xs leading-none"></i>
							Google
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgba(15,10,30,0.6)] border border-(--violet-border) text-(--text-muted)">
							Google
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- ── MATCH STATS ───────────────────────────────── -->
	{#if data.matchStats}
		<div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1 reveal reveal-2">
			<!-- Battle Record -->
			<div class="panel p-5">
				<div class="section-label">
					Battle Record
				</div>

				<div class="flex items-baseline gap-1 mt-2 mb-3">
					<span class="text-4xl font-black leading-none tabular-nums text-green-300">{data.matchStats.totalKills}</span>
					<span class="text-2xl text-(--text-muted) mx-[0.1rem] font-light">/</span>
					<span class="text-4xl font-black leading-none tabular-nums text-red-300">{data.matchStats.totalDeaths}</span>
					<span class="text-2xl text-(--text-muted) mx-[0.1rem] font-light">/</span>
					<span class="text-4xl font-black leading-none tabular-nums text-blue-300">{data.matchStats.totalAssists}</span>
				</div>

				<div class="flex items-center gap-2 mb-3">
					<span class="text-xs uppercase tracking-widest text-(--text-muted)">KDA Ratio</span>
					<span class="text-lg font-extrabold text-violet-400">{data.matchStats.kdaRatio.toFixed(2)}</span>
				</div>

				<div class="mb-2.5">
					<div class="flex justify-between text-sm text-(--text-muted) mb-1">
						<span>Win Rate</span>
						<span class="text-sm font-bold text-(--text-primary)">{data.matchStats.winRate}%</span>
					</div>
					<div class="h-[5px] rounded-[3px] bg-[rgba(17,12,35,0.8)] overflow-hidden flex">
						<div
							class="bg-linear-to-r from-violet-600 to-purple-400 rounded-l-[3px]"
							style="width: {data.matchStats.winRate}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
						></div>
						<div class="bg-gray-800/50 flex-1"></div>
					</div>
				</div>

				<div class="flex gap-4 text-sm mt-2">
					<span class="text-(--text-muted)">{data.matchStats.totalGames} games</span>
					<strong class="text-green-300">{data.matchStats.wins}W</strong>
					<strong class="text-red-300">{data.matchStats.losses}L</strong>
				</div>
			</div>

			<!-- Performance -->
			<div class="panel p-5">
				<div class="section-label">
					Performance
				</div>
				<div class="flex flex-col gap-4 mt-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs uppercase tracking-widest text-(--text-muted)">Avg Net Worth</span>
						<span class="text-3xl font-extrabold text-violet-400 leading-none tabular-nums">{formatNum(data.matchStats.avgNetWorth)}</span>
						{#if data.matchStats.detailCount > 0}
							<span class="text-xs text-(--text-muted)">over {data.matchStats.detailCount} detailed matches</span>
						{/if}
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs uppercase tracking-widest text-(--text-muted)">Avg Hero Damage</span>
						<span class="text-3xl font-extrabold text-violet-400 leading-none tabular-nums">{formatNum(data.matchStats.avgHeroDamage)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Signature Heroes -->
		{#if data.matchStats.topHeroes.length > 0}
			<div class="panel reveal reveal-3">
				<div class="section-label px-5 pt-4">
					Signature Heroes
				</div>
				<div class="px-5 pb-5">
					<div class="flex gap-3.5 flex-wrap">
						{#each data.matchStats.topHeroes as hero, i}
							<div class="group flex flex-col items-center gap-1.5 cursor-default">
								<div class="hero-sprite-wrap w-12 h-12 rounded-md border border-(--violet-border) bg-[rgba(15,10,30,0.6)] flex items-center justify-center overflow-hidden transition-[border-color,box-shadow] duration-150 group-hover:border-violet-600 group-hover:shadow-[0_0_10px_var(--violet-glow)]">
									<div class="d2mh hero-{hero.heroId}"></div>
								</div>
								<span class="text-xs text-(--text-muted) text-center max-w-[56px] overflow-hidden text-ellipsis whitespace-nowrap">{hero.name}</span>
								<span class="text-xs text-violet-400 font-bold">{hero.games}g</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{:else if data.user.account_id}
		<div class="panel reveal reveal-2">
			<div class="py-8 px-5 text-center text-(--text-muted) text-sm">
				No match data found for account ID {data.user.account_id}.
				Match data is synced from OpenDota when you view your stats.
			</div>
		</div>
	{:else}
		<div class="panel reveal reveal-2">
			<div class="py-8 px-5 text-center text-(--text-muted) text-sm">
				<p class="mb-2">No Dota 2 account linked.</p>
				<p>
					<a href="/api/auth/steam/link" class="text-violet-400 underline">Link your Steam account</a> or set your account ID below to enable match tracking, KDA stats, and win rates.
				</p>
			</div>
		</div>
	{/if}

	<!-- ── DARK RIFT SAVES ──────────────────────────────── -->
	<div class="panel reveal reveal-4">
		<div class="section-label px-5 pt-4">
			Dark Rift Saves
		</div>
		<div class="px-5 pb-5">
			{#if data.saves.length > 0}
				<div class="flex gap-3.5 flex-wrap">
					{#each data.saves as save}
						<div class="flex-[1_1_260px] max-w-[340px] bg-[rgba(15,10,30,0.6)] border border-(--violet-border) rounded-lg p-4 relative overflow-hidden transition-[border-color] duration-200 hover:border-violet-600 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-linear-to-r before:from-transparent before:via-violet-700 before:to-transparent">
							<div class="text-sm font-bold text-(--text-primary) mb-2.5">
								{save.name ?? 'Save Slot'}
								{#if save.account_id}
									<span class="font-normal text-sm text-(--text-muted)"> · #{save.account_id}</span>
								{/if}
							</div>

							<div class="flex gap-3 flex-wrap mb-3">
								{#each currencyOrder as key}
									{#if (save.currencies[key] ?? 0) > 0}
										{@const cfg = currencyConfig[key] ?? { label: key, icon: 'fi fi-rr-coin', color: 'text-amber-400' }}
										<div class="flex items-center gap-[0.3rem] text-sm">
											{#if cfg.imageUrl}
												<img src={cfg.imageUrl} alt={cfg.label} class="w-3.5 h-3.5 object-contain" />
											{:else}
												<i class="{cfg.icon} {cfg.color} text-sm leading-none"></i>
											{/if}
											<span class="text-(--text-muted) tabular-nums">{formatNum(save.currencies[key])}</span>
										</div>
									{/if}
								{/each}
								{#if Object.values(save.currencies).every(v => v === 0)}
									<span class="text-sm text-(--text-muted)">No currency yet</span>
								{/if}
							</div>

							<div class="flex justify-between text-sm text-(--text-muted) border-t border-(--violet-border) pt-2.5 mt-1">
								<span>
									<strong class="text-(--text-primary)">{save.rosterCount}</strong> heroes ·
									<strong class="text-(--text-primary)">{save.lineupCount}</strong> lineups
								</span>
								<a href="/darkrift" class="text-violet-400 no-underline font-semibold hover:underline">Open &rarr;</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-6 text-center text-(--text-muted) text-sm">
					No saves yet. <a href="/darkrift" class="text-violet-400">Start your idle RPG adventure &rarr;</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- ── LINKED ACCOUNTS ──────────────────────────────── -->
	<div id="linked-accounts" class="panel reveal reveal-5">
		<div class="section-label px-5 pt-4">
			Linked Accounts
		</div>
		<div class="flex gap-3.5 flex-wrap px-5 pb-5">
			<!-- Steam -->
			<div class="flex-[1_1_200px] bg-[rgba(15,10,30,0.6)] border border-(--violet-border) rounded-lg px-4 py-3.5 flex items-center gap-3">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.steam_id ? 'bg-[rgba(5,46,22,0.6)] text-green-300' : 'bg-[rgba(15,10,30,0.6)] text-(--text-muted)'}">
					<i class="fi fi-brands-steam leading-none"></i>
				</div>
				<div>
					<div class="text-sm font-semibold text-(--text-primary)">Steam</div>
					{#if data.user.steam_id}
						<div class="text-sm text-(--text-muted)">Connected · {data.user.username}</div>
					{:else}
						<div class="text-sm text-(--text-muted)">
							Not linked · <a href="/api/auth/steam/link" class="text-violet-400">Link now</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Google -->
			<div class="flex-[1_1_200px] bg-[rgba(15,10,30,0.6)] border border-(--violet-border) rounded-lg px-4 py-3.5 flex items-center gap-3">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.google_id ? 'bg-[rgba(5,46,22,0.6)] text-green-300' : 'bg-[rgba(15,10,30,0.6)] text-(--text-muted)'}">
					<i class="fi fi-brands-google leading-none"></i>
				</div>
				<div>
					<div class="text-sm font-semibold text-(--text-primary)">Google</div>
					{#if data.user.google_id}
						<div class="text-sm text-(--text-muted)">{data.user.email ?? 'Connected'}</div>
					{:else}
						<div class="text-sm text-(--text-muted)">Not linked</div>
					{/if}
				</div>
			</div>

			<!-- Dota Account ID -->
			<div class="flex-[1_1_200px] bg-[rgba(15,10,30,0.6)] border border-(--violet-border) rounded-lg px-4 py-3.5 flex flex-col items-start gap-2.5">
				<div class="flex items-center gap-3 w-full">
					<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.account_id ? 'bg-[rgba(5,46,22,0.6)] text-green-300' : 'bg-[rgba(15,10,30,0.6)] text-(--text-muted)'}">
						<i class="fi fi-rr-gamepad leading-none"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-semibold text-(--text-primary)">Dota 2 Account ID</div>
						{#if data.user.account_id && !editingAccountId}
							<div class="text-sm text-(--text-muted)">{data.user.account_id}</div>
							{#if data.isAccountLocked}
								<div class="text-xs text-emerald-400 mt-0.5">Verified via Steam — this ID cannot be changed</div>
							{:else}
								<div class="text-xs text-amber-400 mt-0.5">Manually linked — you can update this anytime</div>
							{/if}
						{/if}
					</div>
					{#if data.user.account_id && !editingAccountId && !data.isAccountLocked}
						<button
							class="bg-[rgba(139,92,246,0.1)] border border-violet-800 text-violet-400 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 hover:bg-(--violet-glow) hover:border-violet-500"
							onclick={() => (editingAccountId = true)}
						>
							<i class="fi fi-rr-pencil text-xs leading-none"></i>
							Edit
						</button>
					{/if}
				</div>
				{#if !data.user.account_id || editingAccountId}
					<form
						method="POST"
						action="?/setAccountId"
						class="flex gap-2 w-full"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') editingAccountId = false;
							};
						}}
					>
						<input
							type="number"
							name="account_id"
							placeholder="e.g. 123456789"
							bind:value={accountIdInput}
							class="flex-1 bg-[rgba(15,10,30,0.8)] border border-(--violet-border) text-(--text-primary) rounded-md px-2.5 py-1.5 text-sm [font-family:inherit] outline-none min-w-0 focus:border-violet-500 focus:shadow-[0_0_0_2px_var(--violet-glow)]"
						/>
						<button type="submit" class="bg-violet-500 text-white rounded-md px-3 py-[0.35rem] text-sm font-bold cursor-pointer [font-family:inherit] hover:opacity-85">
							Save
						</button>
						{#if editingAccountId}
							<button
								type="button"
								class="bg-[rgba(15,10,30,0.6)] border border-(--violet-border) text-(--text-muted) rounded-md px-3 py-[0.35rem] text-sm cursor-pointer [font-family:inherit] hover:text-(--text-primary)"
								onclick={() => { editingAccountId = false; accountIdInput = data.user.account_id?.toString() ?? ''; }}
							>
								Cancel
							</button>
						{/if}
					</form>
					{#if form && 'setAccountId' in form && form.setAccountId && 'error' in form.setAccountId}
						<p class="text-sm text-red-300 mt-1">
							{form.setAccountId.error}
						</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>

</div>

<!-- ── ONBOARDING OVERLAY ──────────────────────────── -->
{#if showOnboarding}
	<Dialog open={showOnboarding} onOpenChange={(d) => { if (!d.open) dismissOnboarding(); }}>
		<Portal>
			<Dialog.Backdrop class="fixed inset-0 z-50 bg-[rgba(3,7,18,0.85)] backdrop-blur-sm" />
			<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
				<Dialog.Content class="w-full max-w-md rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(15,10,30,0.95)] shadow-[0_0_40px_rgba(139,92,246,0.1)] p-6 space-y-5">

					{#if onboardingStep === 'choice'}
						<!-- Step 1: Choice -->
						<div class="text-center space-y-2">
							<Dialog.Title class="text-xl font-bold text-gray-100">
								Welcome to TurboDota
							</Dialog.Title>
							<Dialog.Description class="text-sm text-gray-400">
								Link your Dota 2 account to unlock match tracking, stats, and the Dark Rift idle game.
							</Dialog.Description>
						</div>

						<div class="space-y-3">
							<!-- Steam option (recommended) -->
							<a
								href="/api/auth/steam/link"
								class="block w-full rounded-lg border border-emerald-700/50 bg-[rgba(5,46,22,0.3)] px-4 py-4 text-left transition-colors hover:border-emerald-600 hover:bg-[rgba(5,46,22,0.5)] no-underline"
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-full bg-[rgba(5,46,22,0.6)] flex items-center justify-center text-emerald-400">
										<i class="fi fi-brands-steam text-lg leading-none"></i>
									</div>
									<div>
										<div class="text-sm font-bold text-gray-100 flex items-center gap-2">
											Sign in with Steam
											<span class="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded">Recommended</span>
										</div>
										<div class="text-xs text-gray-400 mt-0.5">Verifies ownership & locks your ID permanently</div>
									</div>
								</div>
							</a>

							<!-- Manual option -->
							<button
								type="button"
								class="w-full rounded-lg border border-(--violet-border) bg-[rgba(15,10,30,0.5)] px-4 py-4 text-left transition-colors hover:border-violet-600 hover:bg-[rgba(139,92,246,0.08)] cursor-pointer"
								onclick={() => { onboardingStep = 'manual'; }}
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-full bg-[rgba(15,10,30,0.6)] flex items-center justify-center text-violet-400">
										<i class="fi fi-rr-pencil text-lg leading-none"></i>
									</div>
									<div>
										<div class="text-sm font-bold text-gray-100">Enter Account ID manually</div>
										<div class="text-xs text-gray-400 mt-0.5">Quick setup — anyone can claim any ID until verified via Steam</div>
									</div>
								</div>
							</button>
						</div>

						<!-- Skip -->
						<div class="text-center pt-1">
							<button
								type="button"
								class="text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
								onclick={() => dismissOnboarding()}
							>
								Skip for now
							</button>
						</div>

					{:else}
						<!-- Step 2: Manual entry -->
						<div class="text-center space-y-2">
							<Dialog.Title class="text-xl font-bold text-gray-100">
								Enter your Account ID
							</Dialog.Title>
							<Dialog.Description class="text-sm text-gray-400">
								Find your ID at <a href="https://www.opendota.com" target="_blank" rel="noopener" class="text-violet-400 underline">opendota.com</a> or in the Dota 2 client under Settings.
							</Dialog.Description>
						</div>

						<form
							method="POST"
							action="?/setAccountId"
							class="space-y-3"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') {
										dismissOnboarding();
									}
								};
							}}
						>
							<input
								type="number"
								name="account_id"
								placeholder="e.g. 123456789"
								bind:value={onboardingAccountIdInput}
								class="w-full bg-[rgba(15,10,30,0.8)] border border-(--violet-border) text-gray-200 rounded-lg px-4 py-3 text-sm [font-family:inherit] outline-none focus:border-violet-500 focus:shadow-[0_0_0_2px_rgba(139,92,246,0.18)]"
								required
							/>
							<button
								type="submit"
								class="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-sm font-bold cursor-pointer transition-colors duration-150"
							>
								Save Account ID
							</button>
						</form>

						{#if form && 'setAccountId' in form && form.setAccountId && 'error' in form.setAccountId}
							<div class="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-center">
								<p class="text-sm text-red-300">{form.setAccountId.error}</p>
							</div>
						{/if}

						<div class="rounded-lg bg-[rgba(139,92,246,0.06)] border border-(--violet-border) px-3 py-2.5">
							<p class="text-xs text-gray-400 leading-relaxed">
								Anyone can enter any ID. Sign in with Steam to verify ownership and lock it permanently.
							</p>
						</div>

						<button
							type="button"
							class="w-full text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors py-1"
							onclick={() => { onboardingStep = 'choice'; }}
						>
							&larr; Back
						</button>
					{/if}

				</Dialog.Content>
			</Dialog.Positioner>
		</Portal>
	</Dialog>
{/if}
