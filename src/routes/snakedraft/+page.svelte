<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
    import HeroGrid from '$lib/components/HeroGrid.svelte';

	const onNext = (hero: Hero) => {
		console.log(hero);
	};
</script>

<div><div class="my-4"><HeroGrid on:heroclick={onNext} allHeroes={data.heroDescriptions.allHeroes} /></div></div>
