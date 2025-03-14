import { writable } from 'svelte/store';

export interface CardHistoryEntry {
    action: 'DRAWN' | 'DISCARDED' | 'QUEST_WIN' | 'QUEST_LOSS' | 'PASSIVE_MOD';
    timestamp: Date;
    username: string;
    goldMod?: number;
    xpMod?: number;
    heroId: number;
}

function createCardHistoryStore() {
    const { subscribe, set, update } = writable<Record<number, CardHistoryEntry[]>>({});

    return {
        subscribe,
        setHistories: (histories: Record<number, CardHistoryEntry[]>) => set(histories),
        addHistory: (heroId: number, entry: CardHistoryEntry) => update(histories => ({
            ...histories,
            [heroId]: [...(histories[heroId] || []), entry]
        }))
    };
}

export const cardHistoryStore = createCardHistoryStore(); 