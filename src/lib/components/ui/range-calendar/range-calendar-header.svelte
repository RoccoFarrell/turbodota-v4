<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";

	type $$Props = RangeCalendarPrimitive.HeaderProps;

	interface Props {
		class?: $$Props["class"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { class: className = undefined, children, ...rest }: Props = $props();
	
</script>

<RangeCalendarPrimitive.Header
	class={cn(
		"flex justify-between pt-1 relative items-center w-full",
		className
	)}
	{...rest}
>
	{@render children?.()}
</RangeCalendarPrimitive.Header>
