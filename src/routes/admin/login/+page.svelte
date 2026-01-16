<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { PageData } from "./$types";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	run(() => {
		console.log("data: ", data)
	});
</script>

<div class="card container w-1/2 h-1/2 my-auto p-4">
	<form method="POST">
		<hgroup>
			<h2 class="h2 text-center">Login</h2>
		</hgroup>
		<label for="username">Username</label>
		<input class="input" type="text" id="username" name="username" required />

		<label for="password">Password</label>
		<input class="input" type="password" id="password" name="password" required />

		<button class="btn preset-filled w-1/2 my-4" type="submit">Login</button>
	</form>
	<p>Don't have an account? <a href="/admin/register" class="text-blue-600 dark:text-blue-500 hover:underline">Register</a></p>
</div>
