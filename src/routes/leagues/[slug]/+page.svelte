<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { Prisma } from '@prisma/client';
	import { toaster } from '$lib/toaster';
	import dayjs from 'dayjs';
	import { today, getLocalTimeZone } from '@internationalized/date';

	import type { PageData } from './$types';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte';
	import Lock from '$lib/assets/lock.png';
	import DarkRiftLeaderboard from './seasons/[slug]/DarkRiftLeaderboard.svelte';

	let { data, form }: { data: PageData; form: any } = $props();

	// Skeleton Toast: use shared toaster from $lib/toaster (same instance as Toast.Group)
	function showToast(message: string, background?: string) {
		const opts = { title: message };
		if (background?.includes('success')) toaster.success(opts);
		else if (background?.includes('error')) toaster.error(opts);
		else if (background?.includes('warning')) toaster.warning(opts);
		else toaster.info(opts);
	}
	type TableSource = {
		head: string[];
		body: any[][];
		meta?: any[][];
	};
	const tableKeys = ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active'] as const;
	function tableMapperValues(arr: any[], keys: string[]): any[][] {
		return arr.map((item) => keys.map((key) => item[key]));
	}

	type LeagueWithSeasonsAndMembers = Prisma.LeagueGetPayload<{
		include: {
			members: { include: { user: true } };
			creator: true;
			seasons: { include: { members: true } };
		};
	}>;
	type LeagueMemberRow = LeagueWithSeasonsAndMembers['members'][number] & {
		display_name?: string | null;
		avatar_url?: string | null;
	};

	let selectedLeague = $derived(data.selectedLeague) as LeagueWithSeasonsAndMembers | null;

	let seasonTableData = $state<{ id: number; name: string; type: string; startDate: string; endDate: string; membersCount: number; active: boolean }[]>([]);

	$effect(() => {
		const league = data.selectedLeague as LeagueWithSeasonsAndMembers | undefined;
		if (league?.seasons) {
			seasonTableData = league.seasons.map((season: any) => ({
				id: season.id,
				name: season.name,
				type: season.type,
				startDate: dayjs(season.startDate).format('MM/DD/YYYY'),
				endDate: dayjs(season.endDate).format('MM/DD/YYYY'),
				membersCount: season.members.length,
				active: season.active
			}));
		}
	});

	let tableSource = $derived<TableSource>({
		head: ['Name', 'ID', 'Type', 'Start', 'End', 'Members', 'Status', 'Actions'],
		body: tableMapperValues(seasonTableData, [...tableKeys]),
		meta: tableMapperValues(seasonTableData, [...tableKeys])
	});

	$effect(() => {
		if (form?.missing) {
			showToast('Enter at least one valid Dota User ID', 'preset-filled-error-500');
		} else if (form?.addMembersSuccess) {
			showToast('Members added to league', 'preset-filled-success-500');
			invalidate(`/leagues/${data.selectedLeague?.id}`);
			invalidate('app:leagues');
		} else if (form?.removeMemberSuccess) {
			showToast('Member removed from league', 'preset-filled-success-500');
			invalidate(`/leagues/${data.selectedLeague?.id}`);
			invalidate('app:leagues');
		} else if (form?.success) {
			showToast('Season created!', 'preset-filled-success-500');
			invalidate('app:leagues');
		}
	});

	let friendsString = $state('');
	let userSearchQuery = $state('');
	let testToastCount = $state(0);

	let memberAccountIds = $derived(new Set(((data.selectedLeague as LeagueWithSeasonsAndMembers | undefined)?.members ?? []).map((m: any) => m.account_id)));
	let usersNotInLeague = $derived((data.allUsers ?? []).filter((u: { account_id: number | null }) => u.account_id != null && !memberAccountIds.has(u.account_id)));
	let filteredUsersToAdd = $derived(
		userSearchQuery.trim()
			? usersNotInLeague.filter((u: { username: string }) => u.username.toLowerCase().includes(userSearchQuery.toLowerCase()))
			: usersNotInLeague
	);

	const start = today(getLocalTimeZone());
	const end = start.add({ days: 7 });
	let value = $state<{ start: typeof start; end: typeof end }>({ start, end });

	let leagueMemberIDs = $derived((selectedLeague as LeagueWithSeasonsAndMembers | null)?.members?.map((member: any) => member.account_id) ?? []);

	async function handleSeasonStatusUpdate(seasonId: number, active: boolean) {
		try {
			const response = await fetch(`/api/seasons/${seasonId}/status`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ active })
			});

			if (response.ok) {
				seasonTableData = seasonTableData.map((season) =>
					season.id === seasonId ? { ...season, active } : season
				);
				// Refresh the data (tableSource is $derived from seasonTableData)
				if (selectedLeague) await invalidate(`/leagues/${selectedLeague.id}`);

				showToast('Season status updated', 'preset-filled-success-500');
			}
		} catch (error) {
			showToast('Failed to update season status', 'preset-filled-error-500');
		}
	}

	async function handleDeleteSeason(season: { id: number, name: string }) {
		const confirmed = confirm(`Are you sure you want to delete ${season.name}? This cannot be undone.`);
		if (!confirmed || !selectedLeague) return;

		const response = await fetch(`/api/leagues/${selectedLeague.id}/seasons/${season.id}`, {
			method: 'DELETE'
		});

		const result = await response.json();
		if (result.success) {
			seasonTableData = seasonTableData.filter((s) => s.id !== season.id);
			if (selectedLeague) await invalidate(`/leagues/${selectedLeague.id}`);

			showToast('Season deleted successfully', 'preset-filled-success-500');
		} else {
			showToast('Failed to delete season', 'preset-filled-error-500');
		}
	}

	// Form enhancement function for season create
	const enhanceForm = ({ form }: any) => {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				await Promise.all([
					invalidate(`/leagues/${data.selectedLeague?.id}`),
					invalidate('app:leagues'),
					update()
				]);
				form.reset();
			}
		};
	};

	// Form enhancement for add/remove member actions
	const enhanceMemberForm = () => {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				await Promise.all([
					invalidate(`/leagues/${data.selectedLeague?.id}`),
					invalidate('app:leagues'),
					update()
				]);
			}
		};
	};

	let refreshingMatches = $state(false);
	async function refreshAllMatches() {
		if (!selectedLeague || refreshingMatches) return;
		refreshingMatches = true;
		try {
			const res = await fetch(`/api/leagues/${selectedLeague.id}/refresh-matches`, { method: 'POST' });
			const result = await res.json();
			if (res.ok && result.ok) {
				showToast(`Refreshed matches for ${result.updated}/${result.total} members.`, 'preset-filled-success-500');
				// Re-run all load functions for this page so memberMatchCounts refetches from DB
				await invalidateAll();
			} else {
				showToast(result?.error ?? 'Failed to refresh matches', 'preset-filled-error-500');
			}
		} catch (e) {
			showToast('Failed to refresh matches', 'preset-filled-error-500');
		} finally {
			refreshingMatches = false;
		}
	}

	// Admin check helper
	let isAdmin = $derived(data.user?.roles?.includes('dev') ?? false);

	// Collapsible section state (start collapsed so leaderboard is focus)
	let membersExpanded = $state(false);
	let seasonsExpanded = $state(false);

	// Member sub-tab state (preserved from original)
	let membersSubTab = $state('members');
	const subTriggerClass = (value: string) =>
		`px-4 py-2.5 text-sm font-medium transition-colors ${membersSubTab === value ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-gray-400 hover:text-gray-300'}`;
