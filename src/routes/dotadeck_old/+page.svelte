<script lang="ts">
    import type { PageData } from './$types';
    import HeroCard from '$lib/components/HeroCard.svelte';
    
    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    interface UserCard {
        id: string;
        card: HeroCardData;
        timesPlayed: number;
        totalScore: number;
        lastPlayedAt: Date | null;
    }

    interface HeroCardData {
        id: string;
        name: string;
        imageUrl: string;
        cost: number;
        description: string;
        effectType: EffectType;
        statType: StatType;
        isActive: boolean;
    }

    type EffectType = 'STAT_MULTIPLIER' | 'STAT_ADDER' | 'SCORE_MULTIPLIER';

    type StatType = 'KILLS' | 'ASSISTS' | 'NET_WORTH' | 'LAST_HITS' | 'DENIES' | 
                    'DAMAGE' | 'HEALING' | 'BUILDING' | 'SUPPORT' | 'SCORE';

    let currentHand: UserCard[] = $state(data.userCards ?? []);
    let selectedHandCards = $state(new Set<string>());
    let score = data.score ?? 0;
    let gold = $state(data.gold ?? 0);
    let currentRound = data.currentRound ?? null;
    let shopCards: HeroCardData[] = $state(data.shopCards ?? []);

    const colors = {
        STAT_MULTIPLIER: '#4A90E2',
        STAT_ADDER: '#50E3C2',
        SCORE_MULTIPLIER: '#F5A623'
    } as const;

    let isShopOpen = $state(false);
    let isLeaderboardOpen = false;
    let selectedCards = $state(new Set<string>());

    // Create audio element for purchase sound
    let purchaseSound: HTMLAudioElement;
    if (typeof window !== 'undefined') {
        purchaseSound = new Audio('/sounds/purchase.mp3');
    }

    function toggleCardSelection(card: HeroCardData) {
        if (selectedCards.has(card.id)) {
            selectedCards.delete(card.id);
        } else {
            selectedCards.add(card.id);
        }
        selectedCards = selectedCards; // Trigger reactivity
    }

    function clearSelection() {
        selectedCards.clear();
        selectedCards = selectedCards;
    }

    async function purchaseCard(card: HeroCardData) {
        if (gold < card.cost) return;

        const response = await fetch('/api/cards/purchase', {
            method: 'POST',
            body: JSON.stringify({ cardId: card.id })
        });

        if (response.ok) {
            const result = await response.json();
            gold = result.gameStats.gold;
            currentHand = [...currentHand, {
                id: result.userCard.id,
                card: card,
                timesPlayed: 0,
                totalScore: 0,
                lastPlayedAt: null
            }];
        }
    }

    async function purchaseSelectedCards() {
        for (const cardId of selectedCards) {
            const card = shopCards.find(c => c.id === cardId);
            if (card) {
                await purchaseCard(card);
            }
        }
        clearSelection();
        // Play sound and close shop
        purchaseSound?.play();
        isShopOpen = false;
    }

    async function toggleShop() {
        if (!isShopOpen) {
            const response = await fetch('/api/cards/shop');
            if (response.ok) {
                const result = await response.json();
                shopCards = result.cards;
            }
        }
        isShopOpen = !isShopOpen;
        isLeaderboardOpen = false;
    }

    function toggleLeaderboard() {
        isLeaderboardOpen = !isLeaderboardOpen;
        isShopOpen = false;
    }

    async function startRound() {
        if (currentRound) return;
        
        const response = await fetch('/api/rounds/start', {
            method: 'POST',
            body: JSON.stringify({ userCardIds: currentHand.map(uc => uc.id) })
        });

        if (response.ok) {
            const result = await response.json();
            currentRound = result.round;
        }
    }

    function toggleHandCardSelection(userCard: UserCard) {
        if (selectedHandCards.has(userCard.id)) {
            selectedHandCards.delete(userCard.id);
        } else {
            selectedHandCards.add(userCard.id);
        }
        selectedHandCards = selectedHandCards;
    }

    function clearHandSelection() {
        selectedHandCards.clear();
        selectedHandCards = selectedHandCards;
    }

    async function deleteSelectedCards() {
        for (const userCardId of selectedHandCards) {
            const response = await fetch('/api/cards/delete', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ userCardId })
            });

            if (response.ok) {
                currentHand = currentHand.filter(uc => uc.id !== userCardId);
            }
        }
        clearHandSelection();
    }
</script>

