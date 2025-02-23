<script lang="ts">
	import { enhance } from '$app/forms';
    import { getContext } from 'svelte';

	//dayjs
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

    //modal
    import { getModalStore } from '@skeletonlabs/skeleton';
	const modalStore = getModalStore();

    let session: any = getContext('session')

	let activeOptionID: number = 0;

	const setActiveOption = (optionID: number) => {
		activeOptionID = optionID;
	};

	let matchTimestamp: number = dayjs().unix();
</script>

<section id="adminTools" data-test-id="adminTools" class="w-3/4 h-[calc(100vh-128px)] p-4">
	<div class="h-3/4 card p-8 top-10 mt-32">
		<div class="flex justify-between border-b border-dashed border-primary-500 p-4">
			<h1 class="h1 text-amber-500">Admin Tools</h1>
			<button class="btn rounded-full variant-filled-primary" on:click={() => modalStore.close()}>X</button>
		</div>

		<div class="grid grid-cols-2 my-4 h-4/5">
			<div class="w-full h-full flex flex-col justify-center space-y-4">
				<button
					class="btn variant-filled-secondary"
					on:click={() => {
						setActiveOption(0);
					}}
				>
					Add a fake match (heroID, userID, w/L, timestamp)
				</button>
				<button
					class="btn variant-filled-secondary"
					on:click={() => {
						setActiveOption(1);
					}}
				>
					Delete a match by ID
				</button>
				<button
					class="btn variant-filled-secondary"
					on:click={() => {
						setActiveOption(2);
					}}
				>
					Delete a quest by ID
				</button>
				<button
					class="btn variant-filled-secondary"
					on:click={() => {
						setActiveOption(3);
					}}
				>
					Change gold
				</button>
				<button
					class="btn variant-filled-secondary"
					on:click={() => {
						setActiveOption(4);
					}}
				>
					Change xp
				</button>
			</div>
			<div class="h-full m-4 border-l border-dashed border-orange-500">
				<div class="h-full m-4 card p-4">
                    {#if activeOptionID === 0}
                        <h4 class="h4 text-amber-500">Add a Fake Match</h4>
                    

					<form method="POST" class="" action="?/addFakeMatch" use:enhance>
						<div class="flex flex-col space-y-2">
							<label class="label">
								<span class="font-semibold text-primary-500">User ID</span>
								<input class="input" title="account_id" name="account_id" value={session.user.account_id} type="text" placeholder="65110965" />
							</label>
							<label class="label">
								<span class="font-semibold text-primary-500">Hero ID</span>
								<input class="input" title="heroID" name="heroID" value=23 type="text" placeholder="23" />
							</label>
							<label class="label">
								<span class="font-semibold text-primary-500">Win?</span>
								<select class="select" title="win" name="win">
									<option value="1">Win</option>
									<option value="0">Loss</option>
								</select>
							</label>
							<label class="label">
								<span class="flex justify-between items-center font-semibold text-primary-500">
									Timestamp <p class="text-right text-xs italic text-tertiary-500">Default: current time</p></span
								>
								<input
									class="input"
									title="timestamp"
									type="text"
                                    name="matchTS"
									placeholder="1705278870"
									bind:value={matchTimestamp}
								/>
							</label>
						</div>
						<button
							type="submit"
							class="btn variant-filled-primary w-3/4 my-4"
						>
							Submit
						</button>
					</form>
                    {:else}
                        <h3 class="h3">Coming soon.</h3>
                    {/if}
				</div>
			</div>
		</div>
	</div>
</section>
