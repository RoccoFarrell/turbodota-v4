<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { enhance } from '$app/forms';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { Modal, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, ModalStore } from '@skeletonlabs/skeleton';
	import { ProgressBar } from '@skeletonlabs/skeleton';

	//images
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import Lock from '$lib/assets/lock.png';
	import type { Item } from '@prisma/client';
	import DataTableCheckbox from '../../leagues/[slug]/seasons/[slug]/data-table-checkbox.svelte';

	export let data: any;
	export let form: any;

	let items: Item[] = data.town.items;

	const modalStore = getModalStore();
	const purchaseConfirmModal: ModalSettings = {
		type: 'alert',
		// Data
		title: 'Purchase Confirmed',
		body: 'Thank you for purchasing, come again!'
	};

	const purchaseDeniedModal: ModalSettings = {
		type: 'alert',
		// Data
		title: 'Purchase Failed',
		body: 'Not enough gold for purchase!'
	};

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

	let userShoppingCart: ShoppingCart = new ShoppingCart();

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Gold', 'Quantity Available', 'Quantity'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(items, ['name', 'goldCost', 'quantityAvailable']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(items, ['id', 'name', 'description', 'imgSrc', 'goldCost', 'quantityAvailable', 'active'])
		// Optional: A list of footer labels.
		//foot:
	};

	let selectedDetailItem = new ShopItem();

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

	$: clearCart(form)
	const clearCart = (form: any) => {
		if(form && form.success){
			userShoppingCart.itemList = [],
			userShoppingCart.totalCost = 0
		}
	}

	const purchaseClickHandler = () => {
		if (data.town.turbotown.metrics[0].value >= userShoppingCart.totalCost) {
			//user has enough gold for purchase
			modalStore.trigger(purchaseConfirmModal);
			userShoppingCart = new ShoppingCart();
		} else {
			modalStore.trigger(purchaseDeniedModal);
		}
	};

	//$: console.log('user cart: ', userShoppingCart);
	//$: console.log('table source: ', tableSource);
</script>

{#if data.town.turbotown}
	<div id="shopComponent" class="w-full grid grid-cols-3 container gap-4">
		<!-- Shop keeper image -->
		<div class="text-center w-full h-full justify-start space-y-4 px-1">
			<div class="h-full mx-auto w-full max-sm:mb-20">
				<img
					class="max-w-full rounded-3xl object-contain shadow-amber-500 shadow-[0_0_10px_1px]"
					src={shopkeeper}
					alt=""
				/>
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
						<table class="table table-hover table-interactive table-compact">
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
										on:click={() => rowFocusHandler(row[0])}
										on:mouseover={() => rowFocusHandler(row[0])}
										on:focus={() => {}}
										class="relative"
										tabindex={i}
									>
										<td class="hidden">{row[0]}</td>
										<td class="">
											<div class="grid grid-cols-2 rounded-full space-x-1">
												<div class="rounded-full">
													<img class="h-10 object-contain rounded-2xl inline-table" src={items[i].imgSrc} alt="" />
												</div>

												<p class="font-semibold text-tertiary-300 text-lg">{row[0]}</p>
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
												<button class="btn-icon" on:click={() => modifyCart(row[0], 'remove')}>
													<i class="fi fi-sr-square-minus" /></button
												>
												<p>{userShoppingCart.itemList.filter((item) => item.name === row[0]).length}</p>
												<!-- <button class="btn-icon" on:click={() => quantityPlusClickHandler(tableSource, i)}>
												<i class="fi fi-sr-square-plus" />
											</button> -->
												<button class="btn-icon" on:click={() => modifyCart(row[0], 'add')}>
													<i class="fi fi-sr-square-plus" />
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
							<input type="hidden" name="turbotownID" value={data.town.turbotown.id}/>
							<input type="hidden" name="shoppingCart" value={JSON.stringify(userShoppingCart)}/>
							<button
								type="submit"
								disabled={userShoppingCart.itemList.length === 0}
								class="btn variant-filled-primary w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
								>
								Purchase
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
		<div
			class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
		>
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Details</h3>
				<p class="text-m text-center">Hover over an item to see its details</p>
			</div>
			<!-- {#if activeItem.id !== -1} -->
			<p class="text-m text-left">Item: {selectedDetailItem.name}</p>
			<p class="text-m text-left">Description: {selectedDetailItem.description}</p>
			<p class="text-m text-left dark:text-yellow-500">Gold Cost: {selectedDetailItem.goldCost}</p>
		</div>
	</div>
{/if}
