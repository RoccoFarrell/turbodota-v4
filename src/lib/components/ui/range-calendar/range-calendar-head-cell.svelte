<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";

	type $$Props = RangeCalendarPrimitive.HeadCellProps;

	interface Props {
		class?: $$Props["class"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { class: className = undefined, children, ...rest }: Props = $props();
	
</script>

<RangeCalendarPrimitive.HeadCell
	class={cn(
		"text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
		className
	)}
	{...rest}
>
	{@render children?.()}
</RangeCalendarPrimitive.HeadCell>
