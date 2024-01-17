<script>
	import { Avatar, ProgressBar } from '@skeletonlabs/skeleton';

	//components
	import TurbotownIntro from '$lib/components/TurbotownIntro.svelte';
	//images
	import Knight from '$lib/assets/knight.png';
	import Quest from '$lib/assets/questIcon.png';
	import Town from '$lib/assets/turbotown_dark.png';
	import Observer from '$lib/assets/item_observer.png';
</script>


<div class="">
	<TurbotownIntro/>
</div>


<!-- <div class="space-y-8 w-full flex flex-col">
	<div class="bg-gradient-to-b dark:from-primary-900 from-primary-500/60 dark:to-surface-900/10 light:to-surface-100/10 px-4 py-10">
		<div class="flex flex-col items-center w-full text-center space-y-4">
			<img src={Knight} class="ml-8 max-h-32 aspect-square" alt="knight" />
			<h1 id="homeHeader" class="h1 text-primary-500 font-bold" data-testid="homeHeader">Welcome Turbodota challenger!</h1>
		</div>
	</div>

	<div class="mx-auto flex flex-col justify-center items-center pb-10 lg:max-w-[50%] md:max-w-[75%] max-md:max-w-[90%]">
		<p class="text-center text-xl">
			An adventure awaits the weary souls who've wandered this path. Tired from the slog of full
			Dota and 70 minute grinders, Turbodota.com unlocks a new quest chain in the Defense of the
			Ancients.
		</p>
		<section class="flex flex-col w-full space-y-8 my-8">
			<div class="grid grid-cols-2 place-items-center">
				<a href="/random" class="">
					<img src={Quest} class="ml-8 w-1/2 max-h-32 aspect-square" alt="knight" />
				</a>
				<div class="flex text-center items-center m-auto">
					<div class="italic">Challenge yourself with Random Heroes, earn gold and prestige!</div>
				</div>
			</div>
			<div class="border-b border-primary-400 border-dashed w-full"></div>
			<div class="my-1 flex-col space-y-4">
				<div class="grid grid-cols-2 place-items-center">
					<div class="flex text-center items-center m-auto">
						<div class="italic">Become the mayor of Turbotown in a new hybrid Dota + idle game</div>
					</div>
					<a href="/turbotown">
						<img src={Town} class="mx-auto w-3/4 md:w-1/2" alt="turbo town logo" />
					</a>
				</div>
				<div class="flex flex-col space-y-2">
					<p class="text-sm text-primary-500 text-center italic">Training your last hitting...</p>
					<ProgressBar value={undefined} class="text-primary-500 fill-primary-500" />
				</div>
			</div>
			<div class="border-b border-primary-400 border-dashed w-full"></div>
			<div class="grid grid-cols-2 place-items-center my-4">
				<a href="/herostats">
					<img src={Observer} class="ml-8 max-h-32 aspect-square" alt="observer wardt" />
				</a>
				<div class="flex text-center items-center m-auto">
					<div class="italic">Keep track of your friend's stats with the dynamic Heroes table</div>
				</div>
			</div>
		</section>
	</div>
</div> -->
