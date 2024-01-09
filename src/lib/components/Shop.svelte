<script lang="ts">
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';

	class ShopItem {
		id: number = -1;
		name: string = '';
		description: string = '';
		imgSrc: string = '';
		goldCost: number = 0;
		quantity: number = 0;
	}

	let availableItems: Array<ShopItem> = [];
	let selectedItems: Array<ShopItem> = [];

	let lotusOrb: ShopItem = new ShopItem();
	lotusOrb = {
		id: 0,
		name: 'Lotus Orb',
		description: 'This item will reflect back any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/lotus_orb_lg.png',
		goldCost: 500,
		quantity: 0
	};

	let linkensSphere: ShopItem = new ShopItem();
	linkensSphere = {
		id: 1,
		name: "Linken's Sphere",
		description: 'This item will block any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/sphere_lg.png',
		goldCost: 1000,
		quantity: 0
	};

	let observerWard: ShopItem = new ShopItem();
	observerWard = {
		id: 2,
		name: 'Observer Ward',
		description: 'This item will let you pick from a selection of 3 random heroes',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/ward_observer_lg.png',
		goldCost: 100,
		quantity: 0
	};

	availableItems.push(lotusOrb);
	availableItems.push(linkensSphere);
	availableItems.push(observerWard);

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Gold', 'Quantity'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(availableItems, ['name', 'goldCost', 'quantity']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(availableItems, ['id', 'name', 'description', 'imgSrc', 'goldCost', 'quantity'])
		// Optional: A list of footer labels.
		//foot: ['Total', '', '<code class="code">5</code>']
	};

	console.log(availableItems);

	let hoverItem = new ShopItem();
	//let selectedItem = new ShopItem();

	// const hoverHandler = (inputItem: ShopItem) => {
	// 	hoverItem.id = inputItem.id;
	// 	hoverItem.name = inputItem.name;
	// 	hoverItem.description = inputItem.description;
	// 	hoverItem.goldCost = inputItem.goldCost;

	// 	//console.log(activeItem);
	// };

	const clickHandler = (inputItem: ShopItem) => {
		console.log(selectedItems);
		if (selectedItems.filter((item: ShopItem) => item.id == inputItem.id).length > 0) {
			console.log('item detected');
		} else {
			console.log('item added');
			selectedItems.push(inputItem);
		}
		console.log(selectedItems);
	};

    const quantityPlusClickHandler = () => {
        
    }

    const quantityMinusClickHandler = () => {
        
    }

    const rowClickHandler = (inputTableSource: TableSource, inputRow: number) => {
        console.log(inputTableSource.meta[inputRow])
        hoverItem.id = inputTableSource.meta[inputRow][0];
		hoverItem.name = inputTableSource.meta[inputRow][1];
		hoverItem.description = inputTableSource.meta[inputRow][2];
		hoverItem.goldCost = inputTableSource.meta[inputRow][4];
    }

	console.log(availableItems.filter((item: any) => item.name == 'Lotus Orb')[0].imgSrc);
</script>

<div
	class="text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2 w-full"
>
	<img class="h-auto max-w-full rounded-lg" src={shopkeeper} alt="" />
</div>

<div class="flex md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div
		class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
	>
		<!-- Auto Bans -->
		<div>
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Items</h3>
			</div>
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
							<td><img class="h-auto max-w-full rounded-lg" src={availableItems[i].imgSrc} alt="" />{row[0]}</td>
							<td>{row[1]}</td>
							<td
								><button class="btn-icon" on:click={quantityPlusClickHandler}> <i class="fi fi-sr-square-minus" /></button>
								{row[2]} <button class="btn-icon" on:click={quantityMinusClickHandler}> <i class="fi fi-sr-square-plus" /></button></td
							>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td>Total</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</div>

<div class="container items-justify-center md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div
		class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
	>
		<!-- Auto Bans -->
		<div class="group">
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Details</h3>
			</div>
			<!-- {#if activeItem.id !== -1} -->
			<p class="text-m text-left">Item: {hoverItem.name}</p>
			<p class="text-m text-left">Description: {hoverItem.description}</p>
			<p class="text-m text-left dark:text-yellow-500">Gold Cost: {hoverItem.goldCost}</p>
			<!-- {/if} -->
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
