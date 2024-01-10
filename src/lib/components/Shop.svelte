<script lang="ts">
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { Modal, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, ModalStore } from '@skeletonlabs/skeleton';

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
	}

	class ShoppingCart {
		itemList: Array<ShopItem> = [];
		totalCost: number = 0;
	}

	let userShoppingCart: ShoppingCart = new ShoppingCart();
	let availableItems: Array<ShopItem> = [];

	let lotusOrb: ShopItem = new ShopItem();
	lotusOrb = {
		id: 0,
		name: 'Lotus Orb',
		description: 'This item will reflect back any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/lotus_orb_lg.png',
		goldCost: 500,
		quantityAvailable: 10
	};

	let linkensSphere: ShopItem = new ShopItem();
	linkensSphere = {
		id: 1,
		name: "Linken's Sphere",
		description: 'This item will block any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/sphere_lg.png',
		goldCost: 1000,
		quantityAvailable: 5
	};

	let observerWard: ShopItem = new ShopItem();
	observerWard = {
		id: 2,
		name: 'Observer Ward',
		description: 'This item will let you pick from a selection of 3 random heroes',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/ward_observer_lg.png',
		goldCost: 100,
		quantityAvailable: 100
	};

	availableItems.push(lotusOrb);
	availableItems.push(linkensSphere);
	availableItems.push(observerWard);

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Gold', 'Quantity Available', 'Quantity'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(availableItems, ['name', 'goldCost', 'quantityAvailable']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(availableItems, ['id', 'name', 'description', 'imgSrc', 'goldCost', 'quantityAvailable'])
		// Optional: A list of footer labels.
		//foot: ['Total', '', '<code class="code">5</code>']
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

	const quantityMinusClickHandler = (inputTableSource: TableSource, inputRow: number) => {
		//let itemSubstract = availableItems.filter((item: ShopItem) => item.id == Number(inputTableSource.meta[inputRow][0]))
		const findIndex = userShoppingCart.itemList.findIndex(
			(item) => item.id === Number(inputTableSource.meta[inputRow][0])
		);
		let goldCost = Number(inputTableSource.meta[inputRow][4]);

		if (findIndex !== -1) {
			userShoppingCart.itemList.splice(findIndex, 1);
			userShoppingCart.totalCost -= goldCost;
		}

		//console.log('shopping cart', userShoppingCart.itemList);
		//console.log('total cost', userShoppingCart.totalCost);
	};

	const quantityPlusClickHandler = (inputTableSource: TableSource, inputRow: number) => {
		const findIndex = availableItems.findIndex((item) => item.id === Number(inputTableSource.meta[inputRow][0]));
		let itemAdd = availableItems.filter((item: ShopItem) => item.id == Number(inputTableSource.meta[inputRow][0]));
		let goldCost = Number(inputTableSource.meta[inputRow][4]);

		if (
			itemAdd[0].quantityAvailable >
			userShoppingCart.itemList.filter((item: ShopItem) => item.id == Number(inputTableSource.meta[inputRow][0])).length
		) {
			userShoppingCart.itemList.push(itemAdd[0]);
			userShoppingCart.totalCost += goldCost;
		}

		//console.log('shopping cart', userShoppingCart.itemList);
		//console.log('total cost', userShoppingCart.totalCost);
	};

	const rowClickHandler = (inputTableSource: TableSource, inputRow: number) => {
		selectedDetailItem.id = Number(inputTableSource.meta[inputRow][0]);
		selectedDetailItem.name = inputTableSource.meta[inputRow][1];
		selectedDetailItem.description = inputTableSource.meta[inputRow][2];
		selectedDetailItem.goldCost = Number(inputTableSource.meta[inputRow][4]);
	};

	const purchaseClickHandler = () => {
		modalStore.trigger(modal);
		userShoppingCart = new ShoppingCart();
	};
</script>

<div
	class="text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2 w-full"
>
	<div class="flex flex-col md:flex-row items-center text-center w-full justify-center">
		<h1 class="h1 text-primary-700 max-md:font-bold">Welcome to the Turbo Town Secret Shop</h1>
		<img class="px-8 h-64 max-w-full rounded-lg" src={shopkeeper} alt="" />
	</div>

	<div class="flex md:m-4 y-4 h-full mx-auto w-full max-sm:mb-20">
		<div
			class="md:w-full my-4 max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
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
				<table class="table table-hover table-interactive">
					<thead>
						<tr>
							{#each tableSource.head as header, i}
								<th>{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each tableSource.body as row, i}
							<tr on:click={() => rowClickHandler(tableSource, i)}>
								<td class="text-left"><img class="h-auto max-w-full rounded-lg inline-table" src={availableItems[i].imgSrc} alt="" />{row[0]}</td>
								<td>{row[1]}</td>
								<td>{row[2]}</td>
								<td
									><button class="btn-icon" on:click={() => quantityMinusClickHandler(tableSource, i)}>
										<i class="fi fi-sr-square-minus" /></button
									>
									{userShoppingCart.itemList.filter((item) => item.id == Number(tableSource.meta[i][0])).length}
									<button class="btn-icon" on:click={() => quantityPlusClickHandler(tableSource, i)}>
										<i class="fi fi-sr-square-plus" /></button
									></td
								>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td>Total {userShoppingCart.totalCost}</td>
						</tr>
					</tfoot>
				</table>
				{#if userShoppingCart.itemList.length > 0}
					<button
						disabled={false}
						class="btn variant-filled-primary w-full my-16 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
						on:click={() => purchaseClickHandler()}>Purchase</button
					>
				{:else}
					<button
						disabled={true}
						class="btn variant-filled-primary w-full my-16 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
						>Purchase</button
					>
				{/if}
			</div>
		</div>
		<div class="flex md:m-4 px-8 my-4 h-full mx-auto w-full max-sm:mb-20">
			<div
				class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
			>
				<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
					<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Details</h3>
					<p class="text-m text-center">Click an item to see its details</p>

				</div>
				<!-- {#if activeItem.id !== -1} -->
				<p class="text-m text-left">Item: {selectedDetailItem.name}</p>
				<p class="text-m text-left">Description: {selectedDetailItem.description}</p>
				<p class="text-m text-left dark:text-yellow-500">Gold Cost: {selectedDetailItem.goldCost}</p>
			</div>
		</div>
	</div>
</div>

<Modal />

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
