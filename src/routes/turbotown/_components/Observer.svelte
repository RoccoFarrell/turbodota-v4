<script lang="ts">
	import { setContext, getContext, onMount } from 'svelte';
	import type { Hero } from '@prisma/client';
	import type { SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';

	import { ListBox, ListBoxItem, getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	let heroes: Hero[] = getContext('heroes');
	let randomHeroList: Array<Hero> = new Array<Hero>();

	let generatedRandomHero1 = heroes[Math.floor(Math.random() * heroes.length)];
	let generatedRandomHero2 = heroes[Math.floor(Math.random() * heroes.length)];
	let generatedRandomHero3 = heroes[Math.floor(Math.random() * heroes.length)];
	console.log('random heroes:', generatedRandomHero1, generatedRandomHero2, generatedRandomHero3);

	randomHeroList.push(generatedRandomHero1);
	randomHeroList.push(generatedRandomHero2);
	randomHeroList.push(generatedRandomHero3);

	//$: console.log('rhl: ', randomHeroList);
	let randomHeroSelect: Hero;
	// Handle Form Submission
	function onFormSubmit(inputHeroSelect: Hero): void {
		randomHeroSelect = inputHeroSelect;
		if ($modalStore[0].response) $modalStore[0].response(inputHeroSelect);
		modalStore.close();
	}

	//console.log(randomHeroList);
</script>

<form method="POST" class="" action="/turbotown?/useItem" use:enhance>
	<input type="hidden" name="observerSelect" value={JSON.stringify(randomHeroSelect)} />
	<div id="observerModal" class="h1 card w-screen flex flex-col justify-center items-center p-4">
		Select Your Random Hero!
		<div class="w-[70%] h-full grid grid-cols-3 mx-auto max-h-[755%] my-8">
			{#each randomHeroList as hero, i}
				<div class="flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full">
					<h2 class="h2 animate-pulse text-amber-600">
						{hero.localized_name}
					</h2>
					<i class={`d2mh hero-${hero.id} scale-[3] m-12`}></i>

					<div class="flex items-center justify-center">
						<button class="btn variant-filled-primary w-full" on:click={() => onFormSubmit(hero)}>
							<div class="italic">Select</div></button
						>
					</div>
				</div>
			{/each}
		</div>
	</div>
</form>

<!-- <div class="card w-screen flex flex-col justify-center items-center p-4">
	<div class="mb-2 bg-surface-500/10 p-4 rounded-full mx-auto shadow-md col-span-1">
		<h3 class="h3 dark:text-yellow-500 text-primary-500 text-center">Random Hero Selection</h3>

		<button class="btn variant-filled-primary" on:click={() => onFormSubmit(generatedRandomHero1)}
			>{generatedRandomHero1.localized_name}</button
		>
		<button class="btn variant-filled-primary" on:click={() => onFormSubmit(generatedRandomHero2)}
			>{generatedRandomHero2.localized_name}</button
		>
		<button class="btn variant-filled-primary" on:click={() => onFormSubmit(generatedRandomHero3)}
			>{generatedRandomHero3.localized_name}</button
		>
	</div>
</div> -->
