<script lang="ts">
    interface Card {
        id: number;
        name: string;
        image: string;
        points: number;
        code: string;  // Added for API compatibility
    }

    let selectedCards: Set<number> = $state(new Set());
    let deckId: string | null = null;
    
    let cards: Card[] = $state([]);

    let totalScore = $derived(cards.reduce((total, card) => total + card.points, 0));

    async function initializeDeck() {
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/');
        const data = await response.json();
        deckId = data.deck_id;
    }

    function getCardPoints(value: string): number {
        if (value === 'ACE') return 11;
        if (['KING', 'QUEEN', 'JACK'].includes(value)) return 10;
        return parseInt(value) || 10; // Fallback to 10 if parsing fails
    }

    async function drawCard() {
        if (!deckId) await initializeDeck();
        if (cards.length >= 5) return;

        try {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
            const data = await response.json();
            
            if (data.cards && data.cards.length > 0) {
                const newCard = data.cards[0];
                const newCardObj: Card = {
                    id: Math.max(...cards.map(c => c.id), 0) + 1,
                    name: `${newCard.value} of ${newCard.suit}`,
                    image: newCard.image,
                    points: getCardPoints(newCard.value),
                    code: newCard.code
                };

                cards = [...cards, newCardObj];
            }

            if (data.remaining === 0) {
                await initializeDeck();
            }
        } catch (error) {
            console.error('Error drawing card:', error);
        }
    }

    function handleCardClick(card: Card) {
        if (selectedCards.has(card.id)) {
            selectedCards.delete(card.id);
        } else {
            selectedCards.add(card.id);
        }
        selectedCards = selectedCards; // trigger reactivity
    }

    function discardSelected() {
        if (selectedCards.size === 0) return;
        cards = cards.filter(card => !selectedCards.has(card.id));
        selectedCards.clear();
        selectedCards = selectedCards; // trigger reactivity
    }

    function handleDragStart(event: DragEvent, card: Card) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', card.id.toString());
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
    }

    function handleDrop(event: DragEvent, targetCard: Card) {
        event.preventDefault();
        const draggedId = Number(event.dataTransfer?.getData('text/plain'));
        const draggedIndex = cards.findIndex(card => card.id === draggedId);
        const targetIndex = cards.findIndex(card => card.id === targetCard.id);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newCards = [...cards];
            const [draggedCard] = newCards.splice(draggedIndex, 1);
            newCards.splice(targetIndex, 0, draggedCard);
            cards = newCards;
        }
    }

    import { onMount } from 'svelte';
    onMount(initializeDeck);
</script>

<div class="max-w-[1400px] mx-auto p-12 text-center">
    <h1>Your Hand</h1>
    <div class="text-2xl my-8 flex items-center justify-center gap-2 flex-wrap">
        {#each cards as card, i}
            <span class="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
                {card.points}
            </span>
            {#if i < cards.length - 1}
                <span class="text-gray-500 font-bold">+</span>
            {/if}
        {/each}
        <span class="text-gray-500 font-bold mx-4">=</span>
        <span class="text-green-500 text-3xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
            {totalScore}
        </span>
    </div>

    <div class="my-8">
        <div class="bg-[#35654d] rounded-lg p-12 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] border-[2.5rem] border-[#5c3a21]
                    before:content-[''] before:absolute before:-inset-8 before:border-4 before:border-[#8b5e34] before:rounded-lg before:pointer-events-none
                    after:content-[''] after:absolute after:-inset-10 after:border-2 after:border-[#3c2611] after:rounded-xl after:pointer-events-none">
            <div class="flex justify-center gap-6">
                {#each cards as card}
                    <button 
                        type="button"
                        class="w-40 shrink-0 cursor-grab active:cursor-grabbing rounded-lg p-2 bg-transparent border-none
                               transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(255,215,0,0.6)]
                               {selectedCards.has(card.id) ? 'shadow-[0_0_20px_rgba(0,0,255,0.5)] -translate-y-1 relative' : ''}"
                        class:selected={selectedCards.has(card.id)}
                        onclick={() => handleCardClick(card)}
                        onkeydown={(e) => e.key === 'Enter' && handleCardClick(card)}
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, card)}
                        ondragover={handleDragOver}
                        ondrop={(e) => handleDrop(e, card)}
                    >
                        <img src={card.image} alt={card.name} class="w-full h-auto" />
                        {#if selectedCards.has(card.id)}
                            <div class="absolute top-2 right-2 w-6 h-6 bg-blue-500/80 text-white rounded-full 
                                      flex items-center justify-center text-base font-bold">✓</div>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
    </div>
    
    <div class="flex gap-4 justify-center mt-8 p-4 border-t-2 border-black/10">
        <button 
            class="px-8 py-2 text-xl rounded-lg bg-blue-600 text-white transition-all duration-200
                   hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(37,99,235,0.4)]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            onclick={discardSelected} 
            disabled={selectedCards.size === 0}
        >
            Discard ({selectedCards.size})
        </button>
        <button 
            class="px-8 py-2 text-xl rounded-lg bg-blue-600 text-white transition-all duration-200
                   hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(37,99,235,0.4)]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            onclick={drawCard}
            disabled={cards.length >= 5}
        >
            Draw {cards.length}/5
        </button>
    </div>

    {#if selectedCards.size > 0}
        <div class="mt-4 text-xl text-gray-700">
            <p>Selected: {cards.filter(c => selectedCards.has(c.id)).map(c => c.name).join(', ')}</p>
        </div>
    {/if}
</div> 