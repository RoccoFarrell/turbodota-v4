<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { DOTADECK } from '$lib/constants/dotadeck';
    import { getModalStore } from '@skeletonlabs/skeleton';
    import type { StatBoostData } from '$lib/types/dotadeck';
    const modalStore = getModalStore();

    export let data: StatBoostData;

    const goldDiff = data.newStats.gold - data.oldStats.gold;
    const xpDiff = data.newStats.xp - data.oldStats.xp;

    $: message = `Discarded! +${DOTADECK.DISCARD_BONUS.GOLD}g/+${DOTADECK.DISCARD_BONUS.XP}xp`;
</script>

<div
    class="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
    transition:fade={{ duration: 200 }}
>
    <div 
        class="bg-surface-800 p-6 rounded-lg shadow-xl border-2 border-surface-700 flex flex-col items-center gap-4"
        transition:fly={{ y: 20, duration: 300 }}
    >
        <i class={`d2mh hero-${data.heroId} scale-200`}></i>
        
        <div class="flex gap-8 text-lg font-bold">
            <div class="flex flex-col items-center">
                <div class="text-yellow-400">{data.oldStats.gold}g</div>
                <div class="text-green-400 animate-fly-up">+{DOTADECK.DISCARD_BONUS.GOLD}g</div>
                <div class="text-yellow-400">{data.newStats.gold}g</div>
            </div>
            <div class="flex flex-col items-center">
                <div class="text-blue-400">{data.oldStats.xp}xp</div>
                <div class="text-green-400 animate-fly-up">+{DOTADECK.DISCARD_BONUS.XP}xp</div>
                <div class="text-blue-400">{data.newStats.xp}xp</div>
            </div>
        </div>
    </div>
</div> 