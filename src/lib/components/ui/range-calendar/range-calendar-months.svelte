<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type $$Props = HTMLAttributes<HTMLDivElement>;

	interface Props {
		class?: $$Props["class"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { class: className = undefined, children, ...rest }: Props = $props();
	
</script>

<div
	class={cn(
		"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 mt-4",
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