</script>

<div class="min-h-full relative">
	<div class="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-8">

		{#if selectedLeague}

			<!-- ───────────────────────── 1. Active Season Banner ───────────────────────── -->
			<section class="rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm p-5">
				{#if data.activeDarkRiftSeason}
					<div class="flex flex-wrap items-center justify-between gap-4">
						<div class="flex items-center gap-4 min-w-0">
							<div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
								<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div class="min-w-0">
								<h2 class="text-lg font-bold text-gray-100 truncate">{data.activeDarkRiftSeason.name}</h2>
								<p class="text-sm text-gray-400">
									{dayjs(data.activeDarkRiftSeason.startDate).format('MMM D, YYYY')} &ndash; {dayjs(data.activeDarkRiftSeason.endDate).format('MMM D, YYYY')}
								</p>
							</div>
						</div>
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
							Active
						</span>
					</div>
				{:else}
					<div class="flex items-center gap-4 py-2">
						<div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/80 border border-gray-700 shrink-0">
							<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<div>
							<p class="text-gray-400 font-medium">No active Dark Rift season</p>
							<p class="text-sm text-gray-500">Create a new season in the Seasons section below.</p>
						</div>
					</div>
				{/if}
			</section>

			<!-- ───────────────────────── 2. Dark Rift Leaderboard ───────────────────────── -->
			<DarkRiftLeaderboard leaderboard={data.darkRiftLeaderboard ?? []} />

			<!-- ───────────────────────── 3. Members Section (ADMIN-LOCKED) ───────────────────────── -->
			<section class="relative rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
				{#if !isAdmin}
					<div class="absolute inset-0 z-50 bg-gray-900/90 flex items-center justify-center rounded-xl">
						<div class="text-center p-8 rounded-xl bg-gray-800/80 border border-emerald-500/20">
							<img src={Lock} class="h-20 w-20 mx-auto mb-4 opacity-60" alt="" />
							<p class="text-gray-300 font-medium">Admin access required</p>
						</div>
					</div>
				{/if}

				<!-- Disclosure header -->
				<button
					type="button"
					class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/30 transition-colors"
					onclick={() => (membersExpanded = !membersExpanded)}
				>
					<div class="flex items-center gap-3">
						<svg
							class="w-4 h-4 text-gray-400 transition-transform {membersExpanded ? 'rotate-90' : ''}"
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
						<h2 class="text-lg font-bold text-gray-100">Members</h2>
						<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
							{selectedLeague.members.length}
						</span>
					</div>
				</button>

				{#if membersExpanded}
					<div class="border-t border-emerald-500/10 p-6 space-y-6" transition:fade={{ duration: 150 }}>
						<!-- Header actions -->
						<div class="flex flex-wrap items-center justify-between gap-4">
							<h3 class="text-base font-semibold text-gray-200">Manage members</h3>
							<div class="flex flex-wrap items-center gap-2">
								{#if isAdmin}
									<button
										type="button"
										class="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
										onclick={() => { testToastCount += 1; toaster.info({ title: `Test toast ${testToastCount}` }); }}
										title="Fire a test toast (for testing stacking)"
									>
										Test toast
									</button>
								{/if}
								{#if isAdmin && selectedLeague?.members?.length}
									<button
										type="button"
										class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
										disabled={refreshingMatches}
										onclick={refreshAllMatches}
										title="Fetch latest matches from OpenDota for all league members"
									>
										{#if refreshingMatches}
											<span class="inline-flex items-center gap-1.5">
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Refreshing...
											</span>
										{:else}
											Refresh all matches
										{/if}
									</button>
								{/if}
							</div>
						</div>

						<!-- Member sub-tabs -->
						<Tabs value={membersSubTab} onValueChange={(d) => (membersSubTab = d.value)}>
							<nav class="border-b border-gray-800 mb-6" aria-label="Member management">
								<Tabs.List class="relative flex flex-wrap gap-0">
									<Tabs.Trigger value="members" class={subTriggerClass('members')}>
										Current members
									</Tabs.Trigger>
									<Tabs.Trigger value="add-friends" class={subTriggerClass('add-friends')}>
										Add by ID
									</Tabs.Trigger>
									<Tabs.Trigger value="pick-database" class={subTriggerClass('pick-database')}>
										From database
									</Tabs.Trigger>
									<Tabs.Indicator />
								</Tabs.List>
							</nav>

							<Tabs.Content value="members" class="focus:outline-none w-full">
								<div class="flex w-full flex-wrap">
									<div class="w-full rounded-lg overflow-hidden border border-gray-800">
										<table class="w-full">
											<thead class="bg-gray-800/50">
												<tr>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">User</th>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">Last Turbo</th>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">Last Ranked</th>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">Turbo (30d)</th>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">Ranked (30d)</th>
													<th class="font-semibold text-gray-300 py-2.5 px-4 text-left">Actions</th>
												</tr>
											</thead>
											<tbody class="divide-y divide-gray-800">
												{#each selectedLeague.members as friend}
													{@const member = friend as LeagueMemberRow}
													<tr class="items-center hover:bg-gray-800/50 transition-colors">
														<td class="py-2.5 px-4">
															<div class="flex items-center gap-2">
																{#if member?.user?.avatar_url ?? member?.avatar_url}
																	<img class="rounded-full h-8 w-8 shrink-0" src={member?.user?.avatar_url ?? member?.avatar_url} alt="" />
																{:else}
																	<div class="rounded-full h-8 w-8 shrink-0 bg-gray-700 flex items-center justify-center">
																		<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
																			<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
																		</svg>
																	</div>
																{/if}
																<span class="text-gray-200">{member?.user?.username ?? member?.display_name ?? member.account_id}</span>
															</div>
														</td>
														<td class="py-2.5 px-4 text-gray-400">{member.newestMatch ? dayjs(member.newestMatch).format('MM/DD/YYYY') : '—'}</td>
														<td class="py-2.5 px-4 text-gray-400">{data.memberLastRanked?.[member.account_id] ? dayjs(data.memberLastRanked[member.account_id]).format('MM/DD/YYYY') : '—'}</td>
														<td class="py-2.5 px-4 text-gray-400">{data.memberMatchCounts?.[member.account_id]?.turbo ?? 0}</td>
														<td class="py-2.5 px-4 text-gray-400">{data.memberMatchCounts?.[member.account_id]?.ranked ?? 0}</td>
														<td class="py-2.5 px-4">
															<form method="POST" action="?/removeLeagueMember" use:enhance={enhanceMemberForm}>
																<input type="hidden" name="account_id" value={member.account_id} />
																<button
																	type="submit"
																	class="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
																	title="Remove from league"
																	aria-label="Remove {member?.user?.username ?? member?.display_name ?? member.account_id} from league"
																>
																	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
																	</svg>
																</button>
															</form>
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							</Tabs.Content>

							<Tabs.Content value="add-friends" class="focus:outline-none">
								<form method="POST" action="?/addLeagueMembers" use:enhance={enhanceMemberForm} class="flex flex-col space-y-4 max-w-md">
									<p class="text-sm text-gray-400">Add members by Dota account ID. Enter one or more IDs, comma-separated.</p>
									<label class="block">
										<span class="font-medium text-gray-300 text-sm">Account IDs</span>
										<textarea
											class="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
											name="account_ids"
											rows="4"
											placeholder="e.g. 65110965, 423076846"
											bind:value={friendsString}
										></textarea>
									</label>
									{#if form?.missing}
										<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm" transition:fade|local={{ duration: 200 }}>
											Enter at least one valid Dota User ID
										</div>
									{/if}
									<button type="submit" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors w-fit">
										Add to league
									</button>
								</form>
							</Tabs.Content>

							<Tabs.Content value="pick-database" class="focus:outline-none">
								<div class="space-y-4 max-w-2xl">
									<p class="text-sm text-gray-400">Add any user from the app database to this league.</p>
									<label class="block">
										<span class="font-medium text-gray-300 text-sm">Search users</span>
										<input
											type="search"
											class="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
											placeholder="Filter by username..."
											bind:value={userSearchQuery}
											aria-label="Search users to add"
										/>
									</label>
									<div class="max-h-80 overflow-y-auto rounded-lg border border-gray-800 divide-y divide-gray-800">
										{#if filteredUsersToAdd.length === 0}
											<div class="p-6 text-center text-gray-500 text-sm">
												{userSearchQuery.trim() ? 'No users match your search.' : 'All database users are already in this league.'}
											</div>
										{:else}
											{#each filteredUsersToAdd as user}
												<div class="flex items-center justify-between gap-4 p-3 hover:bg-gray-800/50 transition-colors">
													<div class="flex items-center gap-3 min-w-0">
														{#if user.avatar_url}
															<img class="rounded-full h-10 w-10 shrink-0" src={user.avatar_url} alt="" />
														{:else}
															<div class="rounded-full h-10 w-10 shrink-0 bg-gray-700 flex items-center justify-center">
																<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
																	<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
																</svg>
															</div>
														{/if}
														<span class="font-medium text-gray-200 truncate">{user.username}</span>
														<span class="text-sm text-gray-500 shrink-0">ID: {user.account_id}</span>
													</div>
													<form method="POST" action="?/addLeagueMembers" use:enhance={enhanceMemberForm} class="shrink-0">
														<input type="hidden" name="account_ids" value={user.account_id} />
														<button type="submit" class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
															Add to league
														</button>
													</form>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							</Tabs.Content>
						</Tabs>
					</div>
				{/if}
			</section>

			<!-- ───────────────────────── 4. Seasons Section (ADMIN-LOCKED) ───────────────────────── -->
			<section class="relative rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
				{#if !isAdmin}
					<div class="absolute inset-0 z-50 bg-gray-900/90 flex items-center justify-center rounded-xl">
						<div class="text-center p-8 rounded-xl bg-gray-800/80 border border-emerald-500/20">
							<img src={Lock} class="h-20 w-20 mx-auto mb-4 opacity-60" alt="" />
							<p class="text-gray-300 font-medium">Admin access required</p>
						</div>
					</div>
				{/if}

				<!-- Disclosure header -->
				<button
					type="button"
					class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/30 transition-colors"
					onclick={() => (seasonsExpanded = !seasonsExpanded)}
				>
					<div class="flex items-center gap-3">
						<svg
							class="w-4 h-4 text-gray-400 transition-transform {seasonsExpanded ? 'rotate-90' : ''}"
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
						<h2 class="text-lg font-bold text-gray-100">Seasons</h2>
						<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
							{seasonTableData.length}
						</span>
					</div>
				</button>

				{#if seasonsExpanded}
					<div class="border-t border-emerald-500/10 p-6 space-y-8" transition:fade={{ duration: 150 }}>
						<!-- Existing seasons table -->
						{#if seasonTableData.length > 0}
							<div>
								<h3 class="text-base font-semibold text-gray-200 mb-4">All seasons</h3>
								<div class="rounded-lg overflow-hidden border border-gray-800">
									<table class="w-full">
										<thead class="bg-gray-800/50">
											<tr>
												{#each tableSource.head as header}
													<th class="font-semibold text-gray-300 py-3 px-4 text-left text-sm">{header}</th>
												{/each}
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-800">
											{#each tableSource.body as row}
												<tr class="hover:bg-gray-800/50 transition-colors">
													<td class="py-3 px-4">
														<a href={`/leagues/${selectedLeague.id}/seasons/${row[1]}`} class="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">{row[0]}</a>
													</td>
													<td class="py-3 px-4 text-gray-500 text-sm">{row[1]}</td>
													<td class="py-3 px-4">
														<span class="inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">{row[2]}</span>
													</td>
													<td class="py-3 px-4 text-gray-400">{row[3]}</td>
													<td class="py-3 px-4 text-gray-400">{row[4]}</td>
													<td class="py-3 px-4 text-gray-400">{row[5]}</td>
													<td class="py-3 px-4">
														{#if row[6]}
															<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
																<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
																Active
															</span>
															<button
																class="ml-2 px-2 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
																onclick={() => handleSeasonStatusUpdate(parseInt(row[1]), false)}
															>Deactivate</button>
														{:else}
															<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-400">Inactive</span>
															<button
																class="ml-2 px-2 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
																onclick={() => handleSeasonStatusUpdate(parseInt(row[1]), true)}
															>Activate</button>
														{/if}
													</td>
													<td class="py-3 px-4">
														<button
															class="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
															onclick={() => handleDeleteSeason({ id: parseInt(row[1]), name: row[0] })}
															aria-label="Delete season {row[0]}"
															title="Delete season"
														>
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else}
							<div class="rounded-xl border border-dashed border-emerald-500/30 p-8 text-center">
								<p class="text-gray-400 mb-1">No seasons yet.</p>
								<p class="text-sm text-gray-500">Create your first season below.</p>
							</div>
						{/if}

						<!-- Create season form -->
						<div>
							<h3 class="text-base font-semibold text-gray-200 mb-4">Create a season</h3>
							<form method="POST" action="?/createSeason" use:enhance={enhanceForm} class="space-y-6 max-w-xl">
								<input type="hidden" name="leagueID" value={selectedLeague.id} />
								<input type="hidden" name="leagueName" value={selectedLeague.name} />
								<input type="hidden" name="creatorID" value={data.user?.account_id ?? ''} />
								<input type="hidden" name="members" value={leagueMemberIDs.join(',')} />

								<label class="block" for="seasonType">
									<span class="font-medium text-gray-300 text-sm">Season type</span>
									<select
										id="seasonType"
										class="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-200 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
										name="seasonType"
										required
									>
										<option value="darkrift">Dark Rift</option>
										<option value="dotadeck">Dotadeck</option>
										<option value="random">Random Romp</option>
										<option value="snake" disabled>Snake Draft Survival</option>
										<option value="none" disabled>More season types coming soon</option>
									</select>
								</label>

								<div id="seasonDateRange" class="space-y-3">
									<span class="font-medium text-gray-300 text-sm block">Season date range</span>
									<input type="hidden" name="seasonStartDate" value={value.start?.toString() ?? ''} required />
									<input type="hidden" name="seasonEndDate" value={value.end?.toString() ?? ''} required />
									{#if value.start && value.end}
										<p class="text-sm text-gray-400">
											{dayjs(value.start.toString()).format('MMM D, YYYY')} &ndash; {dayjs(value.end.toString()).format('MMM D, YYYY')}
										</p>
									{/if}
									<RangeCalendar bind:value class="border border-gray-700 rounded-lg" numberOfMonths={2} />
								</div>

								<button type="submit" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
									Create season
								</button>
							</form>
						</div>
					</div>
				{/if}
			</section>

		{:else}
			<div class="rounded-xl border border-dashed border-emerald-500/30 p-12 text-center">
				<p class="text-gray-400">League not found.</p>
			</div>
		{/if}

	</div>
</div>
