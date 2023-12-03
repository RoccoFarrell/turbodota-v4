<script lang="ts">
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import turboking from '$lib/assets/turboking.png'
    import { Table } from '@skeletonlabs/skeleton';
    import type { TableSource } from '@skeletonlabs/skeleton';
    import { tableSourceValues } from '@skeletonlabs/skeleton';
    import { ProgressRadial } from '@skeletonlabs/skeleton';
    export let data: PageData;
    console.log(data)

    let promise = Promise.resolve([]);
    let tableData = [];
    let selectedHero = null;

    const heroList = [
        { id: 1, name: 'Weaver'},
        { id: 2, name: 'Marci'},
        { id: 3, name: 'Morphling'},
    ];
    
    //need to put data into array for Skeleton table
    data.matchStats.forEach(element => {
        let i = 0;
        tableData.push({
            player: element.playerName,
            games: element.heroData.totals.games,
            wins: element.heroData.totals.wins,
            losses: element.heroData.totals.losses,
            winPct: element.heroData.totals.wins/element.heroData.totals.games,
            kda: element.heroData.totals.kda,
            kills: element.heroData.totals.kills,
            deaths: element.heroData.totals.deaths,
            assists: element.heroData.totals.assists
        })
        i = i + 1;
    });
    
    const tableSimple: TableSource = {
            head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
            body: tableSourceValues(tableData)
    };

    onMount(async function () {
        promise = defaultTableLoad();
    })

    async function defaultTableLoad() {
        //nothing for now
    }

    function handleSelectChange() {
        console.log(selectedHero)
    }
    
</script>


<div class="container mx-auto p-16 space-y-8">
    <div class="flex justify-center items-center space-x-8">
        <h1 class="h1">ONLY THE TRUE KING WILL RULE</h1>
        <img class="w-32" alt="turboking" src={turboking} />
    </div>
</div>

<div class="container mx-auto p-16 space-y-8">
    <div class="flex justify-center items-center space-x-8">
        <select class="select select-sm variant-ghost-surface" bind:value={selectedHero} on:change={() => handleSelectChange(selectedHero)}>
            {#each heroList as hero}
                <option value={hero.id}>{hero.name}</option>
            {/each}
        </select>
    </div>
</div>

{#await promise}
    <ProgressRadial/>
{:then}
    <Table source={tableSimple} />
{/await}
