<script lang="ts">
	import { run } from 'svelte/legacy';
	import type { PopupSettings, Progress } from '@skeletonlabs/skeleton-svelte';
	import { enhance } from '$app/forms';
	import { getContext } from 'svelte';
	// TableSource type (not exported from Skeleton v3)
	type TableSource = {
		head: string[];
		body: any[][];
		meta?: any[][];
	};
	
	// Helper function to map table data values
	function tableMapperValues(data: any[], keys: string[]): any[][] {
		return data.map(item => keys.map(key => item[key]));
	}
	// ModalSettings type (not exported from Skeleton v3)
	type ModalSettings = {
		type?: string;
		title?: string;
		body?: string;
		component?: any;
		meta?: any;
		response?: (r: any) => void;
	};
	type ModalComponent = {
		ref: any;
	};
	type ModalStore = any;
	import { } from '@skeletonlabs/skeleton-svelte';

	//images
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import shopkeeper2 from '$lib/assets/shopkeeper_3x1.png';
	import Lock from '$lib/assets/lock.png';
	import type { Item } from '@prisma/client';
	import DataTableCheckbox from '../../leagues/[slug]/seasons/[slug]/data-table-checkbox.svelte';

	interface Props {
		data: any;
		form: any;
	}

	let { data, form }: Props = $props();

	let items: Item[] = $state(data.town.items);

	items = items.sort((a: ShopItem, b: ShopItem) => {
		if(a.name > b.name) return 1
		else return -1
	})
	
	items = items.sort((a: ShopItem, b: ShopItem) => {
		if(a.active) return -1
		else return 1
	})

	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	const toastStore = getContext<{ trigger: (settings: ToastSettings) => void }>('toaster');

	class ShopItem {
		id: number = -1;
		name: string = '';
		description: string = '';
		imgSrc: string = '';
		goldCost: number = 0;
		quantityAvailable: number = 0;
		active: boolean = false;
	}

	class ShoppingCart {
		itemList: Array<ShopItem> = [];
		totalCost: number = 0;
	}

	let userShoppingCart: ShoppingCart = $state(new ShoppingCart());

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Gold', '# in Stock', 'Quantity'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(items, ['name', 'goldCost', 'quantityAvailable']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(items, ['id', 'name', 'description', 'imgSrc', 'goldCost', 'quantityAvailable', 'active'])
		// Optional: A list of footer labels.
		//foot:
	};

	let selectedDetailItem = $state(new ShopItem());

	const modifyCart = (itemName: string, mode: string) => {
		let item = items.filter((item: ShopItem) => item.name === itemName)[0];
		let currentItemQuantity = userShoppingCart.itemList.filter(
			(currentItem: ShopItem) => item.id === currentItem.id
		).length;
		//console.log(item, currentItemQuantity);
		if (mode === 'add' && item.active) {
			if (currentItemQuantity < item.quantityAvailable) {
				userShoppingCart.itemList.push(item);
				userShoppingCart.totalCost += item.goldCost;
			}
		} else if (mode === 'remove' && item.active) {
			let findIndex = userShoppingCart.itemList.findIndex((item: ShopItem) => item.name === itemName);
			if (findIndex !== -1) {
				userShoppingCart.itemList.splice(findIndex, 1);
				userShoppingCart.totalCost -= item.goldCost;
			}
		}
	};

	const rowFocusHandler = (itemName: string) => {
		//console.log('item focused', itemName);
		let item = items.filter((item: ShopItem) => item.name === itemName)[0];
		selectedDetailItem = item;
	};

	const clearCart = (form: any) => {
		if (form && form.success) {
			(userShoppingCart.itemList = []), (userShoppingCart.totalCost = 0);
		}
	};

	const purchaseClickHandler = () => {
		if (data.town.turbotown.metrics[0].value >= userShoppingCart.totalCost) {
			//user has enough gold for purchase
			toastStore.trigger({
				message: 'Purchase Confirmed - Thank you for purchasing, come again!',
				background: 'preset-filled-success-500'
			});
			userShoppingCart = new ShoppingCart();
		} else {
			toastStore.trigger({
				message: 'Purchase Failed - Not enough gold for purchase!',
				background: 'preset-filled-error-500'
			});
		}
	};

	//$: console.log('user cart: ', userShoppingCart);
	//$: console.log('table source: ', tableSource);
	run(() => {
		console.log(selectedDetailItem);
	});
	run(() => {
		clearCart(form);
	});
</script>

