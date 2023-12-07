<script lang="ts">
	//page data
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);
</script>

<div class="container m-4">
    <div class="flex flex-col items-center text-center space-y-4 mx-8">
        <h1 class="h1 text-primary-700">The Walker Random</h1>
        <div class="border border-dashed border-red-500 max-w-[95%] p-4">
            {#each data.heroDescriptions.allHeroes as hero}
                <i class={`d2mh hero-${hero.id}`}></i>
            {/each}
        </div>
        <button class="button-base-styles">Random me</button>
    </div>
</div>
