<script lang="ts">
    //page data
	import type { PageData } from './$types';
	export let data: PageData;

    console.log('data: ', data);

    //skeleton
    import { Table } from '@skeletonlabs/skeleton';
    import type { TableSource } from '@skeletonlabs/skeleton';

    let tableData: TableSource = {
		head: [],
		body: []
	};
</script>

<div class="container md:m-4 my-4 h-full mx-auto w-full max-sm:mb-20">
	<div class="flex flex-col items-center text-center space-y-2 md:mx-8 mx-2">
		<div class="flex justify-around items-center w-3/4">
			<h1 class="h1 text-primary-700 max-md:font-bold">The Walker Random™</h1>
			{#if data.session && data.session.user}
				<div class="text-xs">
					Logged in as: <p class="text-secondary-500 text-lg font-bold">{data.session.user.username}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
