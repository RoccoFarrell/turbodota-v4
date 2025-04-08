<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let title: string;
    export let show = false;

    function close() {
        dispatch('close');
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            close();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        // Only close if the click was directly on the backdrop
        if (event.target === event.currentTarget) {
            close();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="button"
        tabindex="0"
    >
        <div class="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 class="text-2xl font-bold text-white">{title}</h2>
                <button
                    class="text-gray-400 hover:text-white"
                    on:click={close}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-4">
                <slot />
            </div>
        </div>
    </div>
{/if} 