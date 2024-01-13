<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { Modal, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, ModalStore } from '@skeletonlabs/skeleton';
	import { ProgressBar } from '@skeletonlabs/skeleton';

	//images
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import Lock from '$lib/assets/lock.png';
	import type { Item } from '@prisma/client';
	import DataTableCheckbox from '../../routes/leagues/[slug]/seasons/[slug]/data-table-checkbox.svelte';

	export let data;
	let items: Item = data.items;

	console.log(data);
	let avatarURL = data.session.user.avatar_url.replace('.jpg', '_full.jpg');

	const modalStore = getModalStore();
	const modal: ModalSettings = {
		type: 'alert',
		// Data
		title: 'Purchase Confirmed',
		body: 'Thank you for purchasing, come again!'
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

	export let userShoppingCart: ShoppingCart = new ShoppingCart();

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
	//let selectedItem = new ShopItem();

	// const hoverHandler = (inputItem: ShopItem) => {
	// 	hoverItem.id = inputItem.id;
	// 	hoverItem.name = inputItem.name;
	// 	hoverItem.description = inputItem.description;
	// 	hoverItem.goldCost = inputItem.goldCost;

	// 	//console.log(activeItem);
	// };

	// const clickHandler = (inputItem: ShopItem) => {
	// 	console.log(selectedItems);
	// 	if (selectedItems.filter((item: ShopItem) => item.id == inputItem.id).length > 0) {
	// 		console.log('item detected');
	// 	} else {
	// 		console.log('item added');
	// 		selectedItems.push(inputItem);
	// 	}
	// 	console.log(selectedItems);
	// };

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

	const purchaseClickHandler = () => {
		modalStore.trigger(modal);
		userShoppingCart = new ShoppingCart();
	};

	//$: console.log('user cart: ', userShoppingCart);
	//$: console.log('table source: ', tableSource);
</script>

<div class="flex gap-4 mb-2 bg-surface-600/10 shadow-md justify-end">
	<img class="object-contain h-24 w-48" src={avatarURL} alt="" />

	<div>
		<p class="grid dark:text-red-500">
			{data.session.user.username}
		</p>

		<i class="fi fi-rr-coins text-yellow-500">
			{data.turbotown.metrics[0].value}
		</i>

		<p class="dark:text-yellow-500">
			XP: {data.turbotown.metrics[0].value}
		</p>
		<ProgressBar label="Progress Bar" value={50} max={100} />
	</div>
</div>

<div class="grid grid-cols-2 container p-4 gap-4">
	<div class="flex flex-col text-center w-full h-full justify-start space-y-4">
		<img class="px-8 h-64 max-w-full rounded-lg object-contain" src={shopkeeper} alt="" />
		<h1 class="h1 text-primary-700 max-md:font-bold">Welcome to the Turbo Town Secret Shop</h1>
		<div class="flex h-full mx-auto w-full max-sm:mb-20">
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
	</div>

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
									<div class="rounded-full flex space-x-4">
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
				<button
					disabled={userShoppingCart.itemList.length === 0}
					class="btn variant-filled-primary w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
					on:click={() => purchaseClickHandler()}>Purchase</button
				>
			</div>
		</div>
	</div>
</div>

<!-- <section class="flex justify-center gap-8">
    <div>
        <img
            class="h-auto max-w-full rounded-lg"
            on:mouseenter={() => hoverHandler(lotusOrb)}
            on:click={() => clickHandler(lotusOrb)}
            src={lotusOrb.imgSrc}
            alt=""
        />
    </div>
    <div>
        <img
            class="h-auto max-w-full rounded-lg"
            on:mouseenter={() => hoverHandler(linkensSphere)}
            on:click={() => clickHandler(linkensSphere)}
            src={linkensSphere.imgSrc}
            alt=""
        />
    </div>
    <div>
        <img
            class="h-auto max-w-full rounded-lg"
            on:mouseenter={() => hoverHandler(observerWard)}
            on:click={() => clickHandler(observerWard)}
            src={observerWard.imgSrc}
            alt=""
        />
    </div>
</section>
{#if selectedItems}
    <button
        disabled={false}
        class="btn variant-filled-primary w-full my-16 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
        >Purchase Item</button
    >
{:else}
    <button
        disabled={true}
        class="btn variant-filled-primary w-full my-16 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
        >Purchase Item</button
    >
{/if} -->
