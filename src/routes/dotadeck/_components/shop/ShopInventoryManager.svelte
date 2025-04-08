<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Shop from './Shop.svelte';
    import Inventory from '../inventory/Inventory.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import ShopButton from './ShopButton.svelte';
    import InventoryButton from '../inventory/InventoryButton.svelte';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import type { DotadeckItem, SeasonUserItem } from '@prisma/client';
    import { invalidate } from '$app/navigation';
    import { DOTADECK } from '$lib/constants/dotadeck';

    const dispatch = createEventDispatcher();
    const toastStore = getToastStore();

    let showShop = false;
    let showInventory = false;

    export let inventory: (SeasonUserItem & {
        item: DotadeckItem;
    })[] = [];

    function openShop() {
        showShop = true;
    }

    function closeShop() {
        showShop = false;
    }

    function openInventory() {
        showInventory = true;
    }

    function closeInventory() {
        showInventory = false;
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

            const result = await response.json();

            if (result.success) {
                // Show success toast
                toastStore.trigger({
                    message: `Successfully used item! ${result.data.effect.message}`,
                    background: 'variant-filled-success'
                });

                // Dispatch itemUsed event with the updated active charms
                dispatch('itemUsed', { activeCharms: result.data.activeCharms });

                // Invalidate all data to refresh the page
                await invalidate('app:data');
                await invalidate('app:inventory');
            } else {
                // Show error toast
                toastStore.trigger({
                    message: result.error || 'Failed to use item',
                    background: 'variant-filled-error'
                });
            }
        } catch (error) {
            console.error('Error using item:', error);
            toastStore.trigger({
                message: 'Failed to use item',
                background: 'variant-filled-error'
            });
        }
    }
</script>

<div class="flex space-x-4">
    <ShopButton on:open={openShop} />
    <InventoryButton on:open={openInventory} />
</div>

{#if showShop}
    <Modal title="Shop" show={showShop} on:close={closeShop}>
        <Shop />
    </Modal>
{/if}

{#if showInventory}
    <Modal title="Inventory" show={showInventory} on:close={closeInventory}>
        <Inventory on:itemUsed={(e) => dispatch('itemUsed', e.detail)} />
    </Modal>
{/if} 