<script lang="ts">
	import Shop from '../_components/Shop.svelte';
	import { enhance } from '$app/forms';
	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//console.log(data);
	
</script>

<div class="flex flex-col h-full">
	<Shop {data}></Shop>
	<!-- <div class="relative w-full bg-primary-500">test</div> -->
	<form method="POST" class="space-y-8" action="?/createItem" use:enhance>
	<div class="w-full flex justify-center">
		<button class="btn variant-filled-primary w-1/2 mx-auto">Create Item</button>
	</div>
</form>
</div>



