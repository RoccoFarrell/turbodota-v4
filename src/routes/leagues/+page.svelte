<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import dayjs from 'dayjs';
	import { toaster } from '$lib/toaster';

	import type { PageData } from './$types';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	import Lock from '$lib/assets/lock.png';

	let { data, form }: { data: PageData; form: any } = $props();

	// Toast: use shared toaster from $lib/toaster (same instance as Toast.Group)
	function showToast(message: string, background?: string) {
		const opts = { title: message };
		if (background?.includes('success')) toaster.success(opts);
		else if (background?.includes('error')) toaster.error(opts);
		else if (background?.includes('warning')) toaster.warning(opts);
		else toaster.info(opts);
	}

	// React to form responses
	$effect(() => {
		if (form?.missing) {
			showToast('Enter at least one valid Dota User ID', 'preset-filled-error-500');
		} else if (form?.success) {
			showToast('Record created!', 'preset-filled-success-500');
		}
	});

	// Table helpers
	type TableSource = {
		head: string[];
		body: any[][];
		meta?: any[][];
	};

	function tableMapperValues(arr: any[], keys: string[]): any[][] {
		return arr.map((item) => keys.map((key) => item[key]));
	}

	let leagueTableData = $derived(
		data.leagues.map((league: any) => ({
			id: league.id,
			name: league.name,
			creatorID: league.creator.username,
			lastUpdated: dayjs(league.lastUpdated).format('MM/DD/YYYY'),
			membersCount: league.members.length
		}))
	);

	let tableSource = $derived<TableSource>({
		head: ['Name', 'ID', 'Creator', 'Last Updated', 'Members'],
		body: tableMapperValues(leagueTableData, ['name', 'id', 'creatorID', 'lastUpdated', 'membersCount']),
		meta: tableMapperValues(leagueTableData, ['name', 'id', 'creatorID', 'lastUpdated', 'membersCount'])
	});

	let friendsString = $state('');

	const handleAddCommonFriend = (account_id: number) => {
		if (!friendsString.includes(account_id.toString())) {
			friendsString += `${account_id},`;
		}
	};

	let isAdmin = $derived(data.user?.roles?.includes('dev') ?? false);
</script>

