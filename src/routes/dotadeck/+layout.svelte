<script lang="ts">
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;

    async function startNewGame() {
        try {
            const response = await fetch('/api/dotadeck/new-game', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                }
            });
            
            if (response.ok) {
                window.location.reload();
            } else if (response.status === 401) {
                window.location.href = '/login';
            } else {
                console.error('Failed to create new game');
            }
        } catch (e) {
            console.error('Error:', e);
        }
    }
</script>

<div class="w-full">
    <div class="bg-gray-800 p-4 border-b border-gray-700">
        <div class="flex justify-between items-center">
            <div class="text-xl font-bold text-white">DotaDeck</div>
            <div class="flex gap-4">
                <button
                    class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                    on:click={startNewGame}
                >
                    New Game
                </button>
                {#if data.activeGame}
                    <div class="text-yellow-400">
                        Game #{data.activeGame.id.slice(-4)}
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <slot />
</div> 