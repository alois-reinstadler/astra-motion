<script lang="ts">
	import { Dialog as DialogPrimitive, mergeProps } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { MotionBinding } from '$lib/motion/motion.svelte.js';
	import * as Dialog from './index.js';
	import DialogPortal from './dialog-portal.svelte';
	import type { ComponentProps, Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		motion,
		overlayMotion,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		/** Opt in to interruptible Motion state and native Svelte exit retention. */
		motion?: MotionBinding;
		/** Independent overlay binding; omitting it keeps the regular overlay animation. */
		overlayMotion?: MotionBinding;
	} = $props();

	const surfaceClass =
		'grid max-w-[calc(100%-2rem)] gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm fixed z-50 w-full outline-none';
	const motionTransition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
</script>

{#snippet contents()}
	{@render children?.()}
	{#if showCloseButton}
		<DialogPrimitive.Close data-slot="dialog-close">
			{#snippet child({ props })}
				<Button variant="ghost" class="absolute top-2 right-2" size="icon-sm" {...props}>
					<XIcon />
					<span class="sr-only">Close</span>
				</Button>
			{/snippet}
		</DialogPrimitive.Close>
	{/if}
{/snippet}

<DialogPortal {...portalProps}>
	<Dialog.Overlay motion={overlayMotion} />
	<DialogPrimitive.Content
		bind:ref
		{...restProps}
		forceMount={motion ? true : restProps.forceMount}
	>
		{#snippet child({ props, open })}
			{#if open || !motion}
				<div
					{...motion ? mergeProps(props, motion.props) : props}
					data-slot="dialog-content"
					class={cn(
						surfaceClass,
						motion
							? 'inset-0 m-auto h-fit'
							: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
						className
					)}
					transition:motionTransition
				>
					{@render contents()}
				</div>
			{/if}
		{/snippet}
	</DialogPrimitive.Content>
</DialogPortal>
