<script lang="ts">
	import { Dialog as DialogPrimitive, mergeProps } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { MotionBinding } from '$lib/motion/motion.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		motion,
		...restProps
	}: DialogPrimitive.OverlayProps & { motion?: MotionBinding } = $props();

	const overlayClass =
		'bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50';
	const motionTransition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
</script>

{#snippet overlay({ props, open }: { props: Record<string, unknown>; open: boolean })}
	{#if open || !motion}
		<div
			{...motion ? mergeProps(props, motion.props) : props}
			data-slot="dialog-overlay"
			class={cn(
				overlayClass,
				!motion &&
					'duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
				className
			)}
			transition:motionTransition
		></div>
	{/if}
{/snippet}
<DialogPrimitive.Overlay
	bind:ref
	{...restProps}
	forceMount={motion ? true : restProps.forceMount}
	child={motion ? overlay : (restProps.child ?? overlay)}
/>
