<script lang="ts">
    import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
    import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';
    import { DOTADECK } from '$lib/constants/dotadeck';

    interface Props {
        heroId: number;
        x: number;
        y: number;
    }

    let { heroId, x, y }: Props = $props();

    // Calculate if tooltip should appear on left side (if mouse is in rightmost 300px of screen)
    let showOnLeft = $derived(x > window.innerWidth - 300);

    let history = $derived($cardHistoryStore[heroId] || []);

    //$: console.log("history in card history tooltip", history);
    
    function formatStats(entry: CardHistoryEntry): string {
        if (entry.action === 'QUEST_WIN') return 'Reset to 100/100';
        if (entry.action === 'QUEST_LOSS') return `+${DOTADECK.LOSS_REWARD.GOLD}g/+${DOTADECK.LOSS_REWARD.XP}xp`;
        if (entry.action === 'DISCARDED') return `+${DOTADECK.DISCARD_BONUS.GOLD}g/+${DOTADECK.DISCARD_BONUS.XP}xp`;
        return '';
    }
</script>

<div 
    class="absolute z-50 bg-surface-900/95 border border-surface-700 rounded-lg p-4 shadow-xl w-72"
    style="left: {showOnLeft ? x - 292 : x + 20}px; top: {y}px;"
>
    {#if history.length === 0}
        <p class="text-xs text-center text-surface-400">No history yet</p>
    {:else}
        <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {#each history as entry}
                <div class="flex flex-col gap-1 p-2 rounded bg-surface-800/50">
                    <div class="flex items-center justify-between">
                        <span class="font-mono text-xs opacity-70">
                            {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span class={entry.action === 'QUEST_WIN' ? 'text-green-400' : 
                                   entry.action === 'QUEST_LOSS' ? 'text-red-400' : 
                                   entry.action === 'DRAWN' ? 'text-blue-400' : 
                                   'text-yellow-400'}>
                            {entry.action}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold">
                            {entry.username}
                        </span>
                        <span class="text-xs opacity-70">
                            {formatStats(entry)}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div> 