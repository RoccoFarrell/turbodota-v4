<script lang="ts">
	import { setContext, getContext, onMount } from 'svelte';
	import type { Hero, TurbotownQuest } from '@prisma/client';
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

	let account_id: number = $modalStore[0].meta.account_id;
	let turbotownID: number = $modalStore[0].meta.turbotownID;
	let seasonID: number = $modalStore[0].meta.seasonID;
    let quests: TurbotownQuest[] = $modalStore[0].meta.quests;

	$: console.log('LOGGGINGGGGG');
	$: console.log('heroes: ', heroes);
	$: console.log('account_id:', account_id);
	$: console.log('turbotownID: ', turbotownID);
	$: console.log('seasonID: ', seasonID);
    $: console.log('quests: ', quests);

	let currentQuestList: Array<any> = new Array<any>();
	$: console.log('CURRENT QUEST list: ', currentQuestList);

	currentQuestList = quests.filter(quest => quest.active).map(quest => quest)
    let temp2 = heroes.filter(hero => hero.id == currentQuestList[0].random.randomedHero)
    console.log("temp2", temp2[0].localized_name)

    let inputQuestID: number
    let inputrandomID : number

	function onFormSubmit(selectedQuestID: any, randomID: any): void {
        inputQuestID = selectedQuestID
        inputrandomID = randomID
        console.log("inputQuestID", inputQuestID)
        console.log("inputrandomID", inputrandomID)

		if ($modalStore[0].response) $modalStore[0].response(inputQuestID); //WHAT IS THIS, not using inputrandomID?
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
            <input type="hidden" name="inputQuestID" value={inputQuestID} />
            <input type="hidden" name="inputrandomID" value={inputrandomID} />
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
								{heroes.filter(hero => hero.id == quest.random.randomedHero)[0].localized_name}
							</h2>
                            <i class={`d2mh hero-${heroes.filter(hero => hero.id == quest.random.randomedHero)[0].id} scale-[3] m-12`}></i>
							<div class="flex items-center justify-center">
								<button class="btn variant-filled-primary w-full" on:click={() => onFormSubmit(quest.id, quest.randomID)}>
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
