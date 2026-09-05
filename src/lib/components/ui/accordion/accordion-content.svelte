<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import { cn, type WithoutChild } from '$lib/utils.js';
	import type { MotionBinding } from '$lib/motion/motion.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		motion,
		hiddenUntilFound = false,
		revealDuration = 200,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> & {
		motion?: MotionBinding;
		/** Intrinsic height reveal duration, in milliseconds. */
		revealDuration?: number;
	} = $props();

	const contentClass =
		'pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4';
	const animated = $derived(Boolean(motion && !hiddenUntilFound));
	const reveal = (node: Element) =>
		animated
			? slide(node, { duration: motion?.reducedMotion ? 0 : revealDuration })
			: { duration: 0 };
	const motionTransition = (node: HTMLElement) =>
		(animated ? motion?.transition(node) : undefined) ?? { duration: 0 };
</script>

<AccordionPrimitive.Content
	bind:ref
	{...restProps}
	{hiddenUntilFound}
	forceMount={animated ? true : restProps.forceMount}
>
	{#snippet child({ props, open })}
		{#if open || !animated}
			<div
				{...props}
				data-slot="accordion-content"
				class={cn(
					'overflow-hidden text-sm',
					!animated && 'data-open:animate-accordion-down data-closed:animate-accordion-up'
				)}
				transition:reveal
			>
				<div
					{...animated ? motion?.props : {}}
					class={cn(contentClass, className)}
					transition:motionTransition
				>
					{@render children?.()}
				</div>
			</div>
		{/if}
	{/snippet}
</AccordionPrimitive.Content>
