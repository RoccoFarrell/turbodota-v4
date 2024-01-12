<script lang="ts">
	import { setContext, getContext } from 'svelte';
	import type { Hero } from '@prisma/client';

    export let test = 'fizzbuzz';

	let heroes: Hero[] = getContext('heroes');
	let generatedRandomHero1 = heroes[Math.floor(Math.random() * heroes.length)];
	let generatedRandomHero2 = heroes[Math.floor(Math.random() * heroes.length)];
	let generatedRandomHero3 = heroes[Math.floor(Math.random() * heroes.length)];
	console.log('random heroes:', generatedRandomHero1, generatedRandomHero2, generatedRandomHero3);

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

</script>

<div class="card w-screen flex flex-col justify-center items-center p-4">
	<div class="mb-2 bg-surface-500/10 p-4 rounded-full mx-auto shadow-md col-span-1">
		<h3 class="h3 dark:text-yellow-500 text-primary-500 text-center">Random Hero Selection</h3>

		<button class="btn variant-filled-primary" on:click={() => dispatch('heroselect', generatedRandomHero1)}
			>{generatedRandomHero1.localized_name}</button
		>
		<button class="btn variant-filled-primary" on:click={() => dispatch('heroselect', generatedRandomHero2)}
			>{generatedRandomHero2.localized_name}</button
		>
		<button class="btn variant-filled-primary" on:click={() => dispatch('heroselect', generatedRandomHero3)}
			>{generatedRandomHero3.localized_name}</button
		>
	</div>
</div>
