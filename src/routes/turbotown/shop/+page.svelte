<script lang="ts">
	import { run } from 'svelte/legacy';

	import Shop from '../_components/Shop.svelte';
	import { enhance } from '$app/forms';

	//skeleton
	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	//page data
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
		form: any;
	}

	let { data, form }: Props = $props();
	//console.log(data);

	run(() => {
		console.log(form);
	});

	function onFormReturn(form: any) {
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
		else if (form && !form.enoughGold) {
			const t: ToastSettings = {
					message: `Not enough gold for items`,
					background: 'variant-filled-error'
				};

				toastStore.trigger(t);
		}
	}

	run(() => {
		onFormReturn(form);
	});

</script>

<div class="flex flex-col h-full">
	<Shop {data} {form}></Shop>
	<!-- <div class="relative w-full bg-primary-500">test</div> -->
</div>
