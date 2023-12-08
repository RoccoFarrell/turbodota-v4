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
    $: bannedHeroes

    const banHero = (hero: Hero) => {
        let index = bannedHeroes.indexOf(hero)
        if(index === -1){
            bannedHeroes = [...bannedHeroes, hero]
        } else {
            bannedHeroes = bannedHeroes.filter(arrHero => arrHero !== hero)
        }
        console.log(bannedHeroes)
        
    }

    interface HeroRandom {
        bannedHeroes: number[]
        selectedRoles: string[]
        startingGold: number
        expectedGold: number
        modifierAmount: number
    }

    let heroRandom: HeroRandom = {
        bannedHeroes: [],
        selectedRoles: [],
        startingGold: 100,
        expectedGold: 100,
        modifierAmount: 0    
    }

</script>

<div class="container md:m-4 my-4 h-screen">
	<div class="flex flex-col items-center text-center space-y-4 md:mx-8 mx-2">
		<h1 class="h1 text-primary-700">The Walker Random</h1>
		<div class="w-full flex flex-col mx-auto max-w-[95%] items-center">
            <!-- Show hero grid button -->
			<div
				class="w-full py-2 bg-primary-200 rounded-t-full text-primary-900 font-bold hover:-translate-y-1 max-w-[95%] shadow-lg"
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
					<div class="object-contain m-1 relative">
                        {#if bannedHeroes.indexOf(hero) !== -1}
                            <div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
                                <button on:click={() => banHero(hero)} class="w-full h-full"></button>
                            </div>
                        {/if}
                        <button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id}`}></i></button>
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
					<div class={`object-contain m-3 relative`}>
                        {#if bannedHeroes.indexOf(hero) !== -1}
                            <div class="w-full h-full bg-red-600 rounded-xl z-10 absolute bg-opacity-70">
                                <button on:click={() => banHero(hero)} class="w-full h-full"></button>
                            </div>
                        {/if}
						<button on:click={() => banHero(hero)}><i class={`z-0 d2mh hero-${hero.id} scale-150`}></i></button>
					</div>
				{/each}
			</div>
		</div>

        <!-- Modifier calculation -->
        <div class="w-full border border-orange-400 border-dashed max-w-[90%] mx-auto">
            Modifier calculations
        </div>

        <!-- Random Button-->
		<button class="btn variant-filled-primary w-full">Random me</button>
	</div>
</div>
