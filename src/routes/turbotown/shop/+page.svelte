<script lang="ts">
	import Shop from '../_components/Shop.svelte';
	import { enhance } from '$app/forms';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//page data
	import type { PageData } from './$types';
	export let data: PageData;

	export let form;
	//console.log(data);

	$: console.log(form);

	function onFormSuccess(form: any) {
		if (form && form.success) {
			console.log('sending toast');

			if (form.action === 'use item') {
				const t: ToastSettings = {
					message: `Used ${form?.result?.action}`,
					background: 'variant-filled-success'
				};

				toastStore.trigger(t);
			}

			if (form.action === 'buy item') {
				const t: ToastSettings = {
					message: `Bought ${form?.result?.count} items`,
					background: 'variant-filled-success'
				};

				toastStore.trigger(t);
			}
		}
	}

	$: onFormSuccess(form);
</script>

<div class="flex flex-col h-full">
	<Shop {data} {form}></Shop>
	<!-- <div class="relative w-full bg-primary-500">test</div> -->
</div>
