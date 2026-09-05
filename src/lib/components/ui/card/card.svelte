<script lang="ts">
	import { mergeProps } from 'bits-ui';
	import type { Attachment } from 'svelte/attachments';
	import type { MotionBinding } from '$lib/motion/motion.svelte.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		motion,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: 'default' | 'sm';
		motion?: MotionBinding;
	} = $props();
	const motionTransition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
	const attachRef: Attachment<HTMLDivElement> = (node) => {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	};
</script>

<div
	{@attach attachRef}
	data-slot="card"
	data-size={size}
	class={cn(
		'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
		className
	)}
	{...motion ? mergeProps(restProps, motion.props) : restProps}
	transition:motionTransition|global
>
	{@render children?.()}
</div>
