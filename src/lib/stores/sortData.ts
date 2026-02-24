import { writable } from 'svelte/store'

interface SortData {
    startDate: Date,
    endDate: Date,
    role: string,
    heroID: number,
    selectedPlayer: string,
    sortHeader: "Games",
    gameMode: 'ranked' | 'turbo' | 'all'
}

function createSortData() {
    const { subscribe, set, update } = writable<{
        startDate: string,
        endDate: string,
        role: string,
        heroID: number,
        selectedPlayer: string,
        sortHeader: string,
        gameMode: 'ranked' | 'turbo' | 'all'
    }>({
        startDate: new Date(0).toISOString().slice(0,10),
        endDate: new Date().toISOString().slice(0,10),
        role: "All",
        heroID: -1,
        selectedPlayer: "All",
        sortHeader: "Games",
        gameMode: "all"
    });

    return {
        subscribe,
        set,
        update,
        setStartDate: (input: Date) => update(n => n = {
            ...n,
            startDate: input.toISOString().slice(0,10)
        }),
        setEndDate: (input: Date) => update(n => n = {
            ...n,
            endDate: input.toISOString().slice(0,10)
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
        setGameMode: (input: 'ranked' | 'turbo' | 'all') => update(n => ({
            ...n,
            gameMode: input
        })),
        reset: () => {

                update(n => n = {
                    startDate: new Date(0).toISOString().slice(0,10),
                    endDate: new Date().toISOString().slice(0,10),
                    role: "All",
                    heroID: -1,
                    selectedPlayer: n.selectedPlayer !== "All" ? "Rocco" : "All",
                    sortHeader: "Games",
                    gameMode: "all"
                })
            
        }
    }
}
export const sortData = createSortData()