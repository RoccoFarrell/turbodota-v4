<script lang="ts">
	//svelte
	import { blur } from 'svelte/transition';
	import type { SvelteComponent } from 'svelte';

	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { Modal, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, ModalStore } from '@skeletonlabs/skeleton';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { clickOutside } from '$lib/helpers/clickOutside.ts';
	//images
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import Lock from '$lib/assets/lock.png';
	import Observer from './Observer.svelte';

	const modalComponent: ModalComponent = { 
		ref: Observer,
		props: {test: 'test'}
	};

	const modalStore = getModalStore();
	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
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

	let userInventory: Array<ShopItem> = [];
	let availableItems: Array<ShopItem> = [];
	let selectedItem: ShopItem = new ShopItem();

	let lotusOrb: ShopItem = new ShopItem();
	lotusOrb = {
		id: 0,
		name: 'Lotus Orb',
		description: 'This item will reflect back any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/lotus_orb_lg.png',
		goldCost: 500,
		quantityAvailable: 10,
		active: false
	};

	let linkensSphere: ShopItem = new ShopItem();
	linkensSphere = {
		id: 1,
		name: "Linken's Sphere",
		description: 'This item will block any attempted debuff applied to you',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/sphere_lg.png',
		goldCost: 1000,
		quantityAvailable: 5,
		active: false
	};

	let observerWard: ShopItem = new ShopItem();
	observerWard = {
		id: 2,
		name: 'Observer Ward',
		description: 'This item will let you pick from a selection of 3 random heroes',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/ward_observer_lg.png',
		goldCost: 100,
		quantityAvailable: 100,
		active: true
	};

	let divineRapier: ShopItem = new ShopItem();
	divineRapier = {
		id: 3,
		name: 'Divine Rapier',
		description: 'This item delete a user from the current season.  Permadeath.',
		imgSrc: 'https://cdn.dota2.com/apps/dota2/images/items/rapier_lg.png',
		goldCost: 99999999,
		quantityAvailable: 1,
		active: false
	};

	availableItems.push(observerWard);
	availableItems.push(lotusOrb);
	availableItems.push(linkensSphere);
	availableItems.push(divineRapier);

	userInventory.push(observerWard);
	userInventory.push(lotusOrb);
	userInventory.push(linkensSphere);
	userInventory.push(divineRapier);

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Description', 'Quantity Available', 'Action'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(userInventory, ['name', 'description', 'quantityAvailable']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(userInventory, [
			'id',
			'name',
			'description',
			'imgSrc',
			'goldCost',
			'quantityAvailable',
			'active'
		])
		// Optional: A list of footer labels.
		//foot:
	};

	const rowFocusHandler = (itemName: string) => {
		selectedItem = availableItems.filter((item: ShopItem) => item.name === itemName)[0];
	};

	const useClickHandler = (item: any) => {
		console.log('in click', item);
		//toggleModal(Observer)
		modalStore.trigger(modal);
	};

	const handleClickOutside = () => {
		//
		//
		//------------- potential race condition, need to clear selectedItem after applying the item via database ------------------
		//
		//
		//selectedItem = new ShopItem();
	};

	$: console.log('modal Store', $modalStore);

	// let isFocused = false;
	// //const onFocus = () => (isFocused = true);

	// $: console.log(selectedItem)
	// $: console.log(isFocused)
	// $: (isFocused: boolean) => {
	// 	console.log(`isFocused ${isFocused}`)
	// 	if(!isFocused) selectedItem = new ShopItem();
	// 	console.log(`selectedItem`, selectedItem)
	// }

	//$: !isFocused ? selectedItem = new ShopItem() : ''
	// const onBlur =()=>isFocused=false;
	// const onFocus = (e: any) => {
	// 	console.log(e)
	// 	console.log(e.target.tabIndex)
	// 	console.log("in on Focus" , selectedItem)
	// 	isFocused = true
	// 	return isFocused
	// }
</script>

<div class="bg-surface-700 w-full h-full">
	<div class="flex h-full mx-auto w-full max-sm:mb-20">
		<div class="w-full grid grid-cols-4">
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md col-span-1">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Inventory</h3>
			</div>

			<div class="col-span-3">
				<table class="table table-hover table-interactive mb-4 table-compact">
					<thead>
						<tr>
							{#each tableSource.head as header, i}
								<th class="text-center">{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each tableSource.body as row, i}
							<tr class="relative" tabindex={i}>
								<!-- <tr
								on:click={() => rowFocusHandler(row[0])}
								on:focus={onFocus}
								on:blur={onBlur}
								class="relative focus:outline-none focus:ring focus:ring-red-500"
								tabindex={i}
							> -->
								<td>
									<div class="rounded-full flex space-x-4">
										<div class="rounded-full">
											<img class="h-8 object-contain rounded-2xl inline-table" src={availableItems[i].imgSrc} alt="" />
										</div>

										<p class="font-semibold text-tertiary-300 text-lg">{row[0]}</p>
									</div>
								</td>
								<td class="h-full">
									<p class="">{row[1]}</p>
								</td>
								<td class="align-middle text-center">{row[2]}</td>
								<button
									class="btn variant-filled-primary w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
									on:click={() => rowFocusHandler(row[0])}
									on:click={() => useClickHandler(selectedItem)}
									>Use
								</button>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
