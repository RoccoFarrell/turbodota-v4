<script lang="ts">
	import { run } from 'svelte/legacy';

	import { setContext, getContext, onMount } from 'svelte';
	import type { Hero, TurbotownQuest } from '@prisma/client';
	import type { SvelteComponent } from 'svelte';
	import { enhance } from '$app/forms';

	//skeleton
	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};

	//stores
	const toastStore = getContext<any>('toaster');
	
	// Helper function to create toasts with Skeleton v4 API
	function showToast(message: string, background?: string) {
		if (toastStore && typeof toastStore.trigger === 'function') {
			toastStore.trigger({
				message: message,
				background: background
			});
		}
	}

	interface Props {
		account_id: number;
		turbotownID: number;
		seasonID: number;
		quests: TurbotownQuest[];
		onClose?: () => void;
	}

	let { account_id, turbotownID, seasonID, quests, onClose }: Props = $props();
	let heroes: Hero[] = getContext('heroes');

	run(() => {
		console.log('LOGGGINGGGGG');
	});
	run(() => {
		console.log('heroes: ', heroes);
	});
	run(() => {
		console.log('account_id:', account_id);
	});
	run(() => {
		console.log('turbotownID: ', turbotownID);
	});
	run(() => {
		console.log('seasonID: ', seasonID);
	});
    run(() => {
		console.log('quests: ', quests);
	});

	let currentQuestList: Array<any> = $state(new Array<any>());
	run(() => {
		console.log('CURRENT QUEST list: ', currentQuestList);
	});

	currentQuestList = quests.filter(quest => quest.active).map(quest => quest)
    let temp2 = heroes.filter(hero => hero.id == currentQuestList[0].random.randomedHero)
    console.log("temp2", temp2[0].localized_name)

    let inputQuestID: number = $state()
    let inputrandomID : number = $state()

	function onFormSubmit(selectedQuestID: any, randomID: any): void {
        inputQuestID = selectedQuestID
        inputrandomID = randomID
        console.log("inputQuestID", inputQuestID)
        console.log("inputrandomID", inputrandomID)

		// Close modal after form submission
		onClose?.();

		showToast(`Used Quelling Blade`, 'preset-filled-success-500');
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
								<button class="btn preset-filled-primary-500 w-full" onclick={() => onFormSubmit(quest.id, quest.randomID)}>
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
