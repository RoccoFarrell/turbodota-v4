<script lang="ts">
	import { setContext } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Trophy_light from '$lib/assets/trophy_light.png';
	import { fade } from 'svelte/transition';
	import type { User, League } from '@prisma/client';
	import { Prisma } from '@prisma/client';

	import dayjs from 'dayjs';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//components //skeleton
	import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';

	//images
	import Lock from '$lib/assets/lock.png';

	$: console.log(data);

	export let form;

	$: console.log(form);

	//set active league
	//setContext('selectedLeague', data.selectedLeague)

	/* 
		Get active seasons
	*/

	type LeagueWithSeasonsAndMembers = Prisma.LeagueGetPayload<{
		include: {
			members: {
				include: {
					user: true;
				};
			};
			creator: true;
			seasons: {
				include: {
					members: true;
				};
			};
		};
	}>;

	let selectedLeague: LeagueWithSeasonsAndMembers = data.selectedLeague;

	// Update season table data when form indicates success
	$: if (form?.success) {
		const t: ToastSettings = {
			message: `Season created!`,
			background: 'variant-filled-success'
		};
		toastStore.trigger(t);
	}

	// Watch for data changes and update table
	$: {
		// Only update if we have valid data
		if (data.selectedLeague?.seasons) {
			seasonTableData = selectedLeague.seasons.map((season: any) => ({
				id: season.id,
				name: season.name,
				type: season.type,
				startDate: dayjs(season.startDate).format('MM/DD/YYYY'),
				endDate: dayjs(season.endDate).format('MM/DD/YYYY'),
				membersCount: season.members.length,
				active: season.active
			}));
			
			// Update table source
			tableSource.body = tableMapperValues(seasonTableData, ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active']);
			tableSource.meta = tableSource.body;
		}
	}

	// Watch selectedLeague for changes
	$: selectedLeague = data.selectedLeague;

	let seasonTableData = selectedLeague.seasons.map((season: any) => {
		return {
			id: season.id,
			name: season.name,
			type: season.type,
			//creatorID: season.creator.username,
			startDate: dayjs(season.startDate).format('MM/DD/YYYY'),
			endDate: dayjs(season.endDate).format('MM/DD/YYYY'),
			membersCount: season.members.length,
			active: season.active
		};
	});

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Name', 'ID', 'Type', 'Start Date', 'End Date', 'Members', 'Status'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(seasonTableData, ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(seasonTableData, ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active'])
		// Optional: A list of footer labels.
		//foot: ['Total', '', '<code class="code">5</code>']
	};

	const toastStore = getToastStore();

	$: if (form?.missing) {
		const t: ToastSettings = {
			message: `Enter at least one valid Dota User ID`,
			background: 'variant-filled-error'
		};

		toastStore.trigger(t);
	} else if (form?.success) {
		const t: ToastSettings = {
			message: `Season created!`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);
		// Invalidate the current page data to trigger a refresh
		invalidate('app:leagues');
	}
	let tabSetOuter: number = 1;
	let tabSetInner: number = 0;

	let friendsString: string = '';

	const handleAddCommonFriend = (account_id: number) => {
		if (!friendsString.includes(account_id.toString())) {
			friendsString += `${account_id},`;
		}
	};

	const handleRemoveFromLeague = (user: User) => {
		console.log(`remove ${user}`);
	};

	/* 
		Calendar
	*/
	import { today, getLocalTimeZone } from '@internationalized/date';
	const start = today(getLocalTimeZone());
	const end = start.add({ days: 7 });
	let value = {
		start,
		end
	};

	$: leagueMemberIDs = selectedLeague.members.map((member: any) => member.account_id);
	// $: (value: any) => {
	// 	FormData.
	// }

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
				// Update local state immediately
				seasonTableData = seasonTableData.map(season => {
					if (season.id === seasonId) {
						return { ...season, active };
					}
					return season;
				});

				// Force table to update
				tableSource.body = tableMapperValues(seasonTableData, ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active']);
				tableSource.meta = tableSource.body;

				// Refresh the data
				await invalidate(`/leagues/${selectedLeague.id}`);

				const t: ToastSettings = {
					message: `Season status updated`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(t);
			}
		} catch (error) {
			const t: ToastSettings = {
				message: `Failed to update season status`,
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
	}

	async function handleDeleteSeason(season: { id: number, name: string }) {
		const confirmed = confirm(`Are you sure you want to delete ${season.name}? This cannot be undone.`);
		if (!confirmed) return;

		const response = await fetch(`/api/leagues/${selectedLeague.id}/seasons/${season.id}`, {
			method: 'DELETE'
		});

		const result = await response.json();
		if (result.success) {
			// Remove season from local state
			seasonTableData = seasonTableData.filter(s => s.id !== season.id);

			// Force table to update
			tableSource.body = tableMapperValues(seasonTableData, ['name', 'id', 'type', 'startDate', 'endDate', 'membersCount', 'active']);
			tableSource.meta = tableSource.body;

			// Refresh the data
			await invalidate(`/leagues/${selectedLeague.id}`);

			const t: ToastSettings = {
				message: 'Season deleted successfully',
				background: 'variant-filled-success'
			};
			toastStore.trigger(t);
		} else {
			const t: ToastSettings = {
				message: 'Failed to delete season',
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
	}

	// Form enhancement function
	const enhanceForm = ({ form }: any) => {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				await Promise.all([
					invalidate(`/leagues/${data.selectedLeague.id}`),
					invalidate('app:leagues'),
					update()
				]);
				form.reset();
			}
		};
	};
</script>

<section class="lg:w-3/4 w-full h-screen px-4 lg:mx-auto my-4 space-y-8">
	<!-- <div class="flex justify-center items-center space-x-8">
		<img src={Trophy_light} class="w-20 h-20" alt="leagues page" />
		<h2 class="h2 text-amber-500 vibrating">{selectedLeague.name}</h2>
	</div>

	<div class="card w-full border border-dashed border-red-500 p-4">
		<div class="grid grid-cols-3 gap-4 place-items-center">
			<div class="text-sm">
				Commissioner: <p class="inline font-semibold text-xl text-primary-500">
					{selectedLeague.creator.username}
				</p>
			</div>
			<div>
				Created on: <p class="inline font-semibold text-primary-500">
					{dayjs(selectedLeague.createdDate).format('MM/DD/YYYY')}
				</p>
			</div>
			<div>
				Members: <p class="inline font-semibold text-primary-500">{selectedLeague.members.length}</p>
			</div>
		</div>
	</div> -->

	<div class="space-y-2">
		<h3 class="h3 text-primary-500">Active Seasons</h3>

		{#if seasonTableData.length > 0}
			<!-- <Table
				source={tableSource}
				class="table-compact"
				regionCell="dark:first:text-purple-500 first:text-purple-600 first:font-bold"
			/> -->

			<div class="table-container">
				<!-- Native Table Element -->
				<table class="table table-hover">
					<thead>
						<tr>
							{#each tableSource.head as header, i}
								<th>{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each tableSource.body as row, i}
							<tr>
								<a href={`/leagues/${selectedLeague.id}/seasons/${row[1]}`}
									><td class="font-bold text-purple-500 hover:underline hover:text-primary-600">{row[0]}</td></a
								>
								<td>{row[1]}</td>
								<td class="text-amber-500">{row[2]}</td>
								<td>{row[3]}</td>
								<td>{row[4]}</td>
								<td>{row[5]}</td>
								<td>
									{#if row[6]}
										<div class="flex items-center gap-2">
											<span class="chip variant-filled-success">Active</span>
											<button
												class="btn btn-sm variant-soft-warning"
												on:click={() => handleSeasonStatusUpdate(parseInt(row[1]), false)}
											>
												Deactivate
											</button>
										</div>
									{:else}
										<div class="flex items-center gap-2">
											<span class="chip variant-filled-surface">Inactive</span>
											<button
												class="btn btn-sm variant-soft-success"
												on:click={() => handleSeasonStatusUpdate(parseInt(row[1]), true)}
											>
												Activate
											</button>
										</div>
									{/if}
								</td>
								<td>
									<div class="flex gap-2">
										<button
											class="btn variant-filled-error"
											on:click={() => handleDeleteSeason({ id: parseInt(row[1]), name: row[0] })}
										>
											<i class="fi fi-bs-trash"></i>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					<!-- <tfoot>
						<tr>
							<td>{row[0]}</td>
								<td>{row[1]}</td>
								<td>{row[2]}</td>
                                <td>{row[3]}</td>
                                <td>{row[4]}</td>
						</tr>
					</tfoot> -->
				</table>
			</div>
		{:else}
			<div>No leagues found!</div>
		{/if}
	</div>
	<div class="w-full">
		<TabGroup justify="justify-center">
			<Tab bind:group={tabSetOuter} name="tab1" value={0}>
				<svelte:fragment slot="lead"><i class="fi fi-rr-users-alt"></i></svelte:fragment>
				<span>Members</span>
			</Tab>
			<Tab bind:group={tabSetOuter} name="tab2" value={1}
				><svelte:fragment slot="lead"><i class="fi fi-rr-calendar-star"></i></svelte:fragment>
				<span>Seasons</span></Tab
			>
			<Tab bind:group={tabSetOuter} name="tab3" value={2}
				><svelte:fragment slot="lead"><i class="fi fi-rr-users-alt"></i></svelte:fragment>
				<span>History</span></Tab
			>
			<!-- Tab Panels --->
			<svelte:fragment slot="panel">
				{#if tabSetOuter === 0}
					<div class="space-y-4 card flex flex-col max-w-screen relative">
						{#if !data.session || !data.session.user.roles || !data.session.user.roles.includes('dev')}
							<div class="z-50 absolute w-full h-full bg-slate-900/90 flex items-center justify-center rounded-xl">
								<img src={Lock} class="h-32 w-32 inline" alt="locked" />
								<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
									Contact an admin to manage Members!
								</h3>
							</div>
						{/if}

						<div class="p-4 space-y-4">
							<form method="POST" class="space-y-8" action="?/createLeague" use:enhance>
								<div>
									<h4 class="h4 text-purple-500">Manage League Members</h4>

									<TabGroup>
										<Tab bind:group={tabSetInner} name="tab1" value={0}>
											<svelte:fragment slot="lead"
												><div class="flex w-full justify-around">
													<i class="fi fi-rr-following"></i><span class="ml-2">Members</span>
												</div></svelte:fragment
											>
										</Tab>
										<Tab bind:group={tabSetInner} name="tab2" value={1}>
											<svelte:fragment slot="lead"
												><div class="flex w-full justify-around">
													<i class="fi fi-br-user-add"></i><span class="ml-2">Add Friends</span>
												</div></svelte:fragment
											>
										</Tab>
										<Tab bind:group={tabSetInner} name="tab2" value={2}
											><svelte:fragment slot="lead"
												><div class="flex w-full justify-around">
													<i class="fi fi-rr-search-heart"></i><span class="ml-2">Search for Friends</span>
												</div></svelte:fragment
											></Tab
										>

										<!-- Tab Panels --->
										<svelte:fragment slot="panel">
											{#if tabSetInner === 0}
												<div class="flex w-full flex-wrap">
													<div class="table-container">
														<!-- Native Table Element -->
														<table class="table table-hover">
															<thead>
																<tr>
																	<th>Position</th>
																	<th>Last Turbo</th>
																	<th>Actions</th>
																</tr>
															</thead>
															<tbody>
																{#each selectedLeague.members as friend}
																	<tr class="items-center">
																		<td>{friend?.user?.username || friend.account_id}</td>
																		<td>{dayjs(friend.newestMatch).format('MM/DD/YYYY')}</td>
																		<td>
																			<button
																				class="btn-icon btn-icon-sm variant-filled-warning hover:translate-y-1 hover:bg-amber-500"
																				on:click={(e) => {
																					e.preventDefault();
																					handleRemoveFromLeague(friend);
																				}}
																			>
																				<i class="fi fi-bs-remove-user"></i>
																			</button>
																		</td>
																	</tr>
																{/each}
															</tbody>
															<!-- <tfoot>
																<tr>
																	<th colspan="3">Calculated Total Weight</th>
																	<td>{totalWeight}</td>
																</tr>
															</tfoot> -->
														</table>
													</div>
												</div>
											{/if}
											{#if tabSetInner === 1}
												<div class="flex flex-col space-y-4">
													<div class="text-secondary-500">Most played with friends</div>
													<div class="flex w-full flex-wrap">
														{#if data.common.commonCombined}
															{#each data.common.commonCombined as friend}
																<div
																	class="m-1 flex flex-col card card-hover xl:w-[calc(33%-1em)] md:w-[calc(50%-1em)] max-md:w-full h-full space-y-2 items-center"
																>
																	<div class="grid grid-cols-4 w-full min-h-[50px]">
																		{#if friend.avatar_url}
																			<div class="col-span-1 flex items-center w-full">
																				<header class="rounded-l-full h-full">
																					<img class="rounded-l-full h-full" src={friend.avatar_url} alt="friend" />
																				</header>
																			</div>
																		{:else}
																			<div class="col-span-1 flex justify-center items-center w-full">
																				<header class="flex items-center">
																					<i class="scale-150 fi fi-rr-portrait"></i>
																				</header>
																			</div>
																		{/if}

																		<div class="col-span-2">
																			{#if friend.username}
																				<section class="flex items-center h-full">
																					<h5 class="h5 overflow-hidden text-ellipsis whitespace-nowrap">
																						{friend.username}
																					</h5>
																				</section>
																			{:else}
																				<section class="flex items-center h-full">
																					<h5 class="h5 overflow-hidden text-ellipsis whitespace-nowrap">{friend}</h5>
																				</section>
																			{/if}
																		</div>
																		<div
																			class="variant-filled-success rounded-r-full flex items-center justify-center hover:bg-green-300 hover:cursor-pointer"
																		>
																			<button
																				class="p-2"
																				disabled={friendsString.includes(
																					friend.account_id ? friend.account_id : friend
																				)}
																				on:click={() =>
																					handleAddCommonFriend(friend.account_id ? friend.account_id : friend)}
																				><i class="fi fi-br-add"></i></button
																			>
																		</div>
																	</div>
																	<!-- <div class="flex justify-around space-x-2"></div> -->
																	<!-- <footer>
																		<button
																			class="btn variant-ghost-secondary p-2"
																			disabled={friendsString.includes(friend.account_id ? friend.account_id : friend)}
																			on:click={() =>
																				handleAddCommonFriend(friend.account_id ? friend.account_id : friend)}
																			>Add to League</button
																		>
																	</footer> -->
																</div>
															{/each}
														{/if}
													</div>
													<label class="label">
														<span>Enter a comma separated list of your friend's Dota Account IDs:</span>
														<textarea
															class="textarea"
															id="dotaUsersList"
															name="dotaUsersList"
															rows="4"
															required
															placeholder="100001, 20002, 30003, 40004, etc..."
															bind:value={friendsString}
														/>
													</label>

													{#if form?.missing}
														<!-- <p class="alert-message">Enter at least one valid Dota User ID.</p> -->
														<aside class="alert variant-ghost-primary" transition:fade|local={{ duration: 200 }}>
															<div class="alert-message">
																<h4 class="h4 text-red-600">Enter at least one valid Dota User ID</h4>
																<p>Total length of valid Dota User IDs was 0.</p>
															</div>
														</aside>
													{/if}
												</div>
											{:else if tabSetInner === 2}
												<div class="w-full italic text-center text-xl text-primary-500">Coming soon!</div>
											{/if}
										</svelte:fragment>
									</TabGroup>
								</div>

								<div class="w-full flex justify-center">
									<button type="submit" class="btn variant-filled-success w-1/2 mx-auto">Update Members</button>
								</div>
							</form>
						</div>
					</div>
				{:else if tabSetOuter === 1}
					<div class="space-y-4 card flex flex-col max-w-screen relative">
						{#if !data.session.user.roles || !data.session.user.roles.includes('dev')}
							<div class="z-50 absolute w-full h-full bg-slate-900/90 flex items-center justify-center rounded-xl">
								<img src={Lock} class="h-32 w-32 inline" alt="locked" />
								<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">
									Contact an admin to manage Seasons!
								</h3>
							</div>
						{/if}

						<div class="p-4 space-y-4">
							<form
								method="POST"
								class="space-y-8"
								action="?/createSeason"
								use:enhance={enhanceForm}
							>
								<input type="hidden" name="leagueID" value={selectedLeague.id} />
								<input type="hidden" name="creatorID" value={data.session?.user.account_id} />
								<input type="hidden" name="members" value={leagueMemberIDs.join(',')} />

								<div class="space-y-8">
									<h4 class="h4 text-amber-500">Create a Season</h4>
									<!-- <label class="label">
										<span>Season Name</span>
										<input class="input" type="text" placeholder="Input" />
									</label> -->

									<div class="grid grid-cols-6 gap-2">
										<label class="label text-xs col-span-3">
											<span>League Name</span>
											<input
												class="input text-xs"
												type="text"
												disabled
												name="leagueName"
												bind:value={selectedLeague.name}
											/>
											<input
												class="input text-xs"
												type="text"
												hidden
												name="leagueName"
												bind:value={selectedLeague.name}
											/>
										</label>
										<label class="label text-xs">
											<span>League ID</span>
											<input
												class="input text-xs"
												type="text"
												disabled
												name="leagueID"
												bind:value={selectedLeague.id}
											/>
											<input class="input text-xs" type="text" hidden name="leagueID" bind:value={selectedLeague.id} />
										</label>
										<label class="label text-xs">
											<span>Creator ID</span>
											<input
												class="input text-xs"
												type="text"
												disabled
												name="creatorID"
												bind:value={data.session.user.account_id}
											/>
											<input
												class="input text-xs"
												type="text"
												hidden
												name="creatorID"
												bind:value={data.session.user.account_id}
											/>
										</label>
										<label class="label text-xs">
											<span>Members Count</span>
											<input
												class="input text-xs"
												type="text"
												disabled
												name="membersCount"
												bind:value={selectedLeague.members.length}
											/>
											<input class="input text-xs" type="text" hidden name="members" bind:value={leagueMemberIDs} />
										</label>
									</div>
									<label class="label" for="seasonType">
										<span>Season Type</span>
										<select class="select" name="seasonType" required>
											<option value="dotadeck">Dotadeck</option>
											<option value="random">Random Romp</option>
											<option value="snake" disabled>Snake Draft Survival</option>
											<option value="none" disabled>More season types to come soon!</option>
											<!-- <option value="4">Option 4</option>
											<option value="5">Option 5</option> -->
										</select>
									</label>

									<!--
										Hidden form fields 
									-->

									<label
										for="seasonDateRange"
										class="flex flex-col justify-center items-center w-full space-y-8 mx-auto"
									>
										<span class="text-primary-500 h4 border-b border-dashed border-secondary-500 w-1/2 text-center p-1"
											>Season Date Range</span
										>
										<div class="flex justify-around w-full">
											<div class="flex flex-col justify-center items-center">
												<p class="h4 text-secondary-500">Your season will run from:</p>
												{#if value.start && value.end}
													<label class="label" for="seasonStartDate" hidden>
														<input type="hidden" name="seasonStartDate" value={value.start.toString()} required />
													</label>
													<p class="font-bold text-green-500">
														{dayjs(value.start.toString()).format('dddd [-] MM/DD/YYYY')}
													</p>
													<p class="text-xs italic">to</p>
													<label class="label" for="seasonEndDate" hidden>
														<input type="hidden" name="seasonEndDate" value={value.end.toString()} required />
													</label>
													<p class="font-bold text-green-500">
														{dayjs(value.end.toString()).format('dddd [-] MM/DD/YYYY')}
													</p>
												{/if}
											</div>
											<div class="w-fit">
												<RangeCalendar bind:value class="border rounded-md" numberOfMonths={2} />
											</div>
										</div>
									</label>
								</div>

								<div class="w-full flex justify-center">
									<button type="submit" class="btn variant-filled-success w-1/2 mx-auto"
										><i class="fi fi-rr-magic-wand mx-2"></i> Create Season</button
									>
								</div>
							</form>
						</div>
					</div>
				{:else if tabSetOuter === 2}
					(tab panel 3 contents)
				{/if}
			</svelte:fragment>
		</TabGroup>
	</div>
</section>
