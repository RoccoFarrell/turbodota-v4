<script lang="ts">
	//prisma
	import type { Turbotown, TurbotownStatus } from '@prisma/client';

	//svelte
	import { enhance } from '$app/forms';

	//skeleton
	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};

	import { getContext } from 'svelte';
	const toastStore = getContext<any>('toaster');
	
	// Helper function to create toasts with Skeleton v3 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.create === 'function') {
			toastStore.create({
				title: message,
				description: '',
				type: background?.includes('error') ? 'error' : 
				       background?.includes('success') ? 'success' : 
				       background?.includes('warning') ? 'warning' : 'info',
				meta: { background }
			});
		}
	}

	interface Props {
		account_id: number;
		allTurbotowns: any[];
		turbotownID: number;
		turbotownUsers: Array<any>;
		onClose?: () => void;
	}

	let { account_id, allTurbotowns, turbotownID, turbotownUsers, onClose }: Props = $props();

	let selectedUser: String = $state();
	let selectedTown = $state(allTurbotowns.filter((town) => town.user.account_id === account_id));
	let selectedTownString: String = $state(townToString(selectedTown[0]));

	function onFormSubmit(inputSelectedTown: any): void {
		// Close modal after form submission
		onClose?.();

		showToast(`Used Linken's Sphere`, 'preset-filled-success-500');

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
					<select class="select" name="selectedUserID" bind:value={selectedUser} onchange={changeUserHandler}>
						{#each turbotownUsers as townUser}
							<option>{townUser.user.username}</option>
						{/each}
					</select>
					<button class="btn preset-filled-primary-500 w-full" onclick={() => onFormSubmit(selectedTown[0])}>
						<div class="italic">Select</div></button
					>
				</div>
			</div>
		</form>
	</div>
</div>
