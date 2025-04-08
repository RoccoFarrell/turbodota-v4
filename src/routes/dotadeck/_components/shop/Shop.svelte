<script lang="ts">
    import { onMount } from 'svelte';
    import { shopStore } from '$lib/stores/shopStore';
    import { getToastStore } from '@skeletonlabs/skeleton';

    const toastStore = getToastStore();

    onMount(async () => {
        shopStore.setLoading(true);
        try {
            const response = await fetch('/api/shop');
            const data = await response.json();

            if (data.success) {
                shopStore.setItems(data.items);
                shopStore.setUserGold(data.userGold);
            } else {
                shopStore.setError(data.error);
                toastStore.trigger({
                    message: data.error,
                    background: 'variant-filled-error'
                });
            }
        } catch (err) {
            shopStore.setError('Failed to load shop items');
            toastStore.trigger({
                message: 'Failed to load shop items',
                background: 'variant-filled-error'
            });
        } finally {
            shopStore.setLoading(false);
        }
    });

    async function purchaseItem(itemId: string) {
        try {
            const response = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId })
            });

            const data = await response.json();

            if (data.success) {
                shopStore.setUserGold(data.data.user.gold);
                toastStore.trigger({
                    message: 'Item purchased successfully!',
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
                message: 'Failed to purchase item',
                background: 'variant-filled-error'
            });
        }
    }
</script>

<div class="p-4 bg-gray-800 rounded-lg shadow-lg">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-white">Shop</h2>
        <span class="text-yellow-400 font-bold">Your Gold: {$shopStore.userGold}</span>
    </div>
    
    {#if $shopStore.loading}
        <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    {:else if $shopStore.error}
        <div class="text-red-500 text-center">{$shopStore.error}</div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each $shopStore.items as item}
                <div class="bg-gray-700 rounded-lg p-4 flex flex-col">
                    <h3 class="text-xl font-semibold text-white mb-2">{item.name}</h3>
                    <p class="text-gray-300 mb-4">{item.description}</p>
                    <div class="mt-auto flex justify-between items-center">
                        <span class="text-yellow-400 font-bold">{item.cost} Gold</span>
                        <button
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            on:click={() => purchaseItem(item.id)}
                            disabled={$shopStore.userGold < item.cost}
                        >
                            Buy
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div> 