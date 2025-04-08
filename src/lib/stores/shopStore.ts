import { writable } from 'svelte/store';
import type { DotadeckItem } from '@prisma/client';

interface ShopState {
    items: DotadeckItem[];
    userGold: number;
    loading: boolean;
    error: string | null;
}

function createShopStore() {
    const { subscribe, set, update } = writable<ShopState>({
        items: [],
        userGold: 0,
        loading: false,
        error: null
    });

    return {
        subscribe,
        setItems: (items: DotadeckItem[]) => update(state => ({ ...state, items })),
        setUserGold: (gold: number) => update(state => ({ ...state, userGold: gold })),
        setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
        setError: (error: string | null) => update(state => ({ ...state, error })),
        reset: () => set({
            items: [],
            userGold: 0,
            loading: false,
            error: null
        })
    };
}

export const shopStore = createShopStore(); 