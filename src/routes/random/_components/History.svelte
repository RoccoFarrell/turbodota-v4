<script lang="ts">
    //page data

    export let allHeroes: Hero[] = []
    export let completedRandoms: Random[] = []
</script>

<!-- History-->
<div class="w-full flex flex-col space-y-4">
    <h2 class="h2 text-primary-500 w-full border-b border-primary-500 border-dashed py-2">History</h2>
    <div class="h-full">
        <div class="grid grid-cols-5 text-secondary-500">
            <div class="col-span-2">Hero</div>
            <div>Win or Loss</div>
            <div>Gold</div>
            <div>Lost Gold</div>
        </div>
        <div class="grid grid-cols-5 place-items-center">
            {#each completedRandoms as random}
                <!-- Hero-->
                <div class="flex items-center justify-start space-x-2 w-full col-span-2">
                    <i class={`z-0 d2mh hero-${random.randomedHero}`}></i>
                    <p class="inline text-ellipsis overflow-hidden">
                        {allHeroes.filter((hero) => hero.id === random.randomedHero)[0]
                            .localized_name}
                    </p>
                </div>
                <!-- Win or loss -->
                <div class="flex items-center space-x-2">
                    {#if random.win}
                        <h2 class="h2 text-green-600">W</h2>
                    {:else}
                        <h2 class="h2 text-red-600">L</h2>
                    {/if}
                </div>
                <!-- Gold -->
                <div class="flex items-center space-x-2">
                    <div class="text-amber-500 inline font-bold">
                        {random.endGold}g
                        {#if !random.win}
                            <p class="inline text-xs text-secondary-600">(-{random.expectedGold}g)</p>
                        {/if}
                    </div>
                </div>
                <!-- Lost gold -->
                <div class="flex items-center space-x-2">
                    <p class="text-red-500 inline font-bold">{random.modifierTotal}g</p>
                </div>
            {/each}
        </div>
    </div>
</div>