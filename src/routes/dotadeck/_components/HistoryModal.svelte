<script lang="ts">
        interface CloseProps {
            onClose?: () => void;
        }

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
        action: 'DRAWN' | 'DISCARDED' | 'QUEST_WIN' | 'QUEST_LOSS' | 'PASSIVE_MOD';
        timestamp: Date;
        goldMod: number;
        xpMod: number;
    }

    interface Props {
        history: HistoryEvent[];
    }

    let { history, onClose }: Props & CloseProps = $props();

    const actionLabels = {
        DRAWN: 'drew',
        DISCARDED: 'discarded',
        QUEST_WIN: 'won with',
        QUEST_LOSS: 'lost with',
        PASSIVE_MOD: 'modified'
    };
</script>

<div class="card p-4 w-full max-w-3xl">
    <header class="flex justify-between items-center mb-4">
        <h2 class="h2 text-primary-500">League History</h2>
        <button class="btn btn-sm preset-filled-surface-500" onclick={() => onClose?.()}>✕</button>
    </header>

    <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        {#each history as event}
            <div class="card p-2 preset-tonal-surface border border-surface-500">
                <div class="flex items-center gap-2">
                    <i class={`d2mh hero-${event.card.hero.id}`} title={event.card.hero.localized_name}></i>
                    <span class="text-surface-200">
                        <span class="text-primary-400">{event.seasonUser.user.user.username}</span>
                        {actionLabels[event.action]}
                        <span class="text-primary-400">{event.card.hero.localized_name}</span>
                        {#if event.goldMod || event.xpMod}
                            <span class="text-yellow-400">{event.goldMod > 0 ? '+' : ''}{event.goldMod}g</span>
                            /
                            <span class="text-blue-400">{event.xpMod > 0 ? '+' : ''}{event.xpMod}xp</span>
                        {/if}
                    </span>
                    <span class="text-surface-300 text-sm ml-auto">
                        {new Date(event.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</div> 