<script lang="ts">
	//assets
	import Shopkeeper from '$lib/assets/shopkeeper.png';

	//prisma
	import type { Hero, Season, Turbotown } from '@prisma/client';
	import { Avatar, CodeBlock } from '@skeletonlabs/skeleton';

	//dayjs
	import dayjs from 'dayjs';
	import LocalizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(LocalizedFormat);

	export let data: any;
	let allHeroes: Hero[] = data.heroDescriptions.allHeroes;
	let towns = data.league.currentSeason.turbotowns;

	//avatar
	let avatarURL = '';
	if (data.session && data.session.user.avatar_url) {
		avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');
	}

	function getHighDefSteamAvatar(inputAvatarURL: String) {
		if (inputAvatarURL) {
			return (inputAvatarURL = inputAvatarURL.replace('.jpg', '_full.jpg'));
		}
	}
</script>

<div id="shopComponent" class="w-full grid grid-cols-2 container gap-4">
	<div class="flex h-full mx-auto w-full max-sm:mb-20">
		<div class="flex h-full mx-auto w-full max-sm:mb-20">
			<div
				class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
			>
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Feed</h3>
				</div>
				<div class="w-full h-full flex flex-col">
					<ul class="list">
						{#each towns as town}
							{#each town.TurbotownAction as action}
								{#if action.action === 'observer'}
									<li>
										{#if town.user.avatar_url}
											<Avatar src={getHighDefSteamAvatar(town.user.avatar_url)} width="w-12" rounded="rounded-xl" />
										{:else}
											<i class="text-5xl fi fi-rr-mode-portrait"></i>
										{/if}

										<span class="flex"
											>{town.user.username} used {action.action} to select
											<i class={`d2mh hero-${allHeroes.filter((hero) => hero.id === parseInt(action.value))[0].id} m-1 p-4`}
											></i>
											on {dayjs(action.appliedDate).format('lll')}</span
										>
									</li>
								{/if}
								{#if action.action === 'quelling blade'}
									<li>
										{#if town.user.avatar_url}
											<Avatar src={getHighDefSteamAvatar(town.user.avatar_url)} width="w-12" rounded="rounded-xl" />
										{:else}
											<i class="text-5xl fi fi-rr-mode-portrait"></i>
										{/if}
										<span class="flex self-auto"
											>{town.user.username} used {action.action} to chop
											<i class={`d2mh hero-${allHeroes.filter((hero) => hero.id === parseInt(action.value))[0].id} m-1 p-4`}
											></i>
											on {dayjs(action.appliedDate).format('lll')}
										</span>
									</li>
								{/if}
								{#if action.action === 'linkens'}
									<li>
										{#if town.user.avatar_url}
											<Avatar src={getHighDefSteamAvatar(town.user.avatar_url)} width="w-12" rounded="rounded-xl" />
										{:else}
											<i class="text-5xl fi fi-rr-mode-portrait"></i>
										{/if}
										<span class="flex"
											>{town.user.username} used {action.action} to protect placeholder on {dayjs(
												action.appliedDate
											).format('lll')}</span
										>
									</li>
								{/if}
							{/each}
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
	<div
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
								<span class="flex"
									>{town.user.username} completed quest as
									<i class={`d2mh hero-${allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].id} m-1 p-4`}></i>
									on {dayjs(quest.random.endDate).format('lll')}
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
								<span class="flex"
									>{town.user.username} failed quest as
									<i class={`d2mh hero-${allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].id} m-1 p-4`}></i>
									on {dayjs(quest.random.endDate).format('lll')}
								</span>
							</li>
						{/if}
					{/each}
				{/each}
			</ul>
		</div>
	</div>
</div>

<div class="grid grid-cols-2 gap-8"></div>
