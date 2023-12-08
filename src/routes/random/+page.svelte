<script lang="ts">
	//page data
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data);

	$: showHeroGrid = true;

	const handleCollapseHeroGrid = () => {
		showHeroGrid = !showHeroGrid;
	};

    let bannedHeroes: Hero[] = [];

    const banHero = (hero: Hero) => {
        //console.log(bannedHeroes)
        if(bannedHeroes.indexOf(hero) === -1){
            bannedHeroes.push(hero)
        } else console.log("already in")
    }

    
</script>

<div class="container md:m-4 my-4 h-screen">
	<div class="flex flex-col items-center text-center space-y-4 md:mx-8 mx-2">
		<h1 class="h1 text-primary-700">The Walker Random</h1>
		<div class="w-full flex flex-col mx-auto max-w-[95%] items-center">
			<div
				class="w-full py-2 bg-primary-200 rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%]"
			>
				<button class="w-full" on:click={handleCollapseHeroGrid}> Show Hero Ban Grid </button>
			</div>
			<!-- Desktop -->
			<div
				class={`flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-4 max-md:hidden xs:visible justify-center ${
					showHeroGrid ? 'visible' : 'hidden'
				}`}
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class="object-contain m-1">
                        <button><i class={`d2mh hero-${hero.id}`}></i></button>
						
					</div>
				{/each}
			</div>
			<!-- Mobile -->
			<div
				class={`w-full flex flex-wrap border border-dashed border-red-500 max-w-[95%] p-2 md:hidden max-md:visible justify-center overflow-y-auto max-h-96 ${
					showHeroGrid ? 'visible' : 'hidden'
				}`}
			>
				{#each data.heroDescriptions.allHeroes as hero}
					<div class={`object-contain m-3`}>
						<button on:click={() => banHero(hero)}><i class={`d2mh hero-${hero.id} scale-150 ${bannedHeroes.indexOf(hero) !== -1 ? "bg-opacity-10" : ""}`}></i></button>
					</div>
				{/each}
			</div>
		</div>

		<button class="btn variant-filled-primary w-full">Random me</button>
	</div>
</div>
