<script lang="ts">
	import { enhance } from '$app/forms';
	import Trophy_light from '$lib/assets/trophy_light.png';
	import { fade } from 'svelte/transition';
	import type { User } from '@prisma/client';

	import dayjs from 'dayjs';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//skeleton
	import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
	//images
	import Lock from '$lib/assets/lock.png';

	$: console.log(data);

	export let form;

	$: console.log(form);

	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	$: if (form?.missing) {
		const t: ToastSettings = {
			message: `Enter at least one valid Dota User ID`,
			background: 'variant-filled-error'
		};

		toastStore.trigger(t);
	} else if (form?.success) {
		const t: ToastSettings = {
			message: `League created!`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);
	}
	let tabSetOuter: number = 0;
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
</script>

<section class="lg:w-3/4 w-full h-screen px-4 lg:mx-auto my-4 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<img src={Trophy_light} class="w-20 h-20" alt="leagues page" />
		<h2 class="h2 text-amber-500 vibrating">{data.selectedLeague.name}</h2>
	</div>

	<div class="card w-full border border-dashed border-red-500 p-4">
		<div class="grid grid-cols-3 gap-4 place-items-center">
			<div class="text-sm">
				Commissioner: <p class="inline font-semibold text-xl text-primary-500">
					{data.selectedLeague.creator.username}
				</p>
			</div>
			<div>
				Created on: <p class="inline font-semibold text-primary-500">
					{dayjs(data.selectedLeague.createdDate).format('MM/DD/YYYY')}
				</p>
			</div>
			<div>
				Members: <p class="inline font-semibold text-primary-500">{data.selectedLeague.members.length}</p>
			</div>
		</div>
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
						{#if !data.session.user.roles || !data.session.user.roles.includes('dev')}
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
									<h4 class="h4 text-amber-500">Manage League Members</h4>

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
																{#each data.selectedLeague.members as friend}
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
							<form method="POST" class="space-y-8" action="?/createSeason" use:enhance>
								<div>
									<h4 class="h4 text-amber-500">Manage Seasons</h4>

									
								</div>

								<div class="w-full flex justify-center">
									<button type="submit" class="btn variant-filled-success w-1/2 mx-auto">Update Members</button>
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
