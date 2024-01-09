<script lang="ts">
	import shopkeeper from '$lib/assets/shopkeeper.png';

	class ShopItem {
		id: number = -1;
		name: string = '';
		description: string = '';
		imgSrc: string = '';
		goldCost: number = 0;
	}

	let itemList: Array<ShopItem> = [];

	let lotusOrb: ShopItem = new ShopItem();
	lotusOrb.id = 0;
	lotusOrb.name = 'Lotus Orb';
	lotusOrb.description = 'This item will reflect back any attempted debuff applied to you';
	lotusOrb.imgSrc = 'https://cdn.dota2.com/apps/dota2/images/items/lotus_orb_lg.png';
	lotusOrb.goldCost = 500;

	let linkensSphere: ShopItem = new ShopItem();
	linkensSphere.id = 1;
	linkensSphere.name = "Linken's Sphere";
	linkensSphere.description = 'This item will block any attempted debuff applied to you';
	linkensSphere.imgSrc = 'https://cdn.dota2.com/apps/dota2/images/items/sphere_lg.png';
	linkensSphere.goldCost = 1000;

	let observerWard: ShopItem = new ShopItem();
	observerWard.id = 2;
	observerWard.name = 'Observer Ward';
	observerWard.description = 'This item will let you pick from a selection of 3 random heroes';
	observerWard.imgSrc = 'https://cdn.dota2.com/apps/dota2/images/items/ward_observer_lg.png';
	observerWard.goldCost = 100;

	itemList.push(lotusOrb);
    itemList.push(linkensSphere);
    itemList.push(observerWard);

	let activeItem = new ShopItem();

	console.log(activeItem);

	const hoverHandler = (inputItem: ShopItem) => {
        activeItem.id = inputItem.id;
		activeItem.name = inputItem.name;
		activeItem.description = inputItem.description;
		activeItem.goldCost = inputItem.goldCost;
		console.log(activeItem)
	};
</script>

<div
	class="text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2 w-full"
>
	<!-- Auto Bans -->
	<div class="relative">
		<img class="h-auto max-w-full rounded-lg" src={shopkeeper} alt="" />
	</div>
</div>

<div class="container items-justify-center md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div
		class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
	>
		<!-- Auto Bans -->
		<div class="relative">
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Items</h3>
			</div>

			<section class="grid grid-cols-2 md:grid-cols-3 gap-4">
				<div>
					<img
						class="h-auto max-w-full rounded-lg"
						on:mouseenter={() => hoverHandler(lotusOrb)}
						on:mouseleave={() => hoverHandler(new ShopItem())}
						src={lotusOrb.imgSrc}
						alt=""
					/>
				</div>
				<div>
					<img
						class="h-auto max-w-full rounded-lg"
						on:mouseenter={() => hoverHandler(linkensSphere)}
						on:mouseleave={() => hoverHandler(new ShopItem())}
						src={linkensSphere.imgSrc}
						alt=""
					/>
				</div>
				<div>
					<img
						class="h-auto max-w-full rounded-lg"
						on:mouseenter={() => hoverHandler(observerWard)}
						on:mouseleave={() => hoverHandler(new ShopItem())}
						src={observerWard.imgSrc}
						alt=""
					/>
				</div>
			</section>
		</div>
	</div>
</div>

<div class="container items-justify-center md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div
		class="md:w-full max-md:max-w-sm text-center h-fit items-center dark:bg-surface-600/30 bg-surface-200/30 border border-surface-200 dark:border-surface-700 shadow-lg rounded-xl px-2 md:py-2 max-sm:py-2"
	>
		<!-- Auto Bans -->
		<div class="relative">
			<div class="mb-2 bg-surface-500/10 p-4 rounded-full w-4/5 mx-auto shadow-md">
				<h3 class="h3 dark:text-yellow-500 text-primary-500">Item Details</h3>
			</div>
			<!-- {#if activeItem.id !== -1} -->
				<p class="text-m text-left">Item: {activeItem.name}</p>
				<p class="text-m text-left ">Description: {activeItem.description}</p>
				<p class="text-m text-left dark:text-yellow-500">Gold Cost: {activeItem.goldCost}</p>
			<!-- {/if} -->
		</div>
	</div>
</div>
