<script lang="ts">
	//page data
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);

	$: showHeroGrid = true;
</script>

<div class="container md:m-4 my-4">
	<div class="flex flex-col items-center text-center space-y-4 md:mx-8 mx-2">
		<h1 class="h1 text-primary-700">The Walker Random</h1>
		<div class="flex flex-col mx-auto max-w-[95%] items-center">
			<div
				class="bg-primary-200 w-full rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%]"
			>
				Show Hero Ban Grid
			</div>
			<!-- Desktop -->
			<div
				class={`flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-4 max-md:hidden xs:visible justify-center ${showHeroGrid ? "visible": "hidden"}`}
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class="object-contain m-1">
						<i class={`d2mh hero-${hero.id}`}></i>
					</div>
				{/each}
			</div>
			<!-- Mobile -->
			<div
				class="flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-2 md:hidden max-md:visible justify-center"
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class="object-contain m-3">
						<i class={`d2mh hero-${hero.id} scale-150`}></i>
					</div>
				{/each}
			</div>
		</div>

		<button class="button-base-stylesbra">Random me</button>
	</div>
</div>
