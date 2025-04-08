<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { inventoryStore } from '$lib/stores/inventoryStore';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { invalidate } from '$app/navigation';

    const dispatch = createEventDispatcher();
    const toastStore = getToastStore();
    let userGold = 0;

    onMount(async () => {
        inventoryStore.setLoading(true);
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();

            if (data.success) {
                inventoryStore.setItems(data.inventory);
                userGold = data.userGold;
            } else {
                inventoryStore.setError(data.error);
                toastStore.trigger({
                    message: data.error,
                    background: 'variant-filled-error'
                });
            }
        } catch (err) {
            inventoryStore.setError('Failed to load inventory items');
            toastStore.trigger({
                message: 'Failed to load inventory items',
                background: 'variant-filled-error'
            });
        } finally {
            inventoryStore.setLoading(false);
        }
    });

    async function sellItem(itemId: string) {
        try {
            const response = await fetch('/api/inventory/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId })
            });

            const data = await response.json();

            if (data.success) {
                inventoryStore.removeItem(itemId);
                userGold = data.data.user.gold;
                toastStore.trigger({
                    message: `Sold item for ${data.data.sellValue} gold!`,
                    background: 'variant-filled-success'
                });
            } else {
                toastStore.trigger({
                    message: data.error,
                    background: 'variant-filled-error'
                });
            }
        } catch (err) {
            toastStore.trigger({
                message: 'Failed to sell item',
                background: 'variant-filled-error'
            });
        }
    }

    async function useItem(itemId: string) {
        try {
            const response = await fetch('/api/inventory/use', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId })
            });

            const data = await response.json();

            if (data.success) {
                // Update inventory store - only remove if quantity is 1, otherwise update quantity
                const item = $inventoryStore.items.find(i => i.id === itemId);
                if (item) {
                    if (item.quantity === 1) {
                        inventoryStore.removeItem(itemId);
                    } else {
                        // Update the item's quantity in the store
                        const updatedItems = $inventoryStore.items.map(i => 
                            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
                        );
                        inventoryStore.setItems(updatedItems);
                    }
                }
                
                // Show success toast
                toastStore.trigger({
                    message: `Successfully used item! ${data.data.effect.message}`,
                    background: 'variant-filled-success'
                });
                
                // Dispatch itemUsed event with the updated active charms
                dispatch('itemUsed', { activeCharms: data.data.activeCharms });
                
                // Invalidate data to refresh the page
                await invalidate('app:data');
                await invalidate('app:inventory');
            } else {
                toastStore.trigger({
                    message: data.error,
                    background: 'variant-filled-error'
                });
            }
        } catch (err) {
            toastStore.trigger({
                message: 'Failed to use item',
                background: 'variant-filled-error'
            });
        }
    }
</script>

<div class="p-4 bg-gray-800 rounded-lg shadow-lg">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-white">Inventory</h2>
        <span class="text-yellow-400 font-bold">Your Gold: {userGold}</span>
    </div>
    
    {#if $inventoryStore.loading}
        <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    {:else if $inventoryStore.error}
        <div class="text-red-500 text-center">{$inventoryStore.error}</div>
    {:else if $inventoryStore.items.length === 0}
        <div class="text-gray-400 text-center">Your inventory is empty</div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each $inventoryStore.items as item}
                <div class="bg-gray-700 rounded-lg p-4 flex flex-col">
                    <div class="flex justify-between items-start">
                        <h3 class="text-xl font-semibold text-white mb-2">{item.item.name}</h3>
                        {#if item.quantity > 1}
                            <span class="bg-blue-600 text-white px-2 py-1 rounded text-sm">x{item.quantity}</span>
                        {/if}
                    </div>
                    <p class="text-gray-300 mb-4">{item.item.description}</p>
                    <div class="mt-auto flex justify-between items-center">
                        <span class="text-yellow-400 font-bold">Sell Value: {Math.floor(item.item.cost * item.item.sellValue / 100)} Gold</span>
                        <div class="space-x-2">
                            <button
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                on:click={() => useItem(item.id)}
                            >
                                Use
                            </button>
                            <button
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                on:click={() => sellItem(item.id)}
                            >
                                Sell
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div> 