import { writable } from 'svelte/store';
import type { DotadeckItem } from '@prisma/client';

interface InventoryItem {
    id: string;
    seasonUserId: string;
    itemId: string;
    quantity: number;
    item: DotadeckItem;
}

interface InventoryState {
    items: InventoryItem[];
    loading: boolean;
    error: string | null;
}

function createInventoryStore() {
    const { subscribe, set, update } = writable<InventoryState>({
        items: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        setItems: (items: InventoryItem[]) => update(state => ({ ...state, items })),
        addItem: (item: InventoryItem) => update(state => ({
            ...state,
            items: [...state.items, item]
        })),
        removeItem: (itemId: string) => update(state => ({
            ...state,
            items: state.items.filter(item => item.id !== itemId)
        })),
        setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
        setError: (error: string | null) => update(state => ({ ...state, error })),
        reset: () => set({
            items: [],
            loading: false,
            error: null
        })
    };
}

export const inventoryStore = createInventoryStore(); 