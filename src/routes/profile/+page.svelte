<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import essenceIcon from '$lib/assets/essence.png';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	const showWelcome = $derived($page.url.searchParams.get('welcome') === 'true');
	const linkedSteam = $derived($page.url.searchParams.get('linked') === 'steam');

	let editingUsername = $state(false);
	let usernameInput = $state(data.user.username);

	let editingAccountId = $state(false);
	let accountIdInput = $state(data.user.account_id?.toString() ?? '');

	$effect(() => {
		usernameInput = data.user.username;
	});

	$effect(() => {
		accountIdInput = data.user.account_id?.toString() ?? '';
	});

	function formatNum(n: number | null): string {
		if (n === null) return '—';
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
		return n.toString();
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
		--gold: rgb(212 152 44);
		--gold-dim: rgb(140 98 28);
		--gold-glow: rgb(212 152 44 / 0.18);
		--card-bg: rgb(10 7 5);
		--card-border: rgb(46 30 16 / 0.9);
		--text-warm: rgb(226 210 188);
		--text-muted: rgb(120 100 80);
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
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: 0.5rem;
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
		background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
	}

	.hero-sprite-wrap :global(.d2mh) {
		transform: scale(1.5);
		image-rendering: pixelated;
	}
</style>

<div
	class="profile-root min-h-full p-6 flex flex-col gap-4 max-w-[1100px] mx-auto text-(--text-warm)"
	style="background: radial-gradient(ellipse 80% 50% at 30% -10%, rgb(50 20 10 / 0.4), transparent), linear-gradient(180deg, rgb(10 7 5) 0%, rgb(8 6 4) 100%)"
