<script lang="ts">
    import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';
    import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
    import { heroPoolStore } from '$lib/stores/heroPoolStore';

    interface Props {
        selectedHeroId?: number | null;
    }

    let { selectedHeroId = null }: Props = $props();
    
    let history = $derived(selectedHeroId ? 
        $cardHistoryStore[selectedHeroId] || [] : 
        []);

    let selectedHeroName = $derived(selectedHeroId ? 
        $heroPoolStore.allHeroes.find(h => h.id === selectedHeroId)?.localized_name : 
        null);
</script>

<div class="w-full bg-surface-800/50 rounded-lg border border-surface-700/50 p-4">
    <div class="flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-primary-500">
                Hero History
                {#if selectedHeroName}
                    <span class="text-yellow-400 ml-2 mx-auto">{selectedHeroName}</span>
                {/if}
            </h2>
        </div>
        {#if selectedHeroId && history.length > 0}
            <div class="grid grid-cols-2 gap-4">
                <div class="card p-2 preset-tonal-surface border border-surface-500">
                    <div class="text-center">
                        <div class="text-sm text-surface-300">Total Modifications</div>
                        <div class="flex justify-center gap-2 mt-1">
                            <span class="text-yellow-400">{history.filter(e => e.action !== 'QUEST_WIN').reduce((sum, entry) => sum + (entry.goldMod || 0), 0)}g</span>
                            <span class="text-blue-400">{history.filter(e => e.action !== 'QUEST_WIN').reduce((sum, entry) => sum + (entry.xpMod || 0), 0)}xp</span>
                        </div>
                    </div>
                </div>
                <div class="card p-2 preset-tonal-surface border border-surface-500">
                    <div class="text-center">
                        <div class="text-sm text-surface-300">Quest Wins</div>
                        <div class="flex justify-center gap-2 mt-1">
                            <span class="text-yellow-400">{history.filter(e => e.action === 'QUEST_WIN').reduce((sum, entry) => sum + (entry.goldMod || 0), 0)}g</span>
                            <span class="text-blue-400">{history.filter(e => e.action === 'QUEST_WIN').reduce((sum, entry) => sum + (entry.xpMod || 0), 0)}xp</span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    {#if selectedHeroId}
        {#if history.length > 0}
            <div class="space-y-2">
                {#each history as entry}
                    <div class="flex items-center justify-between p-2 bg-surface-700/30 rounded">
                        <div class="flex items-center gap-2">
                            <span class="text-sm">
                                {#if entry.action === 'QUEST_WIN'}
                                    <span class="text-green-400">Victory</span>
                                {:else if entry.action === 'QUEST_LOSS'}
                                    <span class="text-red-400">Defeat</span>
                                {:else if entry.action === 'DISCARDED'}
                                    <span class="text-amber-400">Discarded</span>
                                {:else if entry.action === 'DRAWN'}
                                    <span class="text-blue-400">Drawn</span>
                                {/if}
                            </span>
                            <span class="text-xs text-surface-400">by {entry.username}</span>
                        </div>
                        <div class="flex gap-2 text-sm">
                            <span class="text-yellow-400">{(entry.goldMod ?? 0) > 0 ? '+' : ''}{entry.goldMod ?? 0}g</span>
                            <span class="text-blue-400">{(entry.xpMod ?? 0) > 0 ? '+' : ''}{entry.xpMod ?? 0}xp</span>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-center text-surface-400">No history for this hero</p>
        {/if}
    {:else}
        <p class="text-center text-surface-400">Select a hero to view its history</p>
    {/if}
</div> 