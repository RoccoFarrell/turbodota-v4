<script lang="ts">
    import { cardHistoryStore } from '$lib/stores/cardHistoryStore';
    import type { CardHistoryEntry } from '$lib/stores/cardHistoryStore';
    import { DOTADECK } from '$lib/constants/dotadeck';

    export let heroId: number;
    export let x: number;
    export let y: number;

    // Calculate if tooltip should appear on left side (if mouse is in rightmost 300px of screen)
    $: showOnLeft = x > window.innerWidth - 300;

    $: history = $cardHistoryStore[heroId] || [];

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
    
    function formatStats(entry: CardHistoryEntry): string {
        // Handle charm effects
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
        
        // Handle regular actions
        if (entry.action === 'QUEST_WIN') return 'Reset to 100/100';
        if (entry.action === 'QUEST_LOSS') return `+${DOTADECK.LOSS_REWARD.GOLD}g/+${DOTADECK.LOSS_REWARD.XP}xp`;
        if (entry.action === 'DISCARDED') return `+${DOTADECK.DISCARD_BONUS.GOLD}g/+${DOTADECK.DISCARD_BONUS.XP}xp`;
        
        // Handle other cases with gold/xp mods
        const goldMod = entry.goldMod ?? 0;
        const xpMod = entry.xpMod ?? 0;
        
        if (goldMod === 0 && xpMod === 0) return '';
        
        return `${goldMod > 0 ? '+' : ''}${goldMod}g / ${xpMod > 0 ? '+' : ''}${xpMod}xp`;
    }

    // Format combined stats for a group of entries
    function formatCombinedStats(entries: CardHistoryEntry[]): string {
        const mainEntry = getMainEntry(entries);
        
        // For non-QUEST actions, just return the main entry stats
        if (mainEntry.action !== 'QUEST_WIN' && mainEntry.action !== 'QUEST_LOSS') {
            return formatStats(mainEntry);
        }
        
        // For QUEST actions, combine the stats
        let result = '';
        
        // Add the main stats
        if (mainEntry.action === 'QUEST_WIN') {
            result = 'Reset to 100/100';
        } else if (mainEntry.action === 'QUEST_LOSS') {
            result = `+${DOTADECK.LOSS_REWARD.GOLD}g/+${DOTADECK.LOSS_REWARD.XP}xp`;
        }
        
        // Add charm effects if any
        if (mainEntry.charmEffects?.length) {
            const charmEffects = mainEntry.charmEffects.map(ce => {
                if (ce.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER) {
                    return `${ce.effectValue}x XP charm`;
                } else if (ce.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER) {
                    return `${ce.effectValue}x gold charm`;
                }
                return '';
            }).filter(Boolean);
            
            if (charmEffects.length > 0) {
                result += ` (${charmEffects.join(', ')})`;
            }
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

<div 
    class="absolute z-50 bg-surface-900/95 border border-surface-700 rounded-lg p-4 shadow-xl w-72"
    style="left: {showOnLeft ? x - 292 : x + 20}px; top: {y}px;"
>
    {#if history.length === 0}
        <p class="text-xs text-center text-surface-400">No history yet</p>
    {:else}
        <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {#each sortedTimestamps as timestamp}
                {@const entries = groupedHistory[timestamp]}
                {@const mainEntry = getMainEntry(entries)}
                <div class="flex flex-col gap-1 p-2 rounded bg-surface-800/50">
                    <div class="flex items-center justify-between">
                        <span class="font-mono text-xs opacity-70">
                            {new Date(mainEntry.timestamp).toLocaleString()}
                        </span>
                        <span class={mainEntry.action === 'QUEST_WIN' ? 'text-green-400' : 
                                   mainEntry.action === 'QUEST_LOSS' ? 'text-red-400' : 
                                   mainEntry.action === 'DRAWN' ? 'text-blue-400' : 
                                   'text-yellow-400'}>
                            {mainEntry.action}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold">
                            {mainEntry.username}
                        </span>
                        <span class="text-xs opacity-70">
                            {formatCombinedStats(entries)}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div> 