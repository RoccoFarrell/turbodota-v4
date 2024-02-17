<script lang="ts">
	//svelte
	import { blur } from 'svelte/transition';
	import type { SvelteComponent } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';

	//skeleton
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import { Modal, getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, ModalStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';

	//prisma
	import type { Turbotown, TurbotownItem, TurbotownStatus } from '@prisma/client';

	//stores
	import { townStore } from '$lib/stores/townStore';
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;
	const toastStore = getToastStore();

	//components
	import Observer from './Observer.svelte';
	import Linkens from './Linkens.svelte';
	import QuellingBlade from './QuellingBlade.svelte';
	import SpiritVessel from './SpiritVessel.svelte';
	import LotusOrb from './LotusOrb.svelte';
	import EtherealBlade from './EtherealBlade.svelte';
	import Orchid from './Orchid.svelte';
	import Nullifier from './Nullifier.svelte';

	export let data: any;
	if (browser) {
		console.log('data in inventory: ', data);
	}

	let items: TurbotownItem[] = data.town.turbotown.items;

	const modalStore = getModalStore();

	const observerModalComponent: ModalComponent = {
		ref: Observer
	};

	const observerModal: ModalSettings = {
		type: 'component',
		component: observerModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			statuses: data.town.turbotown.statuses,
			turbotownID: data.town.turbotown.id,
			seasonID: data.league.seasonID
		},
		response: (r: any) => {
		}
	};

	const quellingBladeModalComponent: ModalComponent = {
		ref: QuellingBlade
	};

	const quellingBladeModal: ModalSettings = {
		type: 'component',
		component: quellingBladeModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			turbotownID: data.town.turbotown.id,
			seasonID: data.league.seasonID,
			quests: data.town.turbotown.quests
		},
		response: (r: any) => {
		}
	};

	const linkensModalComponent: ModalComponent = {
		ref: Linkens
	};

	const spiritVesselModalComponent: ModalComponent = {
		ref: SpiritVessel
	};

	const lotusOrbModalComponent: ModalComponent = {
		ref: LotusOrb
	};

	const etherealBladeModalComponent: ModalComponent = {
		ref: EtherealBlade
	};

	const orchidModalComponent: ModalComponent = {
		ref: Orchid
	};

	const nullifierModalComponent: ModalComponent = {
		ref: Nullifier
	};

	// let allStatuses: TurbotownStatus[][] = [];

	// data.league.currentSeason.turbotowns.forEach((turbotown: any, i: number) => {
	// 	turbotown.statuses.forEach((status: any) => {
	// 		if (allStatuses[i] === undefined) {
	// 			allStatuses[i] = [];
	// 		}
	// 		allStatuses[i].push(status)
	// 	});
	// });

	// console.log(allStatuses)

	const linkensModal: ModalSettings = {
		type: 'component',
		component: linkensModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

	const spiritVesselModal: ModalSettings = {
		type: 'component',
		component: spiritVesselModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

	const lotusOrbModal: ModalSettings = {
		type: 'component',
		component: lotusOrbModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

	const etherealBladeModal: ModalSettings = {
		type: 'component',
		component: etherealBladeModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

	const orchidModal: ModalSettings = {
		type: 'component',
		component: orchidModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

	const nullifierModal: ModalSettings = {
		type: 'component',
		component: nullifierModalComponent,
		meta: {
			account_id: data.session.user.account_id,
			allTurbotowns: data.league.currentSeason.turbotowns,
			turbotownID: data.town.turbotown.id,
			turbotownUsers: data.league.currentSeason.turbotowns
		},
		response: (r: any) => {
		}
	};

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
				const t: ToastSettings = {
					message: `You already have 3 quest slots!`,
					background: 'variant-filled-error'
				};
				toastStore.trigger(t);
			} else {
				modalStore.trigger(observerModal);
			}
		} else if (item == "Linken's Sphere") {
			modalStore.trigger(linkensModal);
		} else if (item == "Quelling Blade") {
			if (!$quest1Store.randomedHero && !$quest2Store.randomedHero && !$quest3Store.randomedHero) {
				const t: ToastSettings = {
					message: `You have no quests to quell!`,
					background: 'variant-filled-error'
				};
				toastStore.trigger(t);
			}
			else {
				modalStore.trigger(quellingBladeModal);
			}
			
		} else if (item == "Spirit Vessel") {
			modalStore.trigger(spiritVesselModal);		
		}
		else if (item == "Lotus Orb") {
			modalStore.trigger(lotusOrbModal);		
		}
		else if (item == "Ethereal Blade") {
			modalStore.trigger(etherealBladeModal);		
		}
		else if (item == "Orchid Malevolence") {
			modalStore.trigger(orchidModal);		
		}
		else if (item == "Nullifier") {
			modalStore.trigger(nullifierModal);		
		}
		else {
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
				<table class="table table-hover table-interactive mb-4 table-compact z-50 relative">
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
										class="btn variant-filled-primary w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:my-8 max-lg:mx-4 max-lg:max-w-[90%] md:max-w-[80%]"
										on:click={() => useClickHandler(row[0])}
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
	<div class="z-30 bg-leather opacity-25 h-full w-full absolute top-16" />
	<div class="z-20 bg-surface-900 h-full w-full absolute top-16" />
</div>
