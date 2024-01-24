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

	//stores
	const toastStore = getToastStore();

	const modalStore = getModalStore();

	let heroes: Hero[] = getContext('heroes');

	import { townStore } from '$lib/stores/townStore';
	let quest1Store = $townStore.quests.quest1;
	let quest2Store = $townStore.quests.quest2;
	let quest3Store = $townStore.quests.quest3;
	console.log('quest1Store', $quest1Store.randomedHero);
    console.log('$townStore.quests', $townStore.quests.quest1)

	let account_id: number = $modalStore[0].meta.account_id;
	let turbotownID: number = $modalStore[0].meta.turbotownID;
	let statuses: TurbotownStatus[] = $modalStore[0].meta.statuses;
	let seasonID: number = $modalStore[0].meta.seasonID;

	$: console.log('LOGGGINGGGGG');
	$: console.log('heroes: ', heroes);
	$: console.log('statuses: ', statuses);
	$: console.log('account_id:', account_id);
	$: console.log('turbotownID: ', turbotownID);
	$: console.log('seasonID: ', seasonID);

	let currentQuestList: Array<any> = new Array<any>();
	$: console.log('random hero list: ', currentQuestList);

	//currentHeroList = quests.filter(quest => quest.active).map(quest => quest.random.randomedHero)

	if ($quest1Store.randomedHero) {
		currentQuestList.push($quest1Store);
	}
	if ($quest2Store.randomedHero) {
		currentQuestList.push($quest2Store);
	}
	if ($quest3Store.randomedHero) {
		currentQuestList.push($quest3Store);
	}

    let selectedHeroID: number

	function onFormSubmit(inputQuestSelect: any): void {
        console.log(inputQuestSelect)
        selectedHeroID = inputQuestSelect
        console.log("selectedHeroID", selectedHeroID)

		if ($modalStore[0].response) $modalStore[0].response(selectedHeroID);
		modalStore.close();

		const t: ToastSettings = {
			message: `Used Quelling Blade`,
			background: 'variant-filled-success'
		};

		toastStore.trigger(t);
	}
</script>

<div class="flex flex-col justify-center items-center">
	<div id="quellingbladeModal" class="h1 w-[50vw] card flex flex-col justify-center items-center p-4">
		<form method="POST" class="w-full" action="/turbotown?/useQuellingBlade" use:enhance>
			<input type="hidden" name="turbotownID" value={turbotownID} />
			<input type="hidden" name="seasonID" value={seasonID} />
            <input type="hidden" name="selectedHeroID" value={selectedHeroID} />
			<div class="flex flex-col justify-center w-full space-y-4">
				<div class="w-full flex justify-center">
					<p class="italic text-tertiary-600 text-sm">
						You pull out an old worn down hatchet from your backpack. "I hate this stupid hero" you think to yourself...
					</p>
				</div>
				<h2 class="h2 text-center text-success-500">Select Your Quest To Destroy!</h2>
				<div class="h-full w-full grid grid-cols-3 mx-auto my-4 p-4 gap-4">
					{#each currentQuestList as quest, i}
						<div
							class="card flex flex-col justify-center items-center w-full relative z-0 rounded-xl h-full p-4 shadow-sm shadow-primary-500"
						>
							<h2 class="h2 animate-pulse text-amber-600">
								{quest.randomedHero.localized_name}
							</h2>
							<i class={`d2mh hero-${quest.randomedHero.id} scale-[3] m-12`}></i>

							<div class="flex items-center justify-center">
								<button class="btn variant-filled-primary w-full" on:click={() => onFormSubmit(quest.randomedHero.id)}>
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
