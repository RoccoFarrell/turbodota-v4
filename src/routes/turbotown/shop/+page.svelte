<script lang="ts">
	import { run } from 'svelte/legacy';

	import Shop from '../_components/Shop.svelte';
	import { enhance } from '$app/forms';

	//skeleton
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	import { getContext } from 'svelte';
	const toastStore = getContext<{ trigger: (settings: ToastSettings) => void }>('toaster');

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
					background: 'preset-filled-success-500'
				};

				toastStore.trigger(t);
			}

			if (form.action === 'buy item') {
				const t: ToastSettings = {
					message: `Bought ${form?.result?.count} items`,
					background: 'preset-filled-success-500'
				};

				toastStore.trigger(t);
			}
		}
		else if (form && !form.enoughGold) {
			const t: ToastSettings = {
					message: `Not enough gold for items`,
					background: 'preset-filled-error-500'
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
