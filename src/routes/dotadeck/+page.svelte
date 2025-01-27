<script lang="ts">
    interface Card {
        id: number;
        name: string;
        image: string;
        cost: number;
    }

    let currentHand: Card[] = [];
    let score = 35394;
    let gold = 8;
    let shopCards: Card[] = [
        { id: 1, name: 'Queen of Hearts', image: 'https://deckofcardsapi.com/static/img/QH.png', cost: 5 },
        { id: 2, name: 'King of Spades', image: 'https://deckofcardsapi.com/static/img/KS.png', cost: 5 },
        { id: 3, name: 'Ten of Hearts', image: 'https://deckofcardsapi.com/static/img/0H.png', cost: 4 }
    ];

    let isShopOpen = false;
    let isLeaderboardOpen = false;

    function toggleShop() {
        isShopOpen = !isShopOpen;
        isLeaderboardOpen = false;
    }

    function toggleLeaderboard() {
        isLeaderboardOpen = !isLeaderboardOpen;
        isShopOpen = false;
    }
</script>

<div class="max-w-[1400px] mx-auto p-8">
    <div class="flex justify-between mb-8">
        <div class="text-2xl font-bold text-yellow-400">Score: {score}</div>
        <div class="text-2xl font-bold text-yellow-400">Gold: ${gold}</div>
    </div>

    <div class="flex gap-4 mb-8">
        <button class="px-6 py-2 rounded-lg bg-gray-800 text-white transition-all duration-200 
                       hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(255,215,0,0.2)]"
                on:click={toggleShop}>
            Card Shop
        </button>
        <button class="px-6 py-2 rounded-lg bg-gray-800 text-white transition-all duration-200 
                       hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(255,215,0,0.2)]"
                on:click={toggleLeaderboard}>
            Leaderboard
        </button>
        <button class="px-6 py-2 rounded-lg bg-gray-700 text-white transition-all duration-200 
                       hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(255,215,0,0.2)]">
            Ready to Play
        </button>
    </div>

    <div class="bg-[#35654d] p-8 rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
        <h2>Current Hand</h2>
        <div class="flex gap-4 justify-center min-h-[200px] border-2 border-white/10 rounded-lg p-4">
            {#each currentHand as card}
                <div class="card">
                    <img src={card.image} alt={card.name} class="w-[180px] h-auto" />
                </div>
            {/each}
        </div>
    </div>

    {#if isShopOpen}
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    bg-gray-900 p-8 rounded-lg w-[90%] max-w-[800px] shadow-lg">
            <div class="flex justify-between items-center mb-8">
                <h2>Select a Card</h2>
                <button class="text-4xl bg-transparent border-none text-white cursor-pointer"
                        on:click={toggleShop}>×</button>
            </div>
            <div class="flex gap-8 justify-center">
                {#each shopCards as card}
                    <div class="relative">
                        <img src={card.image} alt={card.name} class="w-[180px] h-auto" />
                        <div class="absolute -bottom-6 inset-x-0 text-center text-yellow-400 font-bold">
                            Cost: {card.cost}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div> 