<div class="min-h-screen relative">
	<!-- Emerald glow background -->
	<div class="fixed inset-0 -z-10 bg-gray-950">
		<div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"></div>
	</div>

	<div class="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
		<!-- Header -->
		<div class="text-center space-y-2">
			<h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-emerald-200 to-emerald-400">
				Leagues
			</h1>
			<p class="text-gray-400 text-sm">Manage your Dark Rift leagues and competitions</p>
		</div>

		<!-- Existing Leagues Table -->
		<section class="rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
			<header class="px-6 py-4 border-b border-emerald-500/10">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-bold text-gray-100">Existing Leagues</h2>
					{#if leagueTableData.length > 0}
						<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
							{leagueTableData.length}
						</span>
					{/if}
				</div>
			</header>

			{#if leagueTableData.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="bg-gray-800/50 text-left">
								{#each tableSource.head as header}
									<th class="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{header}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each tableSource.body as row}
								<tr class="hover:bg-gray-800/50 transition-colors">
									<td class="py-3 px-4">
										<a href={`/leagues/${row[1]}`} class="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
											{row[0]}
										</a>
									</td>
									<td class="py-3 px-4 text-gray-500 text-sm">{row[1]}</td>
									<td class="py-3 px-4 text-gray-300">{row[2]}</td>
									<td class="py-3 px-4 text-gray-400">{row[3]}</td>
									<td class="py-3 px-4 text-gray-400">{row[4]}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center">
					<div class="rounded-xl border border-dashed border-emerald-500/30 p-8 max-w-md mx-auto">
						<p class="text-gray-400 font-medium mb-1">No leagues found</p>
						<p class="text-sm text-gray-500">Create your first league below to get started.</p>
					</div>
				</div>
			{/if}
		</section>

		<!-- Create League Form -->
		<section class="relative rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
			{#if !isAdmin}
				<div class="absolute inset-0 z-50 bg-gray-900/90 flex items-center justify-center rounded-xl">
					<div class="text-center p-8 rounded-xl bg-gray-800/80 border border-emerald-500/20">
						<img src={Lock} class="h-20 w-20 mx-auto mb-4 opacity-60" alt="" />
						<p class="text-gray-300 font-medium">Admin access required</p>
						<p class="text-sm text-gray-500 mt-1">Contact an admin to create a league.</p>
					</div>
				</div>
			{/if}

			<header class="px-6 py-4 border-b border-emerald-500/10">
				<h2 class="text-lg font-bold text-gray-100">Create a new League</h2>
			</header>

			<div class="p-6 space-y-6">
				<form method="POST" class="space-y-8" action="?/createLeague" use:enhance>
					<!-- League Name -->
					<div class="flex flex-col sm:flex-row sm:items-center gap-3">
						<label for="leagueName" class="text-emerald-400 font-semibold text-sm whitespace-nowrap">League Name</label>
						<input
							type="text"
							id="leagueName"
							name="leagueName"
							placeholder="Turbotown Enjoyers"
							required
							class="flex-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
						/>
					</div>

					<!-- Add Friends Tabs -->
					<div class="space-y-3">
						<h4 class="text-emerald-400 font-semibold text-sm">Add friends</h4>

						<Tabs value="friends">
							<Tabs.List>
								<Tabs.Trigger value="friends">
									<i class="fi fi-rr-following mr-1"></i>
									Friends
								</Tabs.Trigger>
								<Tabs.Trigger value="search">
									<i class="fi fi-rr-search-heart mr-1"></i>
									Search
								</Tabs.Trigger>
								<Tabs.Indicator />
							</Tabs.List>

							<Tabs.Content value="friends">
									<div class="my-2 space-y-2">
										<div class="text-gray-400 text-sm">Most played with friends</div>
										<div class="flex w-full flex-wrap gap-2">
											{#if data.common.commonCombined}
												{#each data.common.commonCombined as friend}
													<div class="flex flex-col rounded-xl border border-emerald-500/20 bg-gray-800/60 xl:w-[calc(33%-0.5rem)] md:w-[calc(50%-0.5rem)] max-md:w-full overflow-hidden hover:border-emerald-500/40 transition-colors">
														<div class="grid grid-cols-4 w-full min-h-[50px]">
															{#if friend.avatar_url}
																<div class="col-span-1 flex items-center w-full">
																	<img class="rounded-l-xl h-full w-full object-cover" src={friend.avatar_url} alt="friend" />
																</div>
															{:else}
																<div class="col-span-1 flex justify-center items-center w-full bg-gray-700/50">
																	<i class="scale-150 fi fi-rr-portrait text-gray-400"></i>
																</div>
															{/if}

															<div class="col-span-2 flex items-center px-3">
																{#if friend.username}
																	<span class="text-sm font-medium text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
																		{friend.username}
																	</span>
																{:else}
																	<span class="text-sm font-medium text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
																		{friend}
																	</span>
																{/if}
															</div>

															<div class="col-span-1 flex items-center justify-center">
																<button
																	class="w-full h-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
																	disabled={friendsString.includes(
																		friend.account_id ? friend.account_id : friend
																	)}
																	onclick={() =>
																		handleAddCommonFriend(friend.account_id ? friend.account_id : friend)}
																	aria-label="Add {friend.username ?? friend.account_id ?? 'friend'}"
																><i class="fi fi-br-add"></i></button>
															</div>
														</div>
													</div>
												{/each}
											{/if}
										</div>
									</div>
							</Tabs.Content>
							<Tabs.Content value="search">
								<div class="w-full italic text-gray-500 py-4">Coming soon!</div>
							</Tabs.Content>
						</Tabs>
					</div>

					<!-- Comma-separated IDs -->
					<label class="block space-y-2">
						<span class="font-medium text-gray-300 text-sm">Enter a comma separated list of your friend's Dota Account IDs:</span>
						<textarea
							class="w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
							id="dotaUsersList"
							name="dotaUsersList"
							rows="4"
							required
							placeholder="100001, 20002, 30003, 40004, etc..."
							bind:value={friendsString}
						></textarea>
					</label>

					{#if form?.missing}
						<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm" transition:fade|local={{ duration: 200 }}>
							<span class="font-semibold">Enter at least one valid Dota User ID.</span>
							<span class="text-red-400/80"> Total length of valid Dota User IDs was 0.</span>
						</div>
					{/if}

					<div class="w-full flex justify-center">
						<button type="submit" class="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors w-1/2">
							Create League
						</button>
					</div>
				</form>
			</div>
		</section>
	</div>
</div>
