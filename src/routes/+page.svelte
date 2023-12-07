<script>
	import { Avatar, ProgressBar } from '@skeletonlabs/skeleton';

	import Knight from '$lib/assets/knight.png';
	import Quest from '$lib/assets/questIcon.png';
	import Town from '$lib/assets/turbotowndark.png';
	import Observer from '$lib/assets/item_observer.png';
</script>

<div class="container space-y-8">
	<div class="bg-gradient-to-b from-primary-900 to-surface-500/10 p-4">
		<div class="flex flex-col items-center w-full text-center space-y-4">
			<img src={Knight} class="ml-8 max-h-32 aspect-square" alt="knight" />
			<h1 class="h1 text-primary-500 font-bold">Welcome Turbodota challenger!</h1>
		</div>
	</div>

	<div class="m-4 md:m-8 pb-10">
		<p class="text-center font-semibold">
			An adventure awaits the weary souls who've wandered this path. Tired from the slog of full
			Dota and 70 minute grinders, Turbodota.com unlocks a new quest chain in the Battle of the
			Ancients.
		</p>
		<section class="flex flex-col w-full space-y-8 my-4">
			<div class="grid grid-cols-2 place-items-center">
				<a href="/random" class="">
					<img src={Quest} class="ml-8 w-1/2 max-h-32 aspect-square" alt="knight" />
				</a>
				<div class="flex text-center items-center m-auto">
					<div>Challenge yourself with Random Heroes, earn gold and prestige!</div>
				</div>
			</div>
			<div class="border-b border-primary-400 border-dashed w-full"></div>
			<div class="my-1 flex-col space-y-4">
				<div class="grid grid-cols-2 place-items-center">
					<div class="flex text-center items-center m-auto">
						<div>Become the mayor of Turbotown in a new hybrid Dota + idle game</div>
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
					<div>Keep track of your friend's stats with the dynamic Heroes table</div>
				</div>
			</div>
		</section>
	</div>
</div>
