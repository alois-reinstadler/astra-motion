<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { MotionProps, MotionTag } from './MotionComponent.svelte';
	import type { ComponentMotionProps } from './component-props.js';
	export type ReorderItemProps<T, Tag extends MotionTag = 'li'> = Omit<
		MotionProps<Tag>,
		keyof ComponentMotionProps | 'as' | 'value' | 'children' | 'ref'
	> &
		ComponentMotionProps & { as?: Tag; value: T; children?: Snippet; ref?: HTMLElement | null };
</script>

<script lang="ts" generics="T, Tag extends MotionTag = 'li'">
	import { onDestroy } from 'svelte';
	import { isMotionValue, motionValue, type PanInfo } from 'motion-dom';
	import Motion from './MotionComponent.svelte';
	import { readReorder, type ReorderBox } from './reorder-context.js';
	let {
		as = 'li' as Tag,
		value,
		style,
		children,
		ref = $bindable(),
		layout = true,
		onDrag,
		onDragStart,
		onDragEnd,
		motion,
		...props
	}: ReorderItemProps<T, Tag> = $props();
	const group = readReorder<T>();
	const ownX = motionValue(0);
	const ownY = motionValue(0);
	const zIndex = motionValue<number | 'unset'>('unset');
	const x = $derived(typeof style === 'object' && isMotionValue(style?.x) ? style.x : ownX);
	const y = $derived(typeof style === 'object' && isMotionValue(style?.y) ? style.y : ownY);
	function subscribePosition() {
		const update = () => zIndex.set(x.get() || y.get() ? 1 : 'unset');
		const stopX = x.on('change', update);
		const stopY = y.on('change', update);
		update();
		return () => {
			stopX();
			stopY();
		};
	}
	$effect(subscribePosition);
	function retainRegistration() {
		const registered = value;
		return () => group.unregister(registered);
	}
	$effect(retainRegistration);
	onDestroy(() => {
		group.stopScroll();
		ownX.destroy();
		ownY.destroy();
		zIndex.destroy();
	});
	const itemStyle = $derived(typeof style === 'string' ? style : { ...style, x, y, zIndex });
	const itemMotion = $derived({ ...motion, style: { ...motion?.style, x, y, zIndex } });
	function drag(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
		group.update(value, { x: Number(x.get()), y: Number(y.get()) }, info.velocity);
		if (event instanceof PointerEvent) group.scroll(event, info.velocity);
		onDrag?.(event, info);
	}
	function started(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
		group.stopScroll();
		onDragStart?.(event, info);
	}
	function ended(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
		group.stopScroll();
		onDragEnd?.(event, info);
	}
	const measurement = {
		onLayoutMeasure: (box: ReorderBox, previous?: ReorderBox) => {
			group.register(value, box);
			const callback = (
				props as { onLayoutMeasure?: (box: ReorderBox, previous?: ReorderBox) => void }
			).onLayoutMeasure;
			callback?.(box, previous);
		}
	};
</script>

<Motion
	as={as as 'div'}
	drag={group.axis === 'xy' ? true : group.axis}
	{...props as MotionProps<'div'>}
	{...measurement}
	dragSnapToOrigin
	{layout}
	bind:ref
	style={itemStyle}
	motion={itemMotion}
	onDrag={drag}
	onDragStart={started}
	onDragEnd={ended}
>
	{@render children?.()}
</Motion>
