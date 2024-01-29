<script lang="ts">
	import { getContext } from 'svelte';
	import dayjs from 'dayjs';

	//types
	import type { Hero, Season, Turbotown, User, TurbotownQuest, TurbotownAction } from '@prisma/client';

	//components
	import { Avatar } from '@skeletonlabs/skeleton';
	export let action: any;

	let heroes: any = getContext('heroes');

	function getHighDefSteamAvatar(inputAvatarURL: String) {
		if (inputAvatarURL) {
			return (inputAvatarURL = inputAvatarURL.replace('.jpg', '_full.jpg'));
		}
	}
</script>

<li>
	{#if action?.user && (action?.quest || action?.random)}
		{#if action?.user?.avatar_url}
			<Avatar src={getHighDefSteamAvatar(action.user.avatar_url)} width="w-12" rounded="rounded-xl" />
		{:else}
			<i class="text-5xl fi fi-rr-mode-portrait"></i>
		{/if}

		<span class="flex">
			{#if action?.user}
				<p class="font-extrabold">{action.user.username}</p>
			{:else}
				<p class="font-extrabold">Unknown</p>
			{/if}

            {#if action.quest}
            
                <p class={'ps-1 ' + (action.quest.win ? 'text-green-500' : 'text-red-500')}>
                    {action.quest.win ? 'won' : 'lost'}
                </p>
                <p class="ps-1">quest as</p>
                <i class={`d2mh hero-${heroes.filter((hero) => hero.id === action.quest.random.randomedHero)[0].id} m-1 p-4`}></i>
                on
                <p class="font-extrabold ps-1">{dayjs(action.quest.endDate).format('lll')}</p>
                <p class="ps-1">and gained</p>
                <i class="fi fi-rr-coins text-yellow-500 ps-1">{action.quest.endXp}</i>
                {#if action.quest.win}
                    <i class="fi fi-br-arrow-trend-up text-center text-green-500 ps-1">{action.quest.endXp}</i>
                {:else}
                    <i class="fi fi-br-arrow-trend-down text-center text-red-500 ps-1">{action.quest.endXp}</i>
                {/if}
            {/if}

		</span>
	{:else}
		<div>broken</div>
	{/if}
</li>
