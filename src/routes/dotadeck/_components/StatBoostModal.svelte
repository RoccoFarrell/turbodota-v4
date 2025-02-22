<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    export let heroId: number;
    export let oldStats: { gold: number; xp: number };
    export let newStats: { gold: number; xp: number };
</script>

<div
    class="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
    transition:fade={{ duration: 200 }}
>
    <div 
        class="bg-surface-800 p-6 rounded-lg shadow-xl border-2 border-surface-700 flex flex-col items-center gap-4"
        transition:fly={{ y: 20, duration: 300 }}
    >
        <i class={`d2mh hero-${heroId} scale-200`}></i>
        
        <div class="flex gap-8 text-lg font-bold">
            <div class="flex flex-col items-center">
                <div class="text-yellow-400">{oldStats.gold}g</div>
                <div class="text-green-400 animate-fly-up">+10g</div>
                <div class="text-yellow-400">{newStats.gold}g</div>
            </div>
            <div class="flex flex-col items-center">
                <div class="text-blue-400">{oldStats.xp}xp</div>
                <div class="text-green-400 animate-fly-up">+10xp</div>
                <div class="text-blue-400">{newStats.xp}xp</div>
            </div>
        </div>
    </div>
</div> 