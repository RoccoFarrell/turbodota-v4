<script lang="ts">
	import { enhance } from '$app/forms';
	import Trophy_light from '$lib/assets/trophy_light.png';
	import { fade } from 'svelte/transition';

	import dayjs from 'dayjs';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//skeleton
	import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';

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

	/* 
        Create league table
    */

	let leagueTableData = data.leagues.map((league: any) => {
		return {
			id: league.id,
			name: league.name,
			creatorID: league.creator.username,
			lastUpdated: dayjs(league.lastUpdated).format('MM/DD/YYYY'),
			membersCount: league.members.length
		};
	});
	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Name', 'ID', 'Creator', 'Last Updated', 'Members'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(leagueTableData, ['name', 'id', 'creatorID', 'lastUpdated', 'membersCount']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(leagueTableData, ['name', 'id', 'creatorID', 'lastUpdated', 'membersCount'])
		// Optional: A list of footer labels.
		//foot: ['Total', '', '<code class="code">5</code>']
	};

	let tabSet: number = 0;

	let friendsString: string = '';

	const handleAddCommonFriend = (account_id: number) => {
		if (!friendsString.includes(account_id.toString())) {
			friendsString += `${account_id},`;
		}
	};
</script>

<section class="lg:w-3/4 w-full h-screen px-4 lg:mx-auto my-4 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<img src={Trophy_light} class="w-20 h-20" alt="leagues page" />
		<h2 class="h2">Leagues Admin</h2>
	</div>

	<div class="space-y-2">
		<h3 class="h3 text-primary-500">Existing Leagues</h3>
		{#if leagueTableData.length > 0}
			<!-- <Table
				source={tableSource}
				class="table-compact"
				regionCell="dark:first:text-amber-500 first:text-amber-600 first:font-bold"
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
								<a href={`/leagues/${row[1]}`}
									><td class="font-bold text-amber-500 hover:underline hover:text-primary-600">{row[0]}</td></a
								>
								<td>{row[1]}</td>
								<td>{row[2]}</td>
								<td>{row[3]}</td>
								<td>{row[4]}</td>
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
		<!-- <div class="grid grid-cols-4">
			<div></div>
			{#each data.leagues as league}
				<div>{league.name}</div>
				<div>{league.members.count}</div>
				<div>{league.name}</div>
				<div>{league.name}</div>
			{/each}
		</div> -->

		<!-- <div class="w-full border border-dashed border-red-500 p-4">League 1</div> -->
	</div>

	<div class="space-y-4 card flex flex-col max-w-screen relative">
		{#if !data.session.user.roles || !data.session.user.roles.includes('dev')}
			<div class="z-50 absolute w-full h-full bg-slate-900/90 flex items-center justify-center rounded-xl">
				<img src={Lock} class="h-32 w-32 inline" alt="locked" />
				<h3 class="h3 text-primary-500 rounded-xl m-4 bg-surface-500/90 p-4">Contact an admin to create a league!</h3>
			</div>
		{/if}

		<div class="p-4 space-y-4">
			<h3 class="h3 p-2 w-full border-b border-primary-700 border-dashed">Create a new League</h3>
			<form method="POST" class="space-y-8" action="?/createLeague" use:enhance>
				<!-- <hgroup>
                <h2>Login</h2>
                <h3>Welcome back!</h3>
            </hgroup> -->
				<!-- <label for="username">Username</label>
            <input type="text" id="username" name="username" required /> -->
				<div class="flex space-x-4 items-center">
					<label for="leagueName" class="my-1 text-secondary-500 h4 font-bold">League Name</label>
					<input
						type="leagueName"
						id="leagueName"
						name="leagueName"
						placeholder="Turbotown Enjoyers"
						required
						class="input w-1/2 p-2"
					/>
				</div>

				<div>
					<h4 class="h4 text-amber-500">Add friends</h4>

					<TabGroup>
						<Tab bind:group={tabSet} name="tab1" value={0}>
							<svelte:fragment slot="lead"
								><div class="flex w-full justify-around">
									<i class="fi fi-rr-following"></i><span class="ml-2">Friends</span>
								</div></svelte:fragment
							>
						</Tab>
						<Tab bind:group={tabSet} name="tab2" value={1}
							><svelte:fragment slot="lead"
								><div class="flex w-full justify-around">
									<i class="fi fi-rr-search-heart"></i><span class="ml-2">Search</span>
								</div></svelte:fragment
							></Tab
						>

						<!-- Tab Panels --->
						<svelte:fragment slot="panel">
							{#if tabSet === 0}
								<div class="my-2 space-y-2">
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
								</div>
							{:else if tabSet === 1}
								<div class="w-full italic">Coming soon!</div>
							{/if}
						</svelte:fragment>
					</TabGroup>
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

				<div class="w-full flex justify-center">
					<button type="submit" class="btn variant-filled-success w-1/2 mx-auto">Create League</button>
				</div>
			</form>
		</div>
	</div>
</section>
