<script lang="ts">
	//page data

	export let allHeroes: Hero[] = [];

	import { calculateKdaClasses } from '$lib/helpers/tableColors';
	import daysAgoString from '$lib/helpers/daysAgo';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    
    const test = (hero: Hero) => {
       dispatch('heroclick', hero);
       //console.log(hero)
	};
    
</script>

<!-- Desktop Hero Grid -->
<div
	id="desktopHeroGrid"
	class={`z-0 flex flex-wrap max-w-[95%] p-4 max-md:hidden xs:visible justify-center overflow-y-auto w-full max-h-[50rem] ${'visible border border-dashed border-red-500'}`}
>
	{#each allHeroes as hero}
		<div class="object-contain m-1 relative">
			<button on:click={() => test(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
		</div>
	{/each}
</div>
