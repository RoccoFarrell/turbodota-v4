<script lang="ts">
    	//dayjs
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	//assets
	import Shopkeeper from '$lib/assets/shopkeeper.png';

	//prisma
	import type { Hero, Season, Turbotown, User, TurbotownQuest, TurbotownAction } from '@prisma/client';
	import { Avatar, CodeBlock } from '@skeletonlabs/skeleton';

    //components
    import FeedItem from './_components/FeedItem.svelte';

	export let data: any;
	console.log('data: ', data);
	let allHeroes: Hero[] = data.heroDescriptions.allHeroes;
	let towns = data.league.currentSeason.turbotowns;

	//avatar
	let avatarURL = '';
	if (data.session && data.session.user.avatar_url) {
		avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');
	}

	//build an array of all actions and completed quests
    interface FeedEntry{
        quest?: TurbotownQuest,
        action?: TurbotownAction,
        user: User
    }

	let feedEntry: FeedEntry[] = [];
	towns.forEach((town: any) => {
		town.quests.forEach((quest: any) => {
			feedEntry.push({
				quest,
				user: data.league.leagueAndSeasonsResult[0].members.filter(
					(member: any) => town.account_id === member.account_id
				)[0].user
			});
		});
		town.actions.forEach((action: any) => {
			feedEntry.push({
                action,
                user: data.league.leagueAndSeasonsResult[0].members.filter(
					(member: any) => town.account_id === member.account_id
				)[0].user
            });
		});
	});

	//sort them by date
	feedEntry.sort((a: any, b: any) => {
		if (a.endDate > b.endDate) return -1;
		else return 1;
	});

	console.log(feedEntry);

	function getHighDefSteamAvatar(inputAvatarURL: String) {
		if (inputAvatarURL) {
			return (inputAvatarURL = inputAvatarURL.replace('.jpg', '_full.jpg'));
		}
	}
</script>

<div id="feedComponent" class="w-full grid grid-cols-1 container gap-4 mt-4">
	<div class="flex h-full mx-auto w-full max-sm:mb-20">
		<div class="flex h-full mx-auto w-full max-sm:mb-20">
			<div
				class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
			>
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">TurboTown Feed</h3>
				</div>
				<div class="w-full h-full flex flex-col">
					<ul class="list">
						<!-- {#each towns as town} -->
						{#each feedEntry as action}
                            <FeedItem action={action}/>
						{/each}
						<!-- {/each} -->
					</ul>
				</div>
			</div>
		</div>
	</div>
	<!-- <div
		class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
	>
		<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
			<h3 class="h3 dark:text-yellow-500 text-primary-500">Quest Feed</h3>
		</div>
		<div class="w-full h-full flex flex-col-2">
			<ul class="list">
				{#each towns as town}
					{#each town.quests as quest}
						{#if quest.status === 'completed' && quest.win && !quest.active}
							<li>
								{#if town.user.avatar_url}
									<Avatar src={getHighDefSteamAvatar(town.user.avatar_url)} width="w-12" rounded="rounded-xl" />
								{:else}
									<i class="text-5xl fi fi-rr-mode-portrait"></i>
								{/if}

								<span class="flex">
									<p class="font-extrabold">{town.user.username}</p>
									<p class="ps-1 text-green-500">completed</p>
									<p class="ps-1">quest as</p>
									<i
										class={`d2mh hero-${
											allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].id
										} m-1 p-4`}
									></i>
									on
									<p class="font-extrabold ps-1">{dayjs(quest.random.endDate).format('lll')}</p>
									<p class="ps-1">and gained</p>
									<i class="fi fi-rr-coins text-yellow-500 ps-1">{quest.endXp}</i>
									<i class="fi fi-br-arrow-trend-up text-center text-green-500 ps-1">{quest.endXp}</i>
								</span>
							</li>
						{/if}

						{#if quest.status === 'completed' && !quest.win && !quest.active}
							<li>
								{#if town.user.avatar_url}
									<Avatar src={getHighDefSteamAvatar(town.user.avatar_url)} width="w-12" rounded="rounded-xl" />
								{:else}
									<i class="text-5xl fi fi-rr-mode-portrait"></i>
								{/if}
								<span class="flex">
									<p class="font-extrabold">{town.user.username}</p>
									<p class="ps-1 text-red-500">failed</p>
									<p class="ps-1">quest as</p>
									<i
										class={`d2mh hero-${
											allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].id
										} m-1 p-4`}
									></i>
									on
									<p class="font-extrabold ps-1">{dayjs(quest.random.endDate).format('lll')}</p>
									<p class="ps-1">and lost</p>
									<i class="fi fi-rr-coins text-yellow-500 ps-1">{quest.endXp}</i>
									<i class="fi fi-br-arrow-trend-down text-center text-red-500 ps-1">{quest.endXp}</i>
								</span>
							</li>
						{/if}
					{/each}
				{/each}
			</ul>
		</div>
	</div> -->
</div>