{#if data.town.turbotown}
	<div id="shopComponent" class="w-full grid grid-cols-2 container gap-4">
		<!-- Shop keeper image -->
		<div class="text-center w-full h-full justify-start space-y-4 px-1">
			<div class="mx-auto w-full max-sm:mb-20">
				<img
					class="max-w-full rounded-3xl object-contain shadow-amber-500 shadow-[0_0_10px_1px]"
					src={shopkeeper2}
					alt=""
				/>
			</div>
			<div class="card p-4 grid grid-cols-2">
				<!-- <div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Details</h3>
					<p class="text-m text-center">Hover over an item to see its details</p>
				</div> -->
				<!-- {#if activeItem.id !== -1} -->
				{#if selectedDetailItem.id !== -1}
					<div class="flex flex-col justify-center items-center">
						<img src={selectedDetailItem.imgSrc} alt="item" class="rounded-2xl" />
						<p class="text-lg font-bold text-left">{selectedDetailItem.name}</p>
					</div>
					<div class="flex flex-col">
						<p class="text-md italic text-tertiary-400 text-lef inline">Description:</p>
						<p class="text-amber-500 text-lg"> {selectedDetailItem.description}</p>

						<div class="mt-4 py-4 border-t border-dashed border-primary-500">
							<i class="fi fi-rr-coins text-yellow-500 text-center"></i>
							<p class="inline text-xl font-bold text-amber-500"> {selectedDetailItem.goldCost}</p>
						</div>

					</div>
				{:else}
					<div class="flex justify-center items-center w-full col-span-2 space-x-4">
						<i class="fi fi-br-search text-primary-500/50 h-6 w-6"></i>
						<h3 class="h3 italic text-tertiary-600">Hover an item to view details</h3>
					</div>
				{/if}
			</div>
		</div>
		<div class="flex h-full mx-auto w-full max-sm:mb-20">
			<div class="flex h-full mx-auto w-full max-sm:mb-20">
				<div
					class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
				>
					<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
						<h3 class="h3 dark:text-yellow-500 text-primary-500">Items</h3>
					</div>

					<!-- <Table
				interactive={true}
				source={tableSource}
				on:selected={}
				regionHeadCell={'text-center text-primary-500 font-semibold'}
			/> -->

					<div class="table-container">
						<table class="table  table-interactive table-compact">
							<thead>
								<tr>
									{#each tableSource.head as header, i}
										<th class="text-center">{header}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each tableSource.body as row, i}
									<tr
										onclick={() => rowFocusHandler(row[0])}
										onmouseover={() => rowFocusHandler(row[0])}
										onfocus={() => {}}
										class="relative"
										tabindex={i}
									>
										<td class="hidden">{row[0]}</td>
										<td class="">
											<div class="grid grid-cols-3 rounded-full space-x-1">
												<div class="rounded-full">
													<img class="h-10 object-contain rounded-2xl inline-table" src={items[i].imgSrc} alt="" />
												</div>

												<p class="font-semibold text-tertiary-300 text-lg col-span-2">{row[0]}</p>
											</div>
											{#if items[i].active === false}
												<div
													class="absolute w-full h-full flex items-center justify-center h3 text-primary-500 bg-surface-500/90 p-4 top-0 left-0"
												>
													Coming Soon!
													<img src={Lock} class="h-16 w-16 inline" alt="locked" />
												</div>
											{/if}
										</td>
										<td class="h-full">
											<p class="font-bold text-amber-500">{row[1]}</p>
										</td>
										<td class="align-middle text-center">{row[2]}</td>
										<td class="">
											<div class="h-full flex items-center justify-center">
												<button class="btn-icon" onclick={() => modifyCart(row[0], 'remove')}>
													<i class="fi fi-sr-square-minus"></i></button
												>
												<p>{userShoppingCart.itemList.filter((item) => item.name === row[0]).length}</p>
												<!-- <button class="btn-icon" on:click={() => quantityPlusClickHandler(tableSource, i)}>
												<i class="fi fi-sr-square-plus" />
											</button> -->
												<button class="btn-icon" onclick={() => modifyCart(row[0], 'add')}>
													<i class="fi fi-sr-square-plus"></i>
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr>
									<td class="h3 dark:text-yellow-500 text-primary-500">Total:</td>
									<td class="h3 dark:text-yellow-500 text-primary-500">{userShoppingCart.totalCost}</td>
								</tr>
							</tfoot>
						</table>
						<form method="POST" class="space-y-8" action="/turbotown/shop?/createItem" use:enhance>
							<!-- <button
								type="submit"
								disabled={userShoppingCart.itemList.length === 0}
								class="btn variant-filled-primary w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
								on:click={() => purchaseClickHandler()}>
								Purchase
							</button> -->
							<input type="hidden" name="turbotownID" value={data.town.turbotown.id} />
							<input type="hidden" name="shoppingCart" value={JSON.stringify(userShoppingCart)} />
							<button
								type="submit"
								disabled={userShoppingCart.itemList.length === 0}
								class="btn preset-filled-primary-500 w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
							>
								Purchase
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
