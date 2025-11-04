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
	import type { DateTimeDuration } from '@internationalized/date';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();
	console.log('data in feed: ', data);
	let allHeroes: Hero[] = data.heroDescriptions.allHeroes;
	let towns = data.league.currentSeason.turbotowns;

	//avatar
	let avatarURL = '';
	if (data.session && data.session.user.avatar_url) {
		avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');
	}

	//build an array of all actions and completed quests
	interface FeedEntry {
		quest?: TurbotownQuest;
		action?: TurbotownAction;
		heroes?: Number[];
		startDate: Date;
		endDate?: Date;
		type: String;
		user: User;
	}

	let feedEntry: FeedEntry[] = [];
	towns.forEach((town: any) => {
		let townUser = data.league.leagueAndSeasonsResult[0].members.filter(
			(member: any) => town.account_id === member.account_id
		)[0].user;

		//sort them by date
		let allQuests = town.quests.sort((a: any, b: any) => {
			if (a.endDate && b.endDate) {
				if (a.endDate > b.endDate) return 1;
				else return -1;
			} else if (a.endDate) {
				if (a.endDate > b.startDate) return 1;
				else return -1;
			} else if (b.endDate) {
				if (a.startDate > b.startDate) return 1;
				else return -1;
			} else {
				if (a.startDate > b.startDate) return 1;
				else return -1;
			}
		});

        //console.log("allQuests: ", allQuests)

		let activeQuests = allQuests.filter((quest: any) => quest.active);

		activeQuests = activeQuests.sort((a: any, b: any) => {
			if (a.createdDate > b.createdDate) return 1;
			else return -1;
		});

		let activeGroup = {
			type: 'activeQuestGroup',
			heroes: activeQuests.map((quest: any) => quest.random.randomedHero),
			startDate: allQuests[0].endDate ? allQuests[0].endDate : allQuests[0].createdDate,
			user: townUser
		};

		feedEntry.push(activeGroup);
		let inactiveQuests = allQuests.filter((quest: any) => !quest.active);

		inactiveQuests.forEach((quest: any) => {
			feedEntry.push({
				type: 'quest',
				quest,
				startDate: quest.createdDate,
				endDate: quest.endDate,
				user: townUser
			});
		});
		town.actions.forEach((action: any) => {
			feedEntry.push({
				type: 'action',
				action,
				startDate: action.appliedDate,
				endDate: action.endDate,
				user: townUser
			});
		});
	});

	//sort them by date
	feedEntry.sort((a: any, b: any) => {
		if (a.endDate && b.endDate) {
			if (a.endDate > b.endDate) return -1;
			else return 1;
		} else if (a.endDate) {
			if (a.endDate > b.startDate) return -1;
			else return 1;
		} else if (b.endDate) {
			if (a.startDate > b.startDate) return -1;
			else return 1;
		} else {
			if (a.startDate > b.startDate) return -1;
			else return 1;
		}
	});

	console.log(feedEntry);

	function getHighDefSteamAvatar(inputAvatarURL: String) {
		if (inputAvatarURL) {
			return (inputAvatarURL = inputAvatarURL.replace('.jpg', '_full.jpg'));
		}
	}
</script>

<div id="feedComponent" class="w-full flex flex-col container mt-4">
	<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md h-fit">
		<h3 class="h3 dark:text-yellow-500 text-primary-500 text-center">TurboTown Feed</h3>
	</div>
	<div class="flex h-full mx-auto w-full max-sm:mb-20">
		<div class="flex h-full mx-auto w-full max-sm:mb-20">
			<div
				class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
			>
				<div class="w-full h-full flex flex-col">
					<ul class="list">
						<!-- {#each towns as town} -->
						{#each feedEntry as action, i}
							{#if i<100}
								<FeedItem {action} items={data.items} />
							{/if}
							<!-- {#if dayjs(action.startDate).get('day') !== dayjs(feedEntry[i-1].startDate).get('day')}
								<div>test</div>
							{/if} -->
						{/each}
						<!-- {/each} -->
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
