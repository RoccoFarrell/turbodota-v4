<script lang="ts">
	//svelte
	import { blur } from 'svelte/transition';
	import type { SvelteComponent } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';

	//skeleton
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
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	// Import Modal component (Skeleton v3)
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	//prisma
	import type { Turbotown, TurbotownItem, TurbotownStatus } from '@prisma/client';

	//stores
	import { townStore } from '$lib/stores/townStore';
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;
	const toastStore = getContext<any>('toaster');
	
	// Helper function to create toasts with Skeleton v3 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.create === 'function') {
			toastStore.create({
				title: message,
				description: '',
				type: background?.includes('error') ? 'error' : 
				       background?.includes('success') ? 'success' : 
				       background?.includes('warning') ? 'warning' : 'info',
				meta: { background }
			});
		} else {
			console.error('ToastStore not available from context');
		}
	}

	//components
	import Observer from './Observer.svelte';
	import Linkens from './Linkens.svelte';
	import QuellingBlade from './QuellingBlade.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();
	if (browser) {
		console.log('data in inventory: ', data);
	}

	let items: TurbotownItem[] = data.town.turbotown.items;

	// Modal state (Skeleton v3)
	let showObserverModal = $state(false);
	let showLinkensModal = $state(false);
	let showQuellingBladeModal = $state(false);

	class InventoryItem {
		id: number = -1;
		name: string = '';
		description: string = '';
		imgSrc: string = '';
		quantity: number = 0;
		status: string = '';
	}

	let userInventory: Array<InventoryItem> = new Array();
	let allItems = items.map((item: any) => item.item);
	let itemListReduced = allItems.filter(
		(value, index, self) => index === self.findIndex((t) => t.place === value.place && t.name === value.name)
	);

	itemListReduced.forEach((item, i) => {
		let pushObj: any = {
			id: item.id,
			name: item.name,
			description: item.description,
			imgSrc: item.imgSrc,
			quantity: items.filter((e: any) => e.itemID === item.id).length,
			status: item.status
		};

		userInventory.push(pushObj);
	});

	const tableSource: TableSource = {
		// A list of heading labels.
		head: ['Item Name', 'Description', 'Quantity', 'Action'],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(userInventory, ['name', 'description', 'quantity', 'imgSrc']),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		meta: tableMapperValues(userInventory, ['id', 'name', 'description', 'imgSrc', 'goldCost', 'quantity', 'active'])
		// Optional: A list of footer labels.
		//foot:
	};

	const useClickHandler = (item: string) => {
		if (item === 'Observer Ward') {
			if ($quest1Store.randomedHero && $quest2Store.randomedHero && $quest3Store.randomedHero) {
				showToast('You already have 3 quest slots!', 'preset-filled-error-500');
			} else {
				showObserverModal = true;
			}
		} else if (item == "Linken's Sphere") {
			showLinkensModal = true;
		} else if (item == "Quelling Blade") {
			if (!$quest1Store.randomedHero && !$quest2Store.randomedHero && !$quest3Store.randomedHero) {
				showToast('You have no quests to quell!', 'preset-filled-error-500');
			}
			else {
				showQuellingBladeModal = true;
			}
			
		} else {
			console.log(item, 'is in development');
		}
	};
</script>

<div class="w-full h-full z-40">
	<div class="flex h-full mx-auto w-full max-sm:mb-20 my-8">
		<div class="w-full flex p-2">
			<!-- <div class="mb-2 p-4 rounded-full w-4/5 mx-auto shadow-md col-span-1">
				<h3 class="h3 dark:text-yellow-500 text-primary-500 text-center">Inventory</h3>
			</div> -->

			<div class="w-3/4 mx-auto px-4 bg-surface-900">
				<table class="table  table-interactive mb-4 table-compact z-50 relative">
					<thead>
						<tr>
							{#each tableSource.head as header, i}
								<th>{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each tableSource.body as row, i}
							<tr class="relative h-10" tabindex={i}>
								<td style={'vertical-align: middle;'}>
									<div class="rounded-full flex space-x-4">
										<div class="rounded-full">
											<img class="h-8 object-contain rounded-2xl inline-table" src={row[3]} alt="" />
										</div>

										<p class="font-semibold text-tertiary-300 text-lg">{row[0]}</p>
									</div>
								</td>
								<td style={'vertical-align: middle;'}>
									<div class="flex items-center h-full">{row[1]}</div>
								</td>
								<td style={'vertical-align: middle;'}>{row[2]}</td>
								<td style={'vertical-align: middle;'}>
									<button
										type="submit"
										class="btn preset-filled-primary-500 w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
										onclick={() => useClickHandler(row[0])}
										>Use
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
	<div class="z-30 bg-leather opacity-25 h-full w-full absolute top-16"></div>
	<div class="z-20 bg-surface-900 h-full w-full absolute top-16"></div>
</div>

<!-- Skeleton v3 Modals -->
{#if showObserverModal}
	<Modal 
		open={showObserverModal} 
		onOpenChange={(details) => showObserverModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<Observer
				account_id={data.session.user.account_id}
				statuses={data.town.turbotown.statuses}
				turbotownID={data.town.turbotown.id}
				seasonID={data.league.seasonID}
				onClose={() => showObserverModal = false}
			/>
		{/snippet}
	</Modal>
{/if}

{#if showLinkensModal}
	<Modal 
		open={showLinkensModal} 
		onOpenChange={(details) => showLinkensModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<Linkens
				account_id={data.session.user.account_id}
				allTurbotowns={data.league.currentSeason.turbotowns}
				turbotownID={data.town.turbotown.id}
				turbotownUsers={data.league.currentSeason.turbotowns}
				onClose={() => showLinkensModal = false}
			/>
		{/snippet}
	</Modal>
{/if}

{#if showQuellingBladeModal}
	<Modal 
		open={showQuellingBladeModal} 
		onOpenChange={(details) => showQuellingBladeModal = details.open}
		backdropBackground="bg-black/50"
		contentBackground="bg-surface-900"
	>
		{#snippet content()}
			<QuellingBlade
				account_id={data.session.user.account_id}
				turbotownID={data.town.turbotown.id}
				seasonID={data.league.seasonID}
				quests={data.town.turbotown.quests}
				onClose={() => showQuellingBladeModal = false}
			/>
		{/snippet}
	</Modal>
{/if}
