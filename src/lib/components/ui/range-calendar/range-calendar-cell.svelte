<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";

	type $$Props = RangeCalendarPrimitive.CellProps;

	interface Props {
		date: $$Props["date"];
		class?: $$Props["class"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { date, class: className = undefined, children, ...rest }: Props = $props();
	
</script>

<RangeCalendarPrimitive.Cell
	{date}
	class={cn(
		"text-center text-sm p-0 relative [&:has([data-selected][data-selection-end])]:rounded-r-md [&:has([data-selected][data-outside-month])]:bg-accent/50 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
		className
	)}
	{...rest}
>
	{@render children?.()}
</RangeCalendarPrimitive.Cell>
