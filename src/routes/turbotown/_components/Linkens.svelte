<script lang="ts">
	//prisma
	import type { Turbotown, TurbotownStatus } from '@prisma/client';

	//svelte
	import { enhance } from '$app/forms';

	//skeleton
	import { getModalStore } from '@skeletonlabs/skeleton';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	let account_id: number = $modalStore[0].meta.account_id;
	let turbotownID: number = $modalStore[0].meta.turbotownID;
	let allTurbotowns: any[] = $modalStore[0].meta.allTurbotowns;
	let turbotownUsers: Array<any> = $modalStore[0].meta.turbotownUsers;

	let selectedUser: String;
	let selectedTown = allTurbotowns.filter((town) => town.user.account_id === account_id);
	let selectedTownString: String = townToString(selectedTown[0]);

	function onFormSubmit(inputSelectedTown: any): void {
		if ($modalStore[0].response) $modalStore[0].response(inputSelectedTown);
		modalStore.close();

		const t: ToastSettings = {
			message: `Used Linken's Sphere`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);

		console.log('submitted town', inputSelectedTown);
	}

	function townToString(inputSelectedTown: any) {
		return JSON.stringify(
			inputSelectedTown,
			(key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
		);
	}

	const changeUserHandler = () => {
		selectedTown = allTurbotowns.filter((town) => town.user.username === selectedUser);
		selectedTownString = townToString(selectedTown[0]);
	};
	
</script>

<div class="flex flex-col justify-center items-center">
	<div id="linkensModal" class="h1 w-[50vw] card flex flex-col justify-center items-center p-4">
		<form method="POST" class="w-full" action="/turbotown?/useLinkens" use:enhance>
			<input type="hidden" name="turbotownID" value={turbotownID} />
			<input type="hidden" name="turbotownDestination" value={selectedTownString} />
			<div class="flex flex-col justify-center w-full space-y-4">
				<div class="w-full flex justify-center">
					<p class="italic text-tertiary-600 text-sm">
						This magical sphere once protected one of the most famous heroes in history. Maybe it can be of some use to
						you, too...
					</p>
				</div>
				<h2 class="h2 text-center text-success-500">Select Town to Apply Linken's Sphere</h2>
				<div class="h-full w-full grid grid-cols-3 mx-auto my-4 p-4 gap-4">
					<select class="select" name="selectedUserID" bind:value={selectedUser} on:change={changeUserHandler}>
						{#each turbotownUsers as townUser}
							<option>{townUser.user.username}</option>
						{/each}
					</select>
					<button class="btn variant-filled-primary w-full" on:click={() => onFormSubmit(selectedTown[0])}>
						<div class="italic">Select</div></button
					>
				</div>
			</div>
		</form>
	</div>
</div>
