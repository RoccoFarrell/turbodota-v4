import { writable } from 'svelte/store'

interface sortData {
    startDate: Date,
    endDate: Date,
    role: string,
    heroID: number,
    selectedPlayer: string,
    sortHeader: "Games"
}

function createSortData() {
    const { subscribe, set, update } = writable({
        startDate: new Date(0),
        endDate: new Date(),
        role: "All",
        heroID: -1,
        selectedPlayer: "All",
        sortHeader: "Games"
    });

    return {
        subscribe,
        set,
        update,
        setStartDate: (input: Date) => update(n => n = {
            ...n,
            startDate: input
        }),
        setEndDate: (input: Date) => update(n => n = {
            ...n,
            endDate: input
        }),
        setRole: (input: string) => update(n => n = {
            ...n,
            role: input
        }),
        setHeroID: (input: number) => update(n => n = {
            ...n,
            heroID: input
        }),
        setSelectedPlayer: (input: string) => update(n => n = {
            ...n,
            selectedPlayer: input 
        }),
        setSortHeader: (input: string) => update(n => n = {
            ...n,
            sortHeader: input 
        }),
        reset: () => set({
            startDate: new Date(0),
            endDate: new Date(),
            role: "All",
            heroID: -1,
            selectedPlayer: "All",
            sortHeader: "Games"
        })
    }
}
export const sortData = createSortData()