<script lang="ts">
	import type { PageData } from './$types';
	import type { League } from '@prisma/client';
	export let data: PageData;
	import HeroGrid from '$lib/components/HeroGrid.svelte';

	//console.log(data.leagues);

	const onNext = (hero: Hero) => {
		console.log(hero);
	};

	data.leagues.forEach((element) => {
		console.log(element.members);
	});
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div>
		<div class="my-4"><HeroGrid on:heroclick={onNext} allHeroes={data.heroDescriptions.allHeroes} /></div>
	</div>
	
	{#each data.leagues[0].members as member}
		<div class="mb-2 bg-surface-500/10 p-4 w-4/5 mx-auto shadow-md">
			<h3 class="h3 dark:text-yellow-500 text-primary-500">{member.account_id}</h3>
			<p class="text-xs">Next turn in: 4 picks</p>
		</div>
	{/each}
</div>
