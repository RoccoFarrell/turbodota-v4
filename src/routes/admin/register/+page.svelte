<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getToastStore, storeHighlightJs } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	let { form } = $props();
	run(() => {
		if (form?.missing) {
			const t: ToastSettings = {
				message: `Enter at least one valid Dota User ID`,
				background: 'variant-filled-error'
			};

			toastStore.trigger(t);
		} else if (form?.success) {
			const t: ToastSettings = {
				message: `League created!`,
				background: 'variant-filled-success'
			};

			toastStore.trigger(t);
		} else if(form?.message){
			const t: ToastSettings = {
				message: `${form?.message}`,
				background: 'variant-filled-warning'
			};

			toastStore.trigger(t);
		}
	});

</script>

<div class="card container w-1/2 h-1/2 my-auto p-4">
<form method="POST">
	<hgroup>
		<h2 class="h2 text-center">Register</h2>
	</hgroup>

	<label for="name">Name</label>
	<input class="input" type="text" id="name" name="name" required />

	<label for="username">Username</label>
	<input class="input" type="text" id="username" name="username" required />

	<label for="password">Password</label>
	<input class="input" type="password" id="password" name="password" required />

	<button class="btn variant-filled w-1/2 my-4" type="submit">Register</button>
</form>
<p>Already have an account? <a href="/admin/login" class="text-blue-600 dark:text-blue-500 hover:underline">Login</a></p>
</div>