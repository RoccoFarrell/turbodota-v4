<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	const showWelcome = $derived($page.url.searchParams.get('welcome') === 'true');
	const linkedSteam = $derived($page.url.searchParams.get('linked') === 'steam');
</script>

<svelte:head>
	<title>Profile | TurboDota</title>
</svelte:head>

<div class="container mx-auto max-w-2xl p-6 md:p-8">
	<!-- Page header with avatar -->
	<div class="flex items-center gap-4 mb-8">
		{#if data.user.avatar_url}
			<img src={data.user.avatar_url} alt="Avatar" class="w-16 h-16 rounded-full ring-2 ring-primary-500/50" />
		{:else}
			<div class="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center ring-2 ring-primary-500/50">
				<span class="text-2xl text-surface-300">{data.user.username?.charAt(0).toUpperCase() ?? '?'}</span>
			</div>
		{/if}
		<div>
			<h1 class="text-3xl font-bold text-white">Profile</h1>
			<p class="text-surface-300 text-sm">Manage your account and linked services</p>
		</div>
	</div>

	{#if showWelcome}
		<div class="rounded-lg border border-success-500/30 bg-success-500/10 p-4 mb-6">
			<p class="font-bold text-success-400">Welcome to TurboDota!</p>
			<p class="text-surface-200 text-sm mt-1">To access all features, link your Steam account or enter your Dota 2 account ID below.</p>
		</div>
	{/if}

	{#if linkedSteam}
		<div class="rounded-lg border border-success-500/30 bg-success-500/10 p-4 mb-6">
			<p class="font-bold text-success-400">Steam account linked successfully!</p>
		</div>
	{/if}

	<div class="space-y-6">
		<!-- Account Information Card -->
		<section class="rounded-xl bg-surface-800 border border-surface-700 p-6">
			<h2 class="text-xl font-bold text-white mb-4">Account Information</h2>
			<dl class="space-y-3">
				<div class="flex gap-3">
					<dt class="text-surface-400 w-24 shrink-0">Username</dt>
					<dd class="text-surface-100 font-medium">{data.user.username}</dd>
				</div>
				{#if data.user.name}
					<div class="flex gap-3">
						<dt class="text-surface-400 w-24 shrink-0">Name</dt>
						<dd class="text-surface-100">{data.user.name}</dd>
					</div>
				{/if}
				{#if data.user.email}
					<div class="flex gap-3">
						<dt class="text-surface-400 w-24 shrink-0">Email</dt>
						<dd class="text-surface-100">{data.user.email}</dd>
					</div>
				{/if}
			</dl>
		</section>

		<!-- Linked Accounts Card -->
		<section class="rounded-xl bg-surface-800 border border-surface-700 p-6">
			<h2 class="text-xl font-bold text-white mb-5">Linked Accounts</h2>

			<div class="space-y-4">
				<!-- Google -->
				<div class="rounded-lg bg-surface-700/50 p-4">
					<div class="flex items-center gap-3">
						{#if data.user.google_id}
							<div class="w-8 h-8 rounded-full bg-success-500/20 flex items-center justify-center shrink-0">
								<span class="text-success-400 text-sm">&#10003;</span>
							</div>
							<div>
								<p class="text-surface-100 font-medium">Google</p>
								<p class="text-surface-400 text-sm">{data.user.email}</p>
							</div>
						{:else}
							<div class="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
								<span class="text-surface-400 text-sm">--</span>
							</div>
							<div>
								<p class="text-surface-300 font-medium">Google</p>
								<p class="text-surface-400 text-sm">Not linked</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Steam -->
				<div class="rounded-lg bg-surface-700/50 p-4">
					{#if data.user.steam_id}
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-full bg-success-500/20 flex items-center justify-center shrink-0">
								<span class="text-success-400 text-sm">&#10003;</span>
							</div>
							<div class="flex-1">
								<p class="text-surface-100 font-medium">Steam</p>
								<p class="text-surface-400 text-sm">{data.user.username}
									{#if data.user.account_id}
										<span class="text-surface-500 ml-1">(ID: {data.user.account_id})</span>
									{/if}
								</p>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-3 mb-3">
							<div class="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
								<span class="text-surface-400 text-sm">--</span>
							</div>
							<div>
								<p class="text-surface-300 font-medium">Steam</p>
								<p class="text-surface-400 text-sm">Not linked</p>
							</div>
						</div>
						<div class="ml-11 space-y-3">
							<a href="/api/auth/steam/link" class="btn preset-filled-primary-500 text-sm">
								Link Steam Account
							</a>
							<p class="text-sm text-surface-400">
								Linking Steam verifies your Dota 2 account and automatically sets your account ID.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</section>

		<!-- Dota 2 Account ID Card -->
		<section class="rounded-xl bg-surface-800 border border-surface-700 p-6">
			<h2 class="text-xl font-bold text-white mb-4">Dota 2 Account ID</h2>

			{#if data.user.account_id}
				<div class="flex items-center gap-3 flex-wrap">
					<span class="text-surface-100 text-lg font-mono">{data.user.account_id}</span>
					{#if data.user.steam_id}
						<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-success-500/20 text-success-400 border border-success-500/30">
							Verified via Steam
						</span>
					{:else}
						<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-500/20 text-warning-400 border border-warning-500/30">
							Unverified (manual)
						</span>
					{/if}
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-surface-300 text-sm">
						Your Dota 2 account ID is required to access match-based features. You can either:
					</p>
					<ul class="text-sm text-surface-300 space-y-1 ml-4">
						<li class="flex items-start gap-2">
							<span class="text-primary-400 mt-0.5">&#8226;</span>
							<span>Link your Steam account <span class="text-surface-400">(recommended)</span></span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary-400 mt-0.5">&#8226;</span>
							<span>Manually enter your account ID below</span>
						</li>
					</ul>

					<form method="POST" action="?/setAccountId" use:enhance class="space-y-3 pt-2">
						<label for="account_id" class="block">
							<span class="text-surface-200 text-sm font-medium mb-1.5 block">Dota 2 Account ID</span>
							<input
								type="number"
								name="account_id"
								id="account_id"
								class="w-full rounded-lg bg-surface-700 border border-surface-600 text-surface-100 placeholder-surface-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
								placeholder="e.g. 123456789"
								required
							/>
						</label>
						{#if form && !form.success}
							<p class="text-error-400 text-sm">{form.error}</p>
						{/if}
						{#if form?.success}
							<p class="text-success-400 text-sm">Account ID saved!</p>
						{/if}
						<button type="submit" class="btn preset-filled-primary-500 text-sm">
							Save Account ID
						</button>
					</form>

					<details class="text-sm mt-2 group">
						<summary class="cursor-pointer font-medium text-surface-300 hover:text-surface-100 transition-colors">
							How do I find my account ID?
						</summary>
						<div class="mt-3 space-y-2 text-surface-400 pl-4 border-l-2 border-surface-700">
							<p>1. Open Dota 2</p>
							<p>2. Go to Settings &rarr; Options &rarr; Advanced Options</p>
							<p>3. Enable "Expose Public Match Data"</p>
							<p>4. Your account ID will be visible in the console or on sites like OpenDota</p>
							<p>Or visit <a href="https://www.opendota.com/" target="_blank" class="text-primary-400 hover:text-primary-300 underline underline-offset-2">OpenDota.com</a> and search for your Steam profile.</p>
						</div>
					</details>
				</div>
			{/if}
		</section>
	</div>
</div>
