<script lang="ts">
	//page data

	import type { Hero, Random } from '@prisma/client'

	export let allHeroes: Hero[] = [];
	export let completedRandoms: Random[] = [];

	import { calculateKdaClasses } from '$lib/helpers/tableColors';
    import daysAgoString from '$lib/helpers/daysAgo';

	//console.log(completedRandoms);

	completedRandoms = completedRandoms.sort((a: any, b: any) => {
		if (a.endDate < b.endDate) return 1;
		else return -1;
	});
</script>

<!-- History-->
<div class="w-full flex flex-col space-y-4">
	<h2 class="h2 text-primary-500 w-full border-b border-primary-500 border-dashed py-2">History</h2>
	<div class="h-full max-h-screen overflow-scroll">
		<div class="grid md:grid-cols-6 max-sm:grid-cols-4 text-secondary-500">
			<div class="col-span-2">Hero</div>
			<div>Win or Loss</div>
			<div class="max-sm:hidden">Gold</div>
			<div class="max-sm:hidden">Lost Gold</div>
			<div>KDA</div>
		</div>
		<!-- <div class="grid md:grid-cols-6 max-sm:grid-cols-4 place-items-center"> -->
			{#each completedRandoms as random, i}
            <div class={"grid md:grid-cols-6 max-sm:grid-cols-4 place-items-center my-1 md:py-2 max-sm:py-1" + (i !== completedRandoms.length-1 ? " border-b border-tertiary-500/10":"")}>
				<!-- Hero-->
				<div class="flex flex-col w-full col-span-2 justify-start">
					<div class="flex items-center justify-start space-x-4 w-full">
						<i class={`z-50 d2mh hero-${random.randomedHero}`}></i>
						<div class="z-0 flex flex-col justify-start">
							<p class="w-full text-left text-ellipsis overflow-hidden">
								{allHeroes.filter((hero) => hero.id === random.randomedHero)[0].localized_name}
							</p>
							<p class="w-full text-left text-xs text-secondary-500/70">{daysAgoString(random.endDate)}</p>
						</div>
					</div>
				</div>

				<!-- Win or loss -->
				<div class="flex items-center space-x-2">
					{#if random.win}
						<h3 class="h3 font-bold text-green-600">W</h3>
					{:else}
						<h3 class="h3 font-bold text-red-600">L</h3>
					{/if}
				</div>
				<!-- Gold -->
				<div class="flex items-center space-x-2 max-sm:hidden">
					<div class="text-amber-500 inline font-bold">
						{random.endGold}g
						{#if !random.win}
							<p class="inline text-xs text-secondary-600">(-{random.expectedGold}g)</p>
						{/if}
					</div>
				</div>
				<!-- Lost gold -->
				<div class="flex items-center space-x-2 max-sm:hidden">
					<p class="text-red-500 inline font-bold">{random.modifierTotal}g</p>
				</div>
				<!-- KDA -->
				<div class="flex items-center space-x-2">
					{#if random.match}
						<p class={calculateKdaClasses((random.match.kills + random.match.assists) / random.match.deaths)}>
							{((random.match.kills + random.match.assists) / random.match.deaths).toFixed(2)}
						</p>
					{/if}
				</div>
            </div>
			{/each}
		<!-- </div> -->
	</div>
</div>
