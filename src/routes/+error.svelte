<script lang="ts">
	import { page } from '$app/stores';
	import { redirect } from '@sveltejs/kit';

	import Abduction from '$lib/assets/abduction.png'
</script>

{#if $page.error}
	<div class="h-full w-full flex flex-col items-center justify-center">
		<img src={Abduction} class="w-64 h-64" alt="404 abduction"/>
		<h1 class="h1">{$page.status}: {$page?.error.message}</h1>
	</div>
{/if}
