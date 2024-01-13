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
	import type { Hero } from '@prisma/client';
	import type { Item } from '@prisma/client';

	//images
	import shopkeeper from '$lib/assets/shopkeeper.png';
	import Lock from '$lib/assets/lock.png';
	import Observer from './Observer.svelte';

	export let items: Item[]

	const modalStore = getModalStore();

	const modalComponent: ModalComponent = {
		ref: Observer
	};

	const observerModal: ModalSettings = {
		type: 'component',
		component: modalComponent,
		response: (r: any) => {
			console.log(r);
		}
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

	let availableItems = items;
	let userInventory = items;

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

	const useClickHandler = (item: string) => {
		console.log('in click', item);
		//toggleModal(Observer)
		if (item === 'Observer Ward') {
			console.log('triggering modal in click handler');
			modalStore.trigger(observerModal);
		} else {
			console.log(item, ' is in development');
		}
	};

	//$: console.log('modal Store', $modalStore[0]);

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
									on:click={() => useClickHandler(row[0])}
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
