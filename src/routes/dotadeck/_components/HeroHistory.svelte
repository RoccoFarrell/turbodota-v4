<script lang="ts">
    import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';
    import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
    import { heroPoolStore } from '$lib/stores/heroPoolStore';
    import { DOTADECK } from '$lib/constants/dotadeck';

    export let selectedHeroId: number | null = null;
    
    $: history = selectedHeroId ? 
        $cardHistoryStore[selectedHeroId] || [] : 
        [];

    $: selectedHeroName = selectedHeroId ? 
        $heroPoolStore.allHeroes.find(h => h.id === selectedHeroId)?.localized_name : 
        null;

    // Group history entries by timestamp to handle multiple charms on the same match
    $: groupedHistory = history.reduce((groups, entry) => {
        const timestamp = new Date(entry.timestamp).getTime();
        if (!groups[timestamp]) {
            groups[timestamp] = [];
        }
        groups[timestamp].push(entry);
        return groups;
    }, {} as Record<number, CardHistoryEntry[]>);

    // Sort timestamps in descending order
    $: sortedTimestamps = Object.keys(groupedHistory).map(Number).sort((a, b) => b - a);

    // Helper function to format charm effects
    function formatCharmEffect(entry: CardHistoryEntry): string {
        if (entry.modType === 'MODIFY' && entry.charmEffects?.length) {
            const effects = entry.charmEffects.map(ce => {
                const parts = [];
                if (ce.goldMod > 0) {
                    parts.push(`+${ce.goldMod}g`);
                }
                if (ce.xpMod > 0) {
                    parts.push(`+${ce.xpMod}xp`);
                }
                return `${parts.join('/')} (${ce.itemName})`;
            });
            return effects.join(' / ');
        }
        return '';
    }

    // Format combined stats for a group of entries
    function formatCombinedStats(entries: CardHistoryEntry[]): string {
        const mainEntry = getMainEntry(entries);
        
        // For non-QUEST actions, just return the main entry stats
        if (mainEntry.action !== 'QUEST_WIN' && mainEntry.action !== 'QUEST_LOSS') {
            if (mainEntry.action === 'DISCARDED') {
                return `+${DOTADECK.DISCARD_BONUS.GOLD}g/+${DOTADECK.DISCARD_BONUS.XP}xp`;
            }
            return '';
        }
        
        // For QUEST actions, combine the stats
        let result = '';
        
        // Add the main stats
        if (mainEntry.action === 'QUEST_WIN') {
            // Show user earnings (gold and XP earned)
            result = `User earned: +${mainEntry.goldMod || 0}g/+${mainEntry.xpMod || 0}xp`;
            
            // Add card reset information
            result += ` | Card reset to 100/100`;
        } else if (mainEntry.action === 'QUEST_LOSS') {
            // Show card modifications (gold and XP lost)
            result = `Card modified: +${Math.abs(mainEntry.goldMod || 0)}g/+${Math.abs(mainEntry.xpMod || 0)}xp`;
        }
        
        return result;
    }

    // Format the calculation details for an entry
    function formatCalculationDetails(entry: CardHistoryEntry): string {
        if (entry.action !== 'QUEST_WIN' && entry.action !== 'QUEST_LOSS') {
            return '';
        }
        
        let result = '';
        
        // Base values - different for QUEST_WIN vs QUEST_LOSS
        const baseGold = entry.action === 'QUEST_WIN' ? 100 : DOTADECK.LOSS_REWARD.GOLD;
        const baseXP = entry.action === 'QUEST_WIN' ? 100 : DOTADECK.LOSS_REWARD.XP;
        
        // Calculate multipliers from charm effects
        let goldMultiplier = 1;
        let xpMultiplier = 1;
        
        if (entry.charmEffects?.length) {
            entry.charmEffects.forEach(ce => {
                if (ce.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER) {
                    goldMultiplier = ce.effectValue;
                } else if (ce.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER) {
                    xpMultiplier = ce.effectValue;
                }
            });
        }
        
        // Calculate final values
        const finalGold = Math.round(baseGold * goldMultiplier);
        const finalXP = Math.round(baseXP * xpMultiplier);
        
        // Format the calculation
        if (entry.action === 'QUEST_WIN') {
            result = `Base: 100g/100xp`;
            if (goldMultiplier > 1 || xpMultiplier > 1) {
                result += ` × (${goldMultiplier > 1 ? `${goldMultiplier}x gold` : ''}${goldMultiplier > 1 && xpMultiplier > 1 ? ', ' : ''}${xpMultiplier > 1 ? `${xpMultiplier}x xp` : ''})`;
            }
            result += ` = ${finalGold}g/${finalXP}xp`;
        } else if (entry.action === 'QUEST_LOSS') {
            result = `Base: ${baseGold}g/${baseXP}xp`;
            if (goldMultiplier > 1 || xpMultiplier > 1) {
                result += ` × (${goldMultiplier > 1 ? `${goldMultiplier}x gold` : ''}${goldMultiplier > 1 && xpMultiplier > 1 ? ', ' : ''}${xpMultiplier > 1 ? `${xpMultiplier}x xp` : ''})`;
            }
            result += ` = ${finalGold}g/${finalXP}xp`;
        }
        
        return result;
    }

    // Get the main entry from a group (non-MODIFY entry)
    function getMainEntry(entries: CardHistoryEntry[]): CardHistoryEntry {
        return entries.find(e => e.modType !== 'MODIFY') || entries[0];
    }

    // Get all charm effect entries from a group
    function getCharmEntries(entries: CardHistoryEntry[]): CardHistoryEntry[] {
        return entries.filter(e => e.modType === 'MODIFY' && e.charmEffects?.length);
    }
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
                <div class="card p-2 variant-ghost-surface">
                    <div class="text-center">
                        <div class="text-sm text-surface-300">Total Modifications</div>
                        <div class="flex justify-center gap-2 mt-1">
                            <span class="text-yellow-400">{history.filter(e => e.action !== 'QUEST_WIN').reduce((sum, entry) => sum + (entry.goldMod || 0), 0)}g</span>
                            <span class="text-blue-400">{history.filter(e => e.action !== 'QUEST_WIN').reduce((sum, entry) => sum + (entry.xpMod || 0), 0)}xp</span>
                        </div>
                    </div>
                </div>
                <div class="card p-2 variant-ghost-surface">
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
                {#each sortedTimestamps as timestamp}
                    {@const entries = groupedHistory[timestamp]}
                    {@const mainEntry = getMainEntry(entries)}
                    <div class="flex flex-col p-2 bg-surface-700/30 rounded">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-sm">
                                    {#if mainEntry.action === 'QUEST_WIN'}
                                        <span class="text-green-400">Victory</span>
                                    {:else if mainEntry.action === 'QUEST_LOSS'}
                                        <span class="text-red-400">Defeat</span>
                                    {:else if mainEntry.action === 'DISCARDED'}
                                        <span class="text-amber-400">Discarded</span>
                                    {:else if mainEntry.action === 'DRAWN'}
                                        <span class="text-blue-400">Drawn</span>
                                    {/if}
                                </span>
                                <span class="text-xs text-surface-400">by {mainEntry.username}</span>
                            </div>
                            <div class="text-yellow-400">
                                {formatCombinedStats(entries)}
                            </div>
                        </div>
                        
                        {#if mainEntry.action === 'QUEST_WIN' || mainEntry.action === 'QUEST_LOSS'}
                            <div class="mt-1 text-xs text-surface-400">
                                {formatCalculationDetails(mainEntry)}
                            </div>
                            
                            {#if mainEntry.charmEffects?.length}
                                <div class="mt-1 flex gap-2 flex-wrap">
                                    {#each mainEntry.charmEffects as charm}
                                        <div class="flex items-center gap-1 px-2 py-1 rounded bg-surface-700/50">
                                            {#if charm.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER}
                                                <i class="fi fi-rr-coins text-yellow-400"></i>
                                                <span class="text-yellow-400 text-xs">{charm.effectValue}x Gold</span>
                                            {:else if charm.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER}
                                                <i class="fi fi-rr-star text-blue-400"></i>
                                                <span class="text-blue-400 text-xs">{charm.effectValue}x XP</span>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        {/if}
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