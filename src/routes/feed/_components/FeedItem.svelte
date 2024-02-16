<script lang="ts">
	import { getContext } from 'svelte';
	import dayjs from 'dayjs';
	import RelativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(RelativeTime);

	//types
	import type { Hero, Season, Turbotown, User, TurbotownQuest, TurbotownAction } from '@prisma/client';

	//images

	//components
	import { Avatar } from '@skeletonlabs/skeleton';
	export let action: any;
	export let items: any;

	let observerURL = items.filter((item: any) => item.name === 'Observer Ward')[0].imgSrc;

	//console.log(action)

	let heroes: any = getContext('heroes');
	//console.log('heroes in feed item: ', heroes);

	function getHighDefSteamAvatar(inputAvatarURL: String) {
		if (inputAvatarURL) {
			return (inputAvatarURL = inputAvatarURL.replace('.jpg', '_full.jpg'));
		}
	}
</script>

<li class="mx-8">
	{#if action?.user && (action?.quest || action?.action || action.type === 'activeQuestGroup')}
		<span class="flex w-full justify-start items-center">
			<div class="mr-2 border border-dashed border-orange-500/50 flex h-12 w-12 items-center justify-center">
				{#if action.quest}
					{#if action.quest.win}
						<p class="font-bold text-xl text-green-500">W</p>
					{:else}
						<p class="font-bold text-xl text-red-500">L</p>
					{/if}
				{:else if action.action}
					{#if action.action.action === 'observer'}
						<img src={observerURL} class="h-8 rounded-full" alt="observer" />
					{/if}
				{:else if action.type === 'activeQuestGroup'}
					<i class="fi fi-bs-hourglass-end w-4 h-4 text-amber-500"></i>
				{/if}
			</div>
			<div class="mr-2">
				{#if action?.user?.avatar_url}
					<Avatar src={getHighDefSteamAvatar(action.user.avatar_url)} width="w-12" rounded="rounded-xl" />
				{:else}
					<i class="text-5xl fi fi-rr-mode-portrait"></i>
				{/if}
			</div>

			{#if action?.user}
				<p class="font-extrabold text-secondary-400">{action.user.username}</p>
			{:else}
				<p class="font-extrabold">Unknown</p>
			{/if}

			{#if action.quest}
				{#if action.quest.active}
					<p class="ps-1">has an</p>
					<p class="text-blue-500 ps-1">active quest</p>
					<p class="ps-1">as</p>
					<i class={`d2mh hero-${heroes.filter((hero) => hero.id === action.quest.random.randomedHero)[0].id} m-1 p-4`}
					></i>
					<p>in slot {action.quest.questSlot}</p>
				{:else if action.quest.status === 'completed'}
					<p class={'ps-1 ' + (action.quest.win ? 'text-green-500' : 'text-red-500')}>
						{action.quest.win ? 'won' : 'lost'}
					</p>
					<p class="ps-1">quest as</p>
					<i class={`d2mh hero-${heroes.filter((hero) => hero.id === action.quest.random.randomedHero)[0].id} m-1 p-4`}
					></i>
					<!-- on
					<p class="font-extrabold ps-1">{dayjs(action.quest.endDate).format('lll')}</p> -->
					<p class="ps-1">and gained</p>
					<i class="fi fi-rr-coins text-yellow-500 ps-1">{action.quest.endGold}</i>
					{#if action.quest.win}
						<i class="fi fi-br-arrow-trend-up text-center text-green-500 ps-1">{action.quest.endXp}</i>
					{:else}
						<i class="fi fi-br-arrow-trend-down text-center text-red-500 ps-1">{action.quest.endXp}</i>
					{/if}
				{:else if action.quest.status === 'skipped'}
					<p class="ps-1 text-orange-500">skipped</p>
					<p class="ps-1">quest as</p>
					<i class={`d2mh hero-${heroes.filter((hero) => hero.id === action.quest.random.randomedHero)[0].id} m-1 p-4`}
					></i>
					<!-- on
					<p class="font-extrabold ps-1">{dayjs(action.quest.endDate).format('lll')}</p> -->
					<p class="ps-1">and gained</p>
					<i class="fi fi-rr-coins text-yellow-500 ps-1">{action.quest.endXp}</i>
					{#if action.quest.win}
						<i class="fi fi-br-arrow-trend-up text-center text-green-500 ps-1">{action.quest.endXp}</i>
					{:else}
						<i class="fi fi-br-arrow-trend-down text-center text-red-500 ps-1">{action.quest.endXp}</i>
					{/if}
				{/if}
			{/if}

			{#if action.action && (action.action.action === 'observer' || action.action.action === 'quelling blade')}
				<!-- <p class="font-extrabold">{town.user.username}</p> -->
				<p class="ps-1">used {action.action.action === 'observer' ? 'an' : 'a'}</p>
				<p class="font-extrabold ps-1 text-amber-300">{action.action.action}</p>
				<p class="ps-1">to {action.action.action === 'observer' ? 'select' : 'skip'}</p>
				{#if action.action.value}
					<i class={`d2mh hero-${heroes.filter((hero) => hero.id === parseInt(action.action.value))[0].id} m-1 p-4`}
					></i>
				{:else}
					<i class="fi fi-sr-person-circle-question text-2xl px-2"></i>
					<p class="inline italic text-tertiary-500">unknown</p>
				{/if}
				<!-- on
				<p class="font-extrabold ps-1">{dayjs(action.appliedDate).format('lll')}</p> -->
			{/if}

			{#if action.action && (action.action.action === 'spirit vessel' || action.action.action === 'linkens')}
				<p class="ps-1">{action.action.value === 'failed' ? 'attempted to use a' : 'used a'}</p>
				<p class="font-extrabold ps-1 text-amber-300">{action.action.action}</p>
				<p class="ps-1">to {action.action.action === 'spirit vessel' ? 'debuff' : 'buff'}</p>
				<p class="ps-1 font-extrabold text-secondary-400">{action.destinationUser.username}</p>
				{#if action?.destinationUser?.avatar_url}
					<Avatar src={getHighDefSteamAvatar(action.user.avatar_url)} width="w-12" rounded="rounded-xl" />
				{:else}
					<i class="ps-1 text-5xl fi fi-rr-mode-portrait"></i>
				{/if}
				<p class="ps-1">{action.action.value === 'failed' ? 'but was blocked by [item]': ''}</p>

			{/if}

			{#if action.type === 'activeQuestGroup'}
				<div class="ps-1 flex items-center">
					<p>has</p>
					<div class="inline">
						{#each action.heroes as heroID}
							<i class={`d2mh hero-${heroes.filter((hero) => hero.id === heroID)[0].id} m-1 p-4`}></i>
						{/each}
					</div>
					<p>as their active quests</p>
				</div>
			{/if}
		</span>
		{#if action?.quest?.endXp}
			<span class="flex text-right">
				<i class="fi fi-rr-coins text-yellow-500 ps-1">{action.quest.endGold}</i>
				{#if action.quest.win}
					<i class="fi fi-br-arrow-trend-up text-center text-green-500 ps-1">{action.quest.endXp}</i>
				{:else}
					<i class="fi fi-br-arrow-trend-down text-center text-red-500 ps-1">{action.quest.endXp}</i>
				{/if}
			</span>
		{/if}
		<span class="italic text-tertiary-700 text-right pr-2 min-w-fit">
			<p class="inline text-sm">
				{#if action.endDate}
					{dayjs(action.endDate).fromNow()}
				{:else}
					{dayjs(action.startDate).fromNow()}
				{/if}
			</p>
		</span>
	{:else}
		<div>broken</div>
	{/if}
</li>
