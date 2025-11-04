<script lang="ts">

    import { fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { getModalStore } from '@skeletonlabs/skeleton';
    import Confetti from 'svelte-confetti';
    import { DOTADECK } from '$lib/constants/dotadeck';
    interface Props {
        heroId: number;
        isWin: boolean;
        oldStats: { gold: number; xp: number };
        newStats: { gold: number; xp: number };
    }

    let {
        heroId,
        isWin,
        oldStats,
        newStats
    }: Props = $props();

    const modalStore = getModalStore();

    // Close modal after animation
    setTimeout(() => {
        modalStore.close();
    }, 5000);
</script>

<div 
    class="card p-8 flex flex-col items-center justify-center"
    transition:fade={{ duration: 200 }}
>
    {#if isWin}
        <div class="absolute inset-0 pointer-events-none">
            <Confetti
                x={[-5, 10]}
                delay={[0, 5000]}
                infinite
                duration={5000}
                amount={300}
                fallDistance="75vh"
            />
        </div>
    {/if}
    <div class="w-8 h-8 relative mx-auto">
        <i class={`d2mh hero-${heroId} scale-150`}></i>
    </div>
    
    <div class="text-center mt-4 space-y-2">
        <div class="text-yellow-400 font-bold">
            {oldStats.gold}g → {newStats.gold}g
            <span class="text-sm ml-2" in:fade={{ delay: 500, duration: 300 }}>
                ({isWin ? 'Reset' : `+${DOTADECK.LOSS_REWARD.GOLD}`})
            </span>
        </div>
        <div class="text-blue-400 font-bold">
            {oldStats.xp}xp → {newStats.xp}xp
            <span class="text-sm ml-2" in:fade={{ delay: 500, duration: 300 }}>
                ({isWin ? 'Reset' : `+${DOTADECK.LOSS_REWARD.XP}`})
            </span>
        </div>
    </div>

    <div 
        class="mt-4 text-lg font-bold"
        in:fade={{ delay: 800, duration: 300 }}
    >
        {#if isWin}
            <span class="text-green-400">Victory!</span>
        {:else}
            <span class="text-red-400">Defeat</span>
        {/if}
    </div>
</div> 