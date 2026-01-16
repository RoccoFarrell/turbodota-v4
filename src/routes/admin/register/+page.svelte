<script lang="ts">
	import { run } from 'svelte/legacy';
	// ToastSettings type (not exported from Skeleton v3)
	type ToastSettings = {
		message: string;
		background?: string;
		timeout?: number;
	};
	import { getContext } from 'svelte';
	const toastStore = getContext<{ trigger: (settings: ToastSettings) => void }>('toaster');

	let { form } = $props();
	run(() => {
		if (form?.missing) {
			const t: ToastSettings = {
				message: `Enter at least one valid Dota User ID`,
				background: 'preset-filled-error-500'
			};

			toastStore.trigger(t);
		} else if (form?.success) {
			const t: ToastSettings = {
				message: `League created!`,
				background: 'preset-filled-success-500'
			};

			toastStore.trigger(t);
		} else if(form?.message){
			const t: ToastSettings = {
				message: `${form?.message}`,
				background: 'preset-filled-warning-500'
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

	<button class="btn preset-filled w-1/2 my-4" type="submit">Register</button>
</form>
<p>Already have an account? <a href="/admin/login" class="text-blue-600 dark:text-blue-500 hover:underline">Login</a></p>
</div>