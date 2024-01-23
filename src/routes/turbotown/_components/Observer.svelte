<script lang="ts">
	import { setContext, getContext, onMount } from 'svelte';
	import type { Hero, TurbotownStatus } from '@prisma/client';
	import type { SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';

	//skeleton
	import { ListBox, ListBoxItem, getModalStore } from '@skeletonlabs/skeleton';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';

	//images
	import Lock from '$lib/assets/lock.png';

	//stores
	import { townStore } from '$lib/stores/townStore';
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;

	console.log($quest1Store, $quest2Store, $quest3Store);

	const toastStore = getToastStore();

	const modalStore = getModalStore();

	let heroes: Hero[] = getContext('heroes');

	//not working
	//let account_id: number = getContext('account_id')
	//let statuses: TurbotownStatus[] = getContext('townStatuses') || []

	let account_id: number = $modalStore[0].meta.account_id;
	let turbotownID: number = $modalStore[0].meta.turbotownID;
	let statuses: TurbotownStatus[] = $modalStore[0].meta.statuses;
	let seasonID: number = $modalStore[0].meta.seasonID

	$: console.log('statuses: ', statuses);
	$: console.log('account_id:', account_id);

	let randomHeroList: Array<Hero> = new Array<Hero>();

	$: console.log('random hero list: ', randomHeroList);

	const generateRandomIndex = (exclude: number[] = []) => {
		let randomIndex = Math.floor(Math.random() * heroes.length);
		while (exclude.includes(randomIndex)) {
			randomIndex = Math.floor(Math.random() * heroes.length);
		}
		return randomIndex;
	};
	const generate3Randoms = async () => {
		let randomIndex1 = generateRandomIndex();
		let generatedRandomHero1 = heroes[randomIndex1];
		let randomIndex2 = generateRandomIndex([randomIndex1]);
		let generatedRandomHero2 = heroes[randomIndex2];
		let randomIndex3 = generateRandomIndex([randomIndex1, randomIndex2]);
		let generatedRandomHero3 = heroes[randomIndex3];
		console.log('random heroes:', generatedRandomHero1, generatedRandomHero2, generatedRandomHero3);

		randomHeroList.push(generatedRandomHero1);
		randomHeroList.push(generatedRandomHero2);
		randomHeroList.push(generatedRandomHero3);

		let postBody = {
			item: 'observer',
			info: randomHeroList.map((hero) => hero.id)
		};

		let response = await fetch(`/api/town/${account_id}/status`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(postBody)
		});

		let observerResponse = await response.json();

		console.log('response', observerResponse);

		if (observerResponse.turbotown.statuses.length > 0) {
			statuses = observerResponse.turbotown.statuses;
			let observerStatus = statuses.filter((status) => status.name === 'observer' && status.isActive === true)[0];
			if (observerStatus) {
				console.log('found an observer status');
				randomHeroList = [];
				JSON.parse(observerStatus.value).forEach((heroID: number) => {
					randomHeroList.push(heroes.filter((hero) => hero.id === heroID)[0]);
				});
			}
		}
	};

	/* 
		Set status in component
	*/
	//console.log('observer status: ', observerStatus)
	if (statuses.length > 0) {
		let observerStatus = statuses.filter((status) => status.name === 'observer' && status.isActive === true)[0];
		if (observerStatus) {
			console.log('found an observer status');
			JSON.parse(observerStatus.value).forEach((heroID: number) => {
				randomHeroList.push(heroes.filter((hero) => hero.id === heroID)[0]);
			});
		} else {
			generate3Randoms();
		}
	} else {
		generate3Randoms();
	}

	//select a random

	//$: console.log('rhl: ', randomHeroList);
	//set town store to first open slot
	let openStore: any;
	let openStoreSlot: number;
	if (!$quest1Store.randomedHero) {
		openStore = $quest1Store;
		openStoreSlot = 1;
	} else if (!$quest2Store.randomedHero) {
		openStore = $quest2Store;
		openStoreSlot = 2;
	} else if (!$quest3Store.randomedHero) {
		openStore = $quest3Store;
		openStoreSlot = 3;
	} else {
		openStore = null;
		openStoreSlot = -1;
		const t: ToastSettings = {
			message: `You already have 3 quest slots!`,
			background: 'variant-filled-error'
		};

		toastStore.trigger(t);
	}
	//console.log('quest store: ', openStore);
	let randomHeroSelect: Hero;
	// Handle Form Submission
	function onFormSubmit(inputHeroSelect: Hero): void {
		randomHeroSelect = inputHeroSelect;
		openStore.randomedHero = randomHeroSelect;

		if ($modalStore[0].response) $modalStore[0].response(inputHeroSelect);
		modalStore.close();

		const t: ToastSettings = {
			message: `Used Observer`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);
	}

	$: console.log(randomHeroSelect);
	//console.log(randomHeroList);
</script>

<div class="flex flex-col justify-center items-center">
	<div id="observerModal" class="h1 w-[50vw] card flex flex-col justify-center items-center p-4">
		<form method="POST" class="w-full" action="/turbotown?/useObserver" use:enhance>
			<input type="hidden" name="questStore" value={JSON.stringify(openStore)} />
			<input type="hidden" name="questStoreSlot" value={openStoreSlot} />
			<input type="hidden" name="turbotownID" value={turbotownID} />
			<input type="hidden" name="seasonID" value={seasonID}>
			<div class="flex flex-col justify-center w-full space-y-4">
				<div class="w-full flex justify-center">
					<p class="italic text-tertiary-600 text-sm">
						You pull out an odd stick from your backpack, it is covered in eyeballs. "Gross" you think to yourself...
					</p>
				</div>
				<h2 class="h2 text-center text-success-500">Select Your Random Hero!</h2>
				<div class="h-full w-full grid grid-cols-3 mx-auto my-4 p-4 gap-4">
					{#each randomHeroList as hero, i}
						<div
							class="card flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full p-4 shadow-sm shadow-primary-500"
						>
							<h2 class="h2 animate-pulse text-amber-600">
								{hero.localized_name}
							</h2>
							<i class={`d2mh hero-${hero.id} scale-[3] m-12`}></i>

							<div class="flex items-center justify-center">
								<button class="btn variant-filled-primary w-full" on:click={() => onFormSubmit(hero)}>
									<div class="italic">Select</div></button
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</form>
	</div>
</div>
