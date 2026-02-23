<script lang="ts">
	// @ts-nocheck - bits-ui type incompatibility with current svelte version
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import { ChevronLeft } from "radix-icons-svelte";
	import { buttonVariants } from "$lib/components/ui/button";
	import { cn } from "$lib/utils";

	type $$Props = RangeCalendarPrimitive.PrevButtonProps;
	type $$Events = RangeCalendarPrimitive.PrevButtonEvents;

	interface Props {
		class?: $$Props["class"];
		children?: import('svelte').Snippet<[any]>;
		[key: string]: any
	}

	let { class: className = undefined, children, ...rest }: Props = $props();
	

	const children_render = $derived(children);
</script>

<RangeCalendarPrimitive.PrevButton
	on:click
	class={cn(
		buttonVariants({ variant: "outline" }),
		"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
		className
	)}
	{...rest}
	
>
	{#snippet children({ builder }: { builder: any })}
		{#if children_render}{@render children_render({ builder, })}{:else}
			<ChevronLeft class="h-4 w-4" />
		{/if}
	{/snippet}
</RangeCalendarPrimitive.PrevButton>
