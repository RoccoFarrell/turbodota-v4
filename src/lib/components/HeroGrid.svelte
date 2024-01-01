<script lang="ts">
	//page data

	export let allHeroes: Hero[] = [];
	import { createEventDispatcher } from 'svelte';
	//stores
	import { randomStore } from '$lib/stores/randomStore';

	const dispatch = createEventDispatcher();

	const heroClick = (hero: Hero) => {
		dispatch('heroclick', hero);
	};
	let showHeroGrid = true;
</script>

<!-- Desktop Hero Grid -->
<div
	id="desktopHeroGrid"
	class={`z-0 flex flex-wrap max-w-[95%] p-4 max-md:hidden xs:visible justify-center overflow-y-auto w-full max-h-[50rem] ${
		showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-t-4 border-amber-500'
	}`}
>
	{#each allHeroes as hero}
		<div class="object-contain m-1 relative">
			<button on:click={() => heroClick(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
		</div>
	{/each}
</div>

<!-- Mobile Hero Grid -->
<div
	id="mobileHeroGrid"
	class={`w-full flex flex-wrap max-w-[95%] p-2 md:hidden max-md:visible justify-center overflow-y-auto max-h-96 ${
		showHeroGrid ? 'visible border border-dashed border-red-500' : 'border-double border-b-4 border-amber-500'
	}`}
>
	{#each allHeroes as hero}
		<div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
			<button on:click={() => heroClick(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
		</div>
	{/each}
</div>
