<script lang="ts">
    //assets
	import Shopkeeper from '$lib/assets/shopkeeper.png';

    //prisma
	import type { Hero, Season, Turbotown } from '@prisma/client';

    //dayjs
    import dayjs from 'dayjs';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
    dayjs.extend(LocalizedFormat)

	export let data: any;
    let allHeroes: Hero[] = data.heroDescriptions.allHeroes;
	let towns = data.league.currentSeason.turbotowns;

</script>

<div class="grid grid-cols-2 gap-8">
	<div class="w-full h-full flex flex-col">
		<h1>Items</h1>
		{#each towns as town}
			{#each town.TurbotownAction as action}
				{#if action.action === 'observer'}
					<p>{town.user.username} used {action.action} to select hero {allHeroes.filter((hero) => hero.id === parseInt(action.value))[0].localized_name} on {dayjs(action.appliedDate).format('LLLL')}</p>
				{/if}
                {#if action.action === 'quelling blade'}
					<p>{town.user.username} used {action.action} to chop hero {allHeroes.filter((hero) => hero.id === parseInt(action.value))[0].localized_name} on {dayjs(action.appliedDate).format('LLLL')}</p>
				{/if}
                {#if action.action === 'linkens'}
					<p>{town.user.username} used {action.action} to protect placeholder on {dayjs(action.appliedDate).format('LLLL')}</p>
				{/if}
			{/each}
		{/each}
	</div>

	<div class="w-full h-full flex flex-col">
		<h1>Quests</h1>
		{#each towns as town}
			{#each town.quests as quest}
				{#if quest.status === 'completed' && quest.win && !quest.active}
					<p>{town.user.username} completed quest as {allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].localized_name} on {dayjs(quest.random.endDate).format('LLLL')}</p>
				{/if}

				{#if quest.status === 'completed' && !quest.win && !quest.active}
					<p>{town.user.username} failed quest as {allHeroes.filter((hero) => hero.id === quest.random.randomedHero)[0].localized_name} on {dayjs(quest.random.endDate).format('LLLL')}</p>
				{/if}
			{/each}
		{/each}
	</div>
</div>
