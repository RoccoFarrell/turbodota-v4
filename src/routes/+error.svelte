<script lang="ts">
	import { page } from '$app/stores';
	import { redirect } from '@sveltejs/kit';
</script>

{#if $page.error}
	<div class="h-full w-full flex items-center justify-center">
		<h1 class="h1">{$page.status}: {$page?.error.message}</h1>
	</div>
{/if}
