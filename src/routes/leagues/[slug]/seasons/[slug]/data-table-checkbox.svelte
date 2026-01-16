<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { Writable } from 'svelte/store';
	interface Props {
		checked: Writable<boolean>;
	}

	let { checked }: Props = $props();
</script>

<Checkbox bind:checked={$checked} />
