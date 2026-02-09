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
	let usersNotInLeague = $derived((data.allUsers ?? []).filter((u: { account_id: number }) => !memberAccountIds.has(u.account_id)));
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

	// Controlled tab state; custom classes so tab list + content layout and visibility work with our card layout.
	let mainTab = $state('overview');
	let membersSubTab = $state('members');

	const mainTriggerClass = (value: string) =>
		`px-6 py-3 font-medium transition-colors ${mainTab === value ? 'text-primary-500 font-semibold bg-primary-500/10' : 'text-surface-600 dark:text-surface-400'}`;
	const subTriggerClass = (value: string) =>
		`px-4 py-2.5 text-sm font-medium transition-colors ${membersSubTab === value ? 'text-primary-500 font-semibold bg-primary-500/10' : 'text-surface-600 dark:text-surface-400'}`;
</script>

<section class="lg:max-w-5xl w-full min-h-screen px-4 lg:mx-auto py-6 space-y-6">
	{#if selectedLeague}
	<!-- League summary card: visible context without relying only on layout header -->
	<div class="card border border-surface-200 dark:border-surface-700 p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50">
		<div class="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
			<div>
				<span class="text-surface-500 dark:text-surface-400">Commissioner</span>
				<p class="font-semibold text-primary-500">{selectedLeague.creator.username}</p>
			</div>
			<div>
				<span class="text-surface-500 dark:text-surface-400">Created</span>
				<p class="font-semibold text-surface-700 dark:text-surface-300">{dayjs(selectedLeague.createdDate).format('MMM D, YYYY')}</p>
			</div>
			<div>
				<span class="text-surface-500 dark:text-surface-400">Members</span>
				<p class="font-semibold text-surface-700 dark:text-surface-300">{selectedLeague.members.length}</p>
			</div>
		</div>
	</div>

	<div class="w-full">
		<Tabs value={mainTab} onValueChange={(d) => (mainTab = d.value)}>
			<div class="card p-0 overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
				<Tabs.List class="relative flex gap-0 min-h-12 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
					<Tabs.Trigger value="overview" class={mainTriggerClass('overview')}>
						<i class="fi fi-rr-apps mr-2" aria-hidden="true"></i>
						Overview
					</Tabs.Trigger>
					<Tabs.Trigger value="members" class={mainTriggerClass('members')}>
						<i class="fi fi-rr-users-alt mr-2" aria-hidden="true"></i>
						Members
					</Tabs.Trigger>
					<Tabs.Trigger value="seasons" class={mainTriggerClass('seasons')}>
						<i class="fi fi-rr-calendar-star mr-2" aria-hidden="true"></i>
						Seasons
					</Tabs.Trigger>
					<Tabs.Trigger value="history" class={mainTriggerClass('history')}>
						<i class="fi fi-rr-history mr-2" aria-hidden="true"></i>
						History
					</Tabs.Trigger>
					<Tabs.Indicator />
				</Tabs.List>
			</div>

			<!-- Overview: at-a-glance league info + active seasons -->
			<Tabs.Content value="overview" class="focus:outline-none">
				<div class="card mt-0 rounded-t-none border-t-0 border border-surface-200 dark:border-surface-700 p-6 space-y-6">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<h2 class="h3 text-surface-800 dark:text-surface-200">Active seasons</h2>
						<button
							type="button"
							class="btn preset-tonal-success w-fit"
							onclick={() => (mainTab = 'seasons')}
						>
							<i class="fi fi-rr-plus mr-2"></i>Create season
						</button>
					</div>
					{#if seasonTableData.length > 0}
						<div class="table-container rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
							<table class="table">
								<thead class="bg-surface-200 dark:bg-surface-700">
									<tr>
										{#each tableSource.head as header}
											<th class="font-semibold text-surface-700 dark:text-surface-300 py-3 px-4 text-left">{header}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each tableSource.body as row}
										<tr class="border-t border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800/50">
											<td>
												<a href={`/leagues/${selectedLeague.id}/seasons/${row[1]}`} class="font-semibold text-primary-500 hover:underline hover:text-primary-600">{row[0]}</a>
											</td>
											<td class="text-surface-500 dark:text-surface-400 text-sm">{row[1]}</td>
											<td><span class="chip preset-tonal-warning text-xs">{row[2]}</span></td>
											<td>{row[3]}</td>
											<td>{row[4]}</td>
											<td>{row[5]}</td>
											<td>
												{#if row[6]}
													<span class="chip preset-filled-success-500 text-xs">Active</span>
													<button
														class="btn btn-sm preset-tonal-warning ml-1"
														onclick={() => handleSeasonStatusUpdate(parseInt(row[1]), false)}
													>Deactivate</button>
												{:else}
													<span class="chip preset-filled-surface-500 text-xs">Inactive</span>
													<button
														class="btn btn-sm preset-tonal-success ml-1"
														onclick={() => handleSeasonStatusUpdate(parseInt(row[1]), true)}
													>Activate</button>
												{/if}
											</td>
											<td>
												<button
													class="btn btn-sm btn-icon preset-filled-error-500"
													onclick={() => handleDeleteSeason({ id: parseInt(row[1]), name: row[0] })}
													aria-label="Delete season {row[0]}"
													title="Delete season"
												>
													<i class="fi fi-bs-trash" aria-hidden="true"></i>
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 p-8 text-center">
							<p class="text-surface-500 dark:text-surface-400 mb-4">No seasons yet.</p>
							<button type="button" class="btn preset-tonal-success" onclick={() => (mainTab = 'seasons')}>
								<i class="fi fi-rr-plus mr-2"></i>Create first season
							</button>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<Tabs.Content value="members" class="focus:outline-none">
					<div class="card flex flex-col relative mt-0 rounded-t-none border-t-0 border border-surface-200 dark:border-surface-700">
						{#if !data.session || !data.session.user.roles || !data.session.user.roles.includes('dev')}
							<div class="z-50 absolute inset-0 bg-surface-900/90 flex items-center justify-center rounded-b-xl">
								<div class="text-center p-8 rounded-xl bg-surface-800 border border-surface-600">
									<img src={Lock} class="h-24 w-24 mx-auto mb-4 opacity-80" alt="" />
									<p class="text-surface-200 font-medium">Contact an admin to manage members.</p>
								</div>
							</div>
						{/if}

						<div class="p-6 space-y-6">
							<div class="flex flex-wrap items-center justify-between gap-4">
								<h2 class="h3 text-surface-800 dark:text-surface-200">Manage members</h2>
								<div class="flex flex-wrap items-center gap-2">
									{#if data.session?.user?.roles?.includes('dev')}
										<button
											type="button"
											class="btn preset-filled-surface-500"
											onclick={() => { testToastCount += 1; toaster.info({ title: `Test toast ${testToastCount}` }); }}
											title="Fire a test toast (for testing stacking)"
										>
											Test toast
										</button>
									{/if}
									{#if data.session?.user?.roles?.includes('dev') && selectedLeague?.members?.length}
										<button
											type="button"
											class="btn preset-tonal-primary"
											disabled={refreshingMatches}
											onclick={refreshAllMatches}
											title="Fetch latest matches from OpenDota for all league members"
										>
											{#if refreshingMatches}
												<i class="fi fi-rr-spinner animate-spin mr-2" aria-hidden="true"></i>
												Refreshing…
											{:else}
												<i class="fi fi-rr-refresh mr-2" aria-hidden="true"></i>
												Refresh all matches
											{/if}
										</button>
									{/if}
								</div>
							</div>

							<Tabs value={membersSubTab} onValueChange={(d) => (membersSubTab = d.value)}>
								<nav class="border-b border-surface-200 dark:border-surface-700 mb-6" aria-label="Member management">
									<Tabs.List class="relative flex flex-wrap gap-0">
										<Tabs.Trigger value="members" class={subTriggerClass('members')}>
											<i class="fi fi-rr-following mr-1.5" aria-hidden="true"></i>
											Current members
										</Tabs.Trigger>
										<Tabs.Trigger value="add-friends" class={subTriggerClass('add-friends')}>
											<i class="fi fi-br-user-add mr-1.5" aria-hidden="true"></i>
											Add by ID
										</Tabs.Trigger>
										<Tabs.Trigger value="pick-database" class={subTriggerClass('pick-database')}>
											<i class="fi fi-rr-database mr-1.5" aria-hidden="true"></i>
											From database
										</Tabs.Trigger>
										<Tabs.Indicator />
									</Tabs.List>
								</nav>

								<Tabs.Content value="members" id="tabs:s2:content-members" class="focus:outline-none w-full">
										<div class="flex w-full flex-wrap">
											<div class="table-container w-full rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
												<table class="table w-full">
													<thead class="bg-surface-200 dark:bg-surface-700">
														<tr>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">User</th>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">Last Turbo</th>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">Last Ranked</th>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">Turbo (30d)</th>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">Ranked (30d)</th>
															<th class="font-semibold text-surface-700 dark:text-surface-300 py-2.5 px-4">Actions</th>
														</tr>
													</thead>
													<tbody>
														{#each selectedLeague.members as friend}
															{@const member = friend as LeagueMemberRow}
															<tr class="items-center">
																<td class="flex items-center gap-2">
																	{#if member?.user?.avatar_url ?? member?.avatar_url}
																		<img class="rounded-full h-8 w-8 shrink-0" src={member?.user?.avatar_url ?? member?.avatar_url} alt="" />
																	{:else}
																		<div class="rounded-full h-8 w-8 shrink-0 bg-surface-500 flex items-center justify-center">
																			<i class="fi fi-rr-portrait text-sm"></i>
																		</div>
																	{/if}
																	<span>{member?.user?.username ?? member?.display_name ?? member.account_id}</span>
																</td>
																<td>{member.newestMatch ? dayjs(member.newestMatch).format('MM/DD/YYYY') : '—'}</td>
																<td>{data.memberLastRanked?.[member.account_id] ? dayjs(data.memberLastRanked[member.account_id]).format('MM/DD/YYYY') : '—'}</td>
																<td>{data.memberMatchCounts?.[member.account_id]?.turbo ?? 0}</td>
																<td>{data.memberMatchCounts?.[member.account_id]?.ranked ?? 0}</td>
																<td>
																	<form method="POST" action="?/removeLeagueMember" use:enhance={enhanceMemberForm}>
																		<input type="hidden" name="account_id" value={member.account_id} />
																		<button
																			type="submit"
																			class="btn-icon btn-icon-sm preset-filled-warning-500 hover:translate-y-1 hover:bg-amber-500"
																			title="Remove from league"
																			aria-label="Remove {member?.user?.username ?? member?.display_name ?? member.account_id} from league"
																		>
																			<i class="fi fi-bs-remove-user" aria-hidden="true"></i>
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
											<p class="text-sm text-surface-500 dark:text-surface-400">Add members by Dota account ID. Enter one or more IDs, comma-separated.</p>
											<label class="label">
												<span class="font-medium text-surface-700 dark:text-surface-300">Account IDs</span>
												<textarea
													class="textarea mt-1"
													name="account_ids"
													rows="4"
													placeholder="e.g. 65110965, 423076846"
													bind:value={friendsString}
												></textarea>
											</label>
											{#if form?.missing}
												<aside class="alert preset-tonal-primary border border-primary-500" transition:fade|local={{ duration: 200 }}>
													<div class="alert-message">
														<h4 class="h4 text-red-600">Enter at least one valid Dota User ID</h4>
													</div>
												</aside>
											{/if}
											<button type="submit" class="btn preset-filled-success-500 w-fit">Add to league</button>
										</form>
									</Tabs.Content>
									<Tabs.Content value="pick-database" class="focus:outline-none">
										<div class="space-y-4 max-w-2xl">
											<p class="text-sm text-surface-500 dark:text-surface-400">Add any user from the app database to this league.</p>
											<label class="label block">
												<span class="font-medium text-surface-700 dark:text-surface-300">Search users</span>
												<input
													type="search"
													class="input mt-1"
													placeholder="Filter by username..."
													bind:value={userSearchQuery}
													aria-label="Search users to add"
												/>
											</label>
											<div class="max-h-80 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-700 divide-y divide-surface-200 dark:divide-surface-700">
												{#if filteredUsersToAdd.length === 0}
													<div class="p-6 text-center text-surface-500 dark:text-surface-400 text-sm">
														{userSearchQuery.trim() ? 'No users match your search.' : 'All database users are already in this league.'}
													</div>
												{:else}
													{#each filteredUsersToAdd as user}
														<div class="flex items-center justify-between gap-4 p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50">
															<div class="flex items-center gap-3 min-w-0">
																{#if user.avatar_url}
																	<img class="rounded-full h-10 w-10 shrink-0" src={user.avatar_url} alt="" />
																{:else}
																	<div class="rounded-full h-10 w-10 shrink-0 bg-surface-500 flex items-center justify-center">
																		<i class="fi fi-rr-portrait text-xl"></i>
																	</div>
																{/if}
																<span class="font-medium truncate">{user.username}</span>
																<span class="text-sm text-secondary-500 shrink-0">ID: {user.account_id}</span>
															</div>
															<form method="POST" action="?/addLeagueMembers" use:enhance={enhanceMemberForm} class="shrink-0">
																<input type="hidden" name="account_ids" value={user.account_id} />
																<button type="submit" class="btn btn-sm preset-tonal-success">
																	<i class="fi fi-br-add mr-1"></i> Add to league
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
					</div>
				</Tabs.Content>
				<Tabs.Content value="seasons" class="focus:outline-none">
					<div class="card flex flex-col relative mt-0 rounded-t-none border-t-0 border border-surface-200 dark:border-surface-700">
						{#if !data.session?.user?.roles?.includes('dev')}
							<div class="z-50 absolute inset-0 bg-surface-900/90 flex items-center justify-center rounded-b-xl">
								<div class="text-center p-8 rounded-xl bg-surface-800 border border-surface-600">
									<img src={Lock} class="h-24 w-24 mx-auto mb-4 opacity-80" alt="" />
									<p class="text-surface-200 font-medium">Contact an admin to manage seasons.</p>
								</div>
							</div>
						{/if}

						<div class="p-6 space-y-6">
							<div>
								<h2 class="h3 text-surface-800 dark:text-surface-200">Create a season</h2>
								<p class="text-sm text-surface-500 dark:text-surface-400 mt-1">Active seasons are listed in the Overview tab.</p>
							</div>

							<form method="POST" action="?/createSeason" use:enhance={enhanceForm} class="space-y-6 max-w-xl">
								<input type="hidden" name="leagueID" value={selectedLeague.id} />
								<input type="hidden" name="leagueName" value={selectedLeague.name} />
								<input type="hidden" name="creatorID" value={data.session?.user.account_id ?? ''} />
								<input type="hidden" name="members" value={leagueMemberIDs.join(',')} />

								<label class="label block" for="seasonType">
									<span class="font-medium text-surface-700 dark:text-surface-300">Season type</span>
									<select id="seasonType" class="select mt-1 w-full" name="seasonType" required>
										<option value="dotadeck">Dotadeck</option>
										<option value="random">Random Romp</option>
										<option value="snake" disabled>Snake Draft Survival</option>
										<option value="none" disabled>More season types coming soon</option>
									</select>
								</label>

								<div id="seasonDateRange" class="space-y-3">
									<span class="font-medium text-surface-700 dark:text-surface-300 block">Season date range</span>
									<input type="hidden" name="seasonStartDate" value={value.start?.toString() ?? ''} required />
									<input type="hidden" name="seasonEndDate" value={value.end?.toString() ?? ''} required />
									{#if value.start && value.end}
										<p class="text-sm text-surface-600 dark:text-surface-400">
											{dayjs(value.start.toString()).format('MMM D, YYYY')} – {dayjs(value.end.toString()).format('MMM D, YYYY')}
										</p>
									{/if}
									<RangeCalendar bind:value class="border border-surface-200 dark:border-surface-600 rounded-lg" numberOfMonths={2} />
								</div>

								<button type="submit" class="btn preset-filled-success-500">
									<i class="fi fi-rr-plus mr-2"></i>Create season
								</button>
							</form>
						</div>
					</div>
				</Tabs.Content>
				<Tabs.Content value="history" class="focus:outline-none">
					<div class="card mt-0 rounded-t-none border-t-0 border border-surface-200 dark:border-surface-700 p-12 text-center">
						<i class="fi fi-rr-history text-4xl text-surface-400 dark:text-surface-500 mb-4" aria-hidden="true"></i>
						<p class="text-surface-500 dark:text-surface-400">History coming soon.</p>
					</div>
				</Tabs.Content>
		</Tabs>
	</div>
	{:else}
		<p class="text-secondary-500">League not found.</p>
	{/if}
</section>