<div class="game-container flex flex-col h-[calc(100vh-64px)] w-full bg-gray-950 relative">
    <!-- Game Nav -->
    <div class="bg-linear-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700/50 shadow-xl">
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-yellow-300 to-amber-500 
                            drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    Score: {score}
                </div>
                <div class="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-yellow-300 to-amber-500 
                            drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    Gold: ${gold}
                </div>
            </div>
            <div class="flex gap-6">
                <button class="px-8 py-3 rounded-lg bg-linear-to-br from-gray-700 to-gray-800 text-white 
                            transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(251,191,36,0.3)]
                            border border-gray-700/50"
                        onclick={toggleShop}>
                    Card Shop
                </button>
                <button class="px-6 py-2 rounded-lg bg-gray-700 text-white transition-all duration-200 
                             hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(255,215,0,0.2)]"
                        onclick={toggleLeaderboard}>
                    Leaderboard
                </button>
                <button class="px-6 py-2 rounded-lg bg-gray-700 text-white transition-all duration-200 
                             hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(255,215,0,0.2)]">
                    Ready to Play
                </button>
            </div>
        </div>
    </div>

    <!-- Game Content -->
    <div class="flex-1 p-12 overflow-auto bg-linear-to-b from-gray-900 to-gray-950">
        <div class="bg-linear-to-br from-[#2d5a44] to-[#1e3c2d] p-10 rounded-2xl 
                    shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] border border-emerald-800/30">
            <h2 class="text-2xl font-bold text-emerald-100/90 mb-6 drop-shadow-lg">Current Hand</h2>
            <div class="relative flex justify-center min-h-[300px] border-2 border-emerald-700/30 rounded-xl p-8
                        bg-linear-to-b from-emerald-900/20 to-transparent backdrop-blur-sm overflow-x-auto">
                <div class="flex gap-6 min-w-fit px-4">
                    {#each currentHand.filter(uc => uc?.card) as userCard}
                        <HeroCard 
                            card={userCard.card}
                            selected={selectedHandCards.has(userCard.id)}
                            showStats={true}
                            timesPlayed={userCard.timesPlayed}
                            totalScore={userCard.totalScore}
                            ringColor="red"
                            on:click={() => toggleHandCardSelection(userCard)}
                        />
                    {/each}
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-6">
                <button
                    class="px-8 py-3 rounded-lg bg-linear-to-br from-red-600 to-red-700 text-white
                           shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/30
                           transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                    disabled={selectedHandCards.size === 0}
                    onclick={deleteSelectedCards}
                >
                    Delete Selected ({selectedHandCards.size})
                </button>
                <button
                    class="px-6 py-2 rounded-lg bg-gray-600 text-white transition-all duration-200 
                           hover:-translate-y-1 hover:shadow-lg"
                    onclick={clearHandSelection}
                >
                    Clear Selection
                </button>
            </div>
        </div>
    </div>

    {#if isShopOpen}
        <div class="absolute top-[10%] left-[10%] right-[10%] bottom-[10%] 
                    bg-linear-to-br from-gray-900 to-gray-950 rounded-xl 
                    shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800/50
                    backdrop-blur-sm flex flex-col">
            <div class="flex justify-between items-center p-8 pb-4">
                <div class="flex items-center gap-4">
                    <h2>Select a Card</h2>
                    {#if selectedCards.size > 0}
                        <div class="text-yellow-400 font-bold text-lg drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                            Total Cost: ${[...selectedCards].reduce((sum, id) => {
                                const card = shopCards.find(c => c.id === id);
                                return sum + (card?.cost || 0);
                            }, 0)}
                        </div>
                    {/if}
                </div>
                <button class="text-4xl bg-transparent border-none text-white cursor-pointer"
                        onclick={toggleShop}>×</button>
            </div>
            <div class="grid grid-cols-5 gap-2 justify-items-center p-8 pt-0 overflow-y-auto">
                {#each shopCards as card}
                    <HeroCard 
                        card={card}
                        selected={selectedCards.has(card.id)}
                        disabled={gold < card.cost || (selectedCards.size > 0 && !selectedCards.has(card.id))}
                        ringColor="green"
                        on:click={() => toggleCardSelection(card)}
                    />
                {/each}
            </div>
            <div class="bg-gray-800 p-4 flex justify-center gap-4 mt-auto">
                <button
                    class="px-6 py-2 rounded-lg bg-green-600 text-white transition-all duration-200 
                           hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedCards.size === 0 || ![...selectedCards].every(id => {
                        const card = shopCards.find(c => c.id === id);
                        return card && gold >= card.cost;
                    })}
                    onclick={purchaseSelectedCards}
                >
                    Purchase Selected ({selectedCards.size})
                </button>
                <button
                    class="px-6 py-2 rounded-lg bg-gray-600 text-white transition-all duration-200 
                           hover:-translate-y-1 hover:shadow-lg"
                    onclick={clearSelection}
                >
                    Clear Selection
                </button>
            </div>
        </div>
    {/if}
</div> 