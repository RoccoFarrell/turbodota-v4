<script lang="ts">
    import { getModalStore } from '@skeletonlabs/skeleton';
    const modalStore = getModalStore();
    import { DOTADECK } from '$lib/constants/dotadeck';

    interface HistoryEvent {
        card: {
            hero: {
                id: number;
                localized_name: string;
            };
        };
        seasonUser: {
            user: {
                user: {
                    username: string;
                };
            };
        };
        action: 'DRAWN' | 'DISCARDED' | 'QUEST_WIN' | 'QUEST_LOSS' | 'PASSIVE_MOD' | 'CHARM';
        timestamp: Date;
        goldMod: number;
        xpMod: number;
        modType?: string;
        charmEffects?: Array<{
            effectType: string;
            effectValue: number;
            itemName: string;
            goldMod: number;
            xpMod: number;
        }>;
    }

    export let history: HistoryEvent[];

    const actionLabels = {
        DRAWN: 'drew',
        DISCARDED: 'discarded',
        QUEST_WIN: 'won with',
        QUEST_LOSS: 'lost with',
        PASSIVE_MOD: 'modified',
        CHARM: 'charmed'
    };

    // Group history entries by timestamp to handle multiple charms on the same match
    $: groupedHistory = history.reduce((groups, event) => {
        const timestamp = new Date(event.timestamp).getTime();
        if (!groups[timestamp]) {
            groups[timestamp] = [];
        }
        groups[timestamp].push(event);
        return groups;
    }, {} as Record<number, HistoryEvent[]>);

    // Sort timestamps in descending order
    $: sortedTimestamps = Object.keys(groupedHistory).map(Number).sort((a, b) => b - a);

    // Helper function to format charm effects
    function formatCharmEffect(event: HistoryEvent): string {
        if (event.modType === 'MODIFY' && event.charmEffects?.length) {
            const effects = event.charmEffects.map(ce => {
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

    // Format combined stats for a group of events
    function formatCombinedStats(events: HistoryEvent[]): string {
        const mainEvent = getMainEntry(events);
        
        // For non-QUEST actions, just return the main event stats
        if (mainEvent.action !== 'QUEST_WIN' && mainEvent.action !== 'QUEST_LOSS') {
            if (mainEvent.action === 'DISCARDED') {
                return `+${DOTADECK.DISCARD_BONUS.GOLD}g/+${DOTADECK.DISCARD_BONUS.XP}xp`;
            }
            return '';
        }
        
        // For QUEST actions, combine the stats
        let result = '';
        
        // Add the main stats
        if (mainEvent.action === 'QUEST_WIN') {
            result = 'Reset to 100/100';
        } else if (mainEvent.action === 'QUEST_LOSS') {
            result = `+${DOTADECK.LOSS_REWARD.GOLD}g/+${DOTADECK.LOSS_REWARD.XP}xp`;
        }
        
        // Add charm effects if any
        if (mainEvent.charmEffects?.length) {
            const charmEffects = mainEvent.charmEffects.map(ce => {
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
    function getMainEntry(events: HistoryEvent[]): HistoryEvent {
        return events.find(e => e.modType !== 'MODIFY') || events[0];
    }

    // Get all charm effect entries from a group
    function getCharmEntries(events: HistoryEvent[]): HistoryEvent[] {
        return events.filter(e => e.modType === 'MODIFY' && e.charmEffects);
    }
</script>

<div class="card p-4 w-full max-w-3xl">
    <header class="flex justify-between items-center mb-4">
        <h2 class="h2 text-primary-500">League History</h2>
        <button class="btn btn-sm variant-filled-surface" on:click={() => modalStore.close()}>✕</button>
    </header>

    <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        {#each sortedTimestamps as timestamp}
            {@const events = groupedHistory[timestamp]}
            {@const mainEvent = getMainEntry(events)}
            <div class="card p-2 variant-ghost-surface">
                <div class="flex items-center gap-2">
                    <i class={`d2mh hero-${mainEvent.card.hero.id}`} title={mainEvent.card.hero.localized_name}></i>
                    <span class="text-surface-200">
                        <span class="text-primary-400">{mainEvent.seasonUser.user.user.username}</span>
                        {actionLabels[mainEvent.action]}
                        <span class="text-primary-400">{mainEvent.card.hero.localized_name}</span>
                        {#if mainEvent.goldMod || mainEvent.xpMod || getCharmEntries(events).length > 0}
                            <span class="text-yellow-400 ml-1">({formatCombinedStats(events)})</span>
                        {/if}
                    </span>
                    <span class="text-surface-300 text-sm ml-auto">
                        {new Date(mainEvent.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</div> 