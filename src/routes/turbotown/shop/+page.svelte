<script lang="ts">
	import Shop from '$lib/components/Shop.svelte';

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	//console.log(data);
	
</script>

<div class="flex flex-col h-full">
	<Shop {data}></Shop>
	<!-- <div class="relative w-full bg-primary-500">test</div> -->

</div>