>

	<!-- Welcome / Success banners -->
	{#if showWelcome}
		<div class="reveal reveal-1 py-3 px-4 rounded-lg text-sm bg-[rgb(5_46_22/0.5)] border border-[rgb(34_197_94/0.3)] text-green-300">
			Welcome to TurboDota! Link your Steam account or enter your Dota 2 account ID to unlock match tracking.
		</div>
	{/if}
	{#if linkedSteam}
		<div class="reveal reveal-1 py-3 px-4 rounded-lg text-sm bg-[rgb(5_46_22/0.5)] border border-[rgb(34_197_94/0.3)] text-green-300">
			Steam account linked successfully!
		</div>
	{/if}

	<!-- ── HEADER ─────────────────────────────────────── -->
	<div class="panel reveal reveal-1">
		<div class="flex items-start gap-5 p-6 flex-wrap">
			<div class="relative shrink-0">
				{#if data.user.avatar_url}
					<img
						src={data.user.avatar_url}
						alt="avatar"
						class="w-20 h-20 rounded-full border-2 border-(--gold-dim) shadow-[0_0_18px_var(--gold-glow)] block"
					/>
				{:else}
					<div class="w-20 h-20 rounded-full border-2 border-(--gold-dim) shadow-[0_0_18px_var(--gold-glow)] bg-[rgb(30_18_8)] flex items-center justify-center text-3xl font-extrabold text-(--gold)">
						{data.user.username.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="absolute bottom-[3px] right-[3px] w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgb(34_197_94/0.7)] border-2 border-(--card-bg)"></div>
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
							class="bg-[rgb(20_12_6)] border border-(--gold-dim) text-(--text-warm) rounded-md px-3 py-[0.4rem] text-base [font-family:inherit] outline-none transition-[border-color] duration-150 w-64 max-w-full focus:border-(--gold) focus:shadow-[0_0_0_2px_var(--gold-glow)]"
							type="text"
							name="username"
							bind:value={usernameInput}
							minlength="3"
							maxlength="30"
							autocomplete="off"
						/>
						<button type="submit" class="bg-(--gold) text-[rgb(10_6_2)] rounded-md px-3.5 py-[0.4rem] text-sm font-bold cursor-pointer transition-opacity duration-150 [font-family:inherit] hover:opacity-85">
							Save
						</button>
						<button
							type="button"
							class="bg-[rgb(30_15_8)] border border-(--card-border) text-(--text-muted) rounded-md px-3 py-[0.4rem] text-sm cursor-pointer [font-family:inherit] hover:text-(--text-warm)"
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
						<span class="text-3xl font-extrabold text-(--text-warm) tracking-[-0.01em] leading-[1.1]">
							{data.user.username}
						</span>
						<button
							class="bg-[rgb(40_24_10/0.8)] border border-(--gold-dim) text-(--gold) rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 hover:bg-(--gold-glow) hover:border-(--gold)"
							onclick={() => (editingUsername = true)}
						>
							<i class="fi fi-rr-pencil text-xs leading-none"></i>
							Edit
						</button>
					</div>
				{/if}

				<div class="flex items-center gap-3 mt-2 flex-wrap">
					{#if data.user.steam_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgb(5_46_22/0.8)] border border-[rgb(34_197_94/0.4)] text-green-300">
							<i class="fi fi-br-check text-xs leading-none"></i>
							Steam
						</span>
					{/if}
					{#if data.user.google_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgb(8_20_46/0.8)] border border-[rgb(59_130_246/0.4)] text-blue-300">
							<i class="fi fi-br-check text-xs leading-none"></i>
							Google
						</span>
					{/if}
					{#if data.user.account_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgb(20_10_5)] border border-[rgb(80_50_20/0.5)] text-[rgb(180_150_90)]">
							ID: {data.user.account_id}
							<button
								class="ml-0.5 text-[rgb(180_150_90)] hover:text-(--gold) cursor-pointer transition-colors duration-150"
								onclick={() => { editingAccountId = true; document.querySelector('#linked-accounts')?.scrollIntoView({ behavior: 'smooth' }); }}
							>
								<i class="fi fi-rr-pencil text-[10px] leading-none"></i>
							</button>
						</span>
					{/if}
					{#if !data.user.steam_id && !data.user.google_id}
						<span class="inline-flex items-center gap-1.5 py-[0.2rem] px-2.5 rounded-full text-xs font-bold tracking-[0.05em] uppercase bg-[rgb(46_26_5/0.8)] border border-[rgb(234_179_8/0.4)] text-yellow-300">
							No linked accounts
						</span>
					{/if}
				</div>

				{#if data.user.email}
					<p class="text-sm text-(--text-muted) mt-1">{data.user.email}</p>
				{/if}
				<p class="text-sm text-(--text-muted) mt-1">
					Member since {new Date(data.user.createdDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
				</p>
			</div>
		</div>
	</div>

	<!-- ── MATCH STATS ───────────────────────────────── -->
	{#if data.matchStats}
		<div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1 reveal reveal-2">
			<!-- Battle Record -->
			<div class="panel p-5">
				<div class="text-xs font-extrabold tracking-[0.14em] uppercase text-(--text-muted) pb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-(--card-border) after:to-transparent">
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
					<span class="text-lg font-extrabold text-(--gold)">{data.matchStats.kdaRatio.toFixed(2)}</span>
				</div>

				<div class="mb-2.5">
					<div class="flex justify-between text-sm text-(--text-muted) mb-1">
						<span>Win Rate</span>
						<span class="text-sm font-bold text-(--text-warm)">{data.matchStats.winRate}%</span>
					</div>
					<div class="h-[5px] rounded-[3px] bg-[rgb(30_15_8)] overflow-hidden flex">
						<div
							class="bg-linear-to-r from-green-500 to-green-700 rounded-l-[3px]"
							style="width: {data.matchStats.winRate}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
						></div>
						<div class="bg-[rgb(60_20_20)] flex-1"></div>
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
				<div class="text-xs font-extrabold tracking-[0.14em] uppercase text-(--text-muted) pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-(--card-border) after:to-transparent">
					Performance
				</div>
				<div class="flex flex-col gap-4 mt-2">
					<div class="flex flex-col gap-1">
						<span class="text-xs uppercase tracking-widest text-(--text-muted)">Avg Net Worth</span>
						<span class="text-3xl font-extrabold text-(--gold) leading-none tabular-nums">{formatNum(data.matchStats.avgNetWorth)}</span>
						{#if data.matchStats.detailCount > 0}
							<span class="text-xs text-(--text-muted)">over {data.matchStats.detailCount} detailed matches</span>
						{/if}
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs uppercase tracking-widest text-(--text-muted)">Avg Hero Damage</span>
						<span class="text-3xl font-extrabold text-(--gold) leading-none tabular-nums">{formatNum(data.matchStats.avgHeroDamage)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Top Heroes -->
		{#if data.matchStats.topHeroes.length > 0}
			<div class="panel reveal reveal-3">
				<div class="text-xs font-extrabold tracking-[0.14em] uppercase text-(--text-muted) px-5 pt-4 pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-(--card-border) after:to-transparent">
					Signature Heroes
				</div>
				<div class="px-5 pb-5">
					<div class="flex gap-3.5 flex-wrap">
						{#each data.matchStats.topHeroes as hero, i}
							<div class="group flex flex-col items-center gap-1.5 cursor-default">
								<div class="hero-sprite-wrap w-12 h-12 rounded-md border border-(--card-border) bg-[rgb(20_12_6)] flex items-center justify-center overflow-hidden transition-[border-color,box-shadow] duration-150 group-hover:border-(--gold-dim) group-hover:shadow-[0_0_10px_var(--gold-glow)]">
									<div class="d2mh hero-{hero.heroId}"></div>
								</div>
								<span class="text-xs text-(--text-muted) text-center max-w-[56px] overflow-hidden text-ellipsis whitespace-nowrap">{hero.name}</span>
								<span class="text-xs text-(--gold-dim) font-bold">{hero.games}g</span>
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
					<a href="/api/auth/steam/link" class="text-(--gold) underline">Link your Steam account</a> or set your account ID below to enable match tracking, KDA stats, and win rates.
				</p>
			</div>
		</div>
	{/if}

	<!-- ── INCREMENTAL SAVES ──────────────────────────── -->
	<div class="panel reveal reveal-4">
		<div class="text-xs font-extrabold tracking-[0.14em] uppercase text-(--text-muted) px-5 pt-4 pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-(--card-border) after:to-transparent">
			Incremental Game · Active Saves
		</div>
		<div class="px-5 pb-5">
			{#if data.saves.length > 0}
				<div class="flex gap-3.5 flex-wrap">
					{#each data.saves as save}
						<div class="flex-[1_1_260px] max-w-[340px] bg-[rgb(12_8_4)] border border-(--card-border) rounded-lg p-4 relative overflow-hidden transition-[border-color] duration-200 hover:border-(--gold-dim) before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-linear-to-r before:from-transparent before:via-(--gold-dim) before:to-transparent">
							<div class="text-sm font-bold text-(--text-warm) mb-2.5">
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

							<div class="flex justify-between text-sm text-(--text-muted) border-t border-(--card-border) pt-2.5 mt-1">
								<span>
									<strong class="text-(--text-warm)">{save.rosterCount}</strong> heroes ·
									<strong class="text-(--text-warm)">{save.lineupCount}</strong> lineups
								</span>
								<a href="/incremental" class="text-(--gold) no-underline font-semibold hover:underline">Open →</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-6 text-center text-(--text-muted) text-sm">
					No saves yet. <a href="/incremental" class="text-(--gold)">Start your idle RPG adventure →</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- ── ACCOUNT LINKS ──────────────────────────────── -->
	<div id="linked-accounts" class="panel reveal reveal-5">
		<div class="text-xs font-extrabold tracking-[0.14em] uppercase text-(--text-muted) px-5 pt-4 pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-(--card-border) after:to-transparent">
			Linked Accounts
		</div>
		<div class="flex gap-3.5 flex-wrap px-5 pb-5">
			<!-- Steam -->
			<div class="flex-[1_1_200px] bg-[rgb(14_9_5)] border border-(--card-border) rounded-lg px-4 py-3.5 flex items-center gap-3">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.steam_id ? 'bg-[rgb(5_46_22/0.6)] text-green-300' : 'bg-[rgb(30_18_8/0.6)] text-(--text-muted)'}">
					<i class="fi fi-brands-steam leading-none"></i>
				</div>
				<div>
					<div class="text-sm font-semibold text-(--text-warm)">Steam</div>
					{#if data.user.steam_id}
						<div class="text-sm text-(--text-muted)">Connected · {data.user.username}</div>
					{:else}
						<div class="text-sm text-(--text-muted)">
							Not linked · <a href="/api/auth/steam/link" class="text-(--gold)">Link now</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Google -->
			<div class="flex-[1_1_200px] bg-[rgb(14_9_5)] border border-(--card-border) rounded-lg px-4 py-3.5 flex items-center gap-3">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.google_id ? 'bg-[rgb(5_46_22/0.6)] text-green-300' : 'bg-[rgb(30_18_8/0.6)] text-(--text-muted)'}">
					<i class="fi fi-brands-google leading-none"></i>
				</div>
				<div>
					<div class="text-sm font-semibold text-(--text-warm)">Google</div>
					{#if data.user.google_id}
						<div class="text-sm text-(--text-muted)">{data.user.email ?? 'Connected'}</div>
					{:else}
						<div class="text-sm text-(--text-muted)">Not linked</div>
					{/if}
				</div>
			</div>

			<!-- Dota Account ID -->
			<div class="flex-[1_1_200px] bg-[rgb(14_9_5)] border border-(--card-border) rounded-lg px-4 py-3.5 flex flex-col items-start gap-2.5">
				<div class="flex items-center gap-3 w-full">
					<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm {data.user.account_id ? 'bg-[rgb(5_46_22/0.6)] text-green-300' : 'bg-[rgb(30_18_8/0.6)] text-(--text-muted)'}">
						<i class="fi fi-rr-gamepad leading-none"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-semibold text-(--text-warm)">Dota 2 Account ID</div>
						{#if data.user.account_id && !editingAccountId}
							<div class="text-sm text-(--text-muted)">{data.user.account_id}</div>
						{/if}
					</div>
					{#if data.user.account_id && !editingAccountId}
						<button
							class="bg-[rgb(40_24_10/0.8)] border border-(--gold-dim) text-(--gold) rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 hover:bg-(--gold-glow) hover:border-(--gold)"
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
							class="flex-1 bg-[rgb(20_12_6)] border border-(--card-border) text-(--text-warm) rounded-md px-2.5 py-1.5 text-sm [font-family:inherit] outline-none min-w-0"
						/>
						<button type="submit" class="bg-(--gold) text-[rgb(10_6_2)] rounded-md px-3 py-[0.35rem] text-sm font-bold cursor-pointer [font-family:inherit] hover:opacity-85">
							Save
						</button>
						{#if editingAccountId}
							<button
								type="button"
								class="bg-[rgb(30_15_8)] border border-(--card-border) text-(--text-muted) rounded-md px-3 py-[0.35rem] text-sm cursor-pointer [font-family:inherit] hover:text-(--text-warm)"
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
