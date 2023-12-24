<script lang="ts">
    import { enhance } from '$app/forms';
	import Trophy_light from '$lib/assets/trophy_light.png';
    import { fade } from 'svelte/transition'

    //page data
	import type { PageData } from './$types';
	export let data: PageData;

    //skeleton
    import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';

    console.log(data)

    export let form

    $: console.log(form)

    import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

    $: if(form?.missing){
        const t: ToastSettings = {
			message: `Enter at least one valid Dota User ID`,
			background: 'variant-filled-error'
		};

		toastStore.trigger(t);
    }

    let tabSet: number = 0;
</script>

<section class="w-3/4 mx-auto my-4 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<img src={Trophy_light} class="w-20 h-20" alt="leagues page" />
		<h2 class="h2">Leagues Admin</h2>
	</div>

    <div class="space-y-2">
        <h3 class="h3">Existing Leagues</h3>
        <div class="w-full border border-dashed border-red-500 p-4">League 1</div>
    </div>

    <div class="space-y-2">
        <h3 class="h3">Create a new League</h3>
        <form method="POST" class="space-y-2" action="?/createLeague" use:enhance>
            <!-- <hgroup>
                <h2>Login</h2>
                <h3>Welcome back!</h3>
            </hgroup> -->
            <!-- <label for="username">Username</label>
            <input type="text" id="username" name="username" required /> -->
    
            <label for="leagueName" class="my-1">League Name</label>
            <input type="leagueName" id="leagueName" name="leagueName" placeholder="Turbotown Enjoyers" required class="input w-1/2 p-2"/>
    
            <TabGroup>
                <Tab bind:group={tabSet} name="tab1" value={0}>
                    <svelte:fragment slot="lead">(icon)</svelte:fragment>
                    <span>(label 1)</span>
                </Tab>
                <Tab bind:group={tabSet} name="tab2" value={1}>(label 2)</Tab>
                <Tab bind:group={tabSet} name="tab3" value={2}>(label 3)</Tab>
                <!-- Tab Panels --->
                <svelte:fragment slot="panel">
                    {#if tabSet === 0}
                    <label class="label">
                        <span>Enter a comma separated list of your friend's Dota Account IDs:</span>
                        <textarea class="textarea" id="dotaUsersList" name="dotaUsersList" rows="4" required placeholder="100001, 20002, 30003, 40004, etc..." />
                    </label>
                    {:else if tabSet === 1}
                        (tab panel 2 contents)
                    {:else if tabSet === 2}
                        (tab panel 3 contents)
                    {/if}
                </svelte:fragment>
            </TabGroup>

            {#if form?.missing}
                <!-- <p class="alert-message">Enter at least one valid Dota User ID.</p> -->
                <aside class="alert variant-ghost-primary" transition:fade|local={{ duration: 200 }}>
                    <div class="alert-message">
                        <h4 class="h4 text-red-600">Enter at least one valid Dota User ID</h4>
                        <p>Total length of valid Dota User IDs was 0. </p>
                    </div>
                </aside>
            {/if}
    
            <button type="submit" class="btn variant-filled-secondary w-1/2">Create League</button>
        </form>
    </div>

	
</section>
