<script lang="ts" generics="Tag extends MotionSVGTag">
	import { untrack } from 'svelte';
	import type { MotionSVGTag } from './elements/types.js';
	import type { MotionBindingFactory } from './motion-types.js';
	import {
		componentMotionOptions,
		nativeComponentProps,
		type ComponentMotionProps
	} from './component-props.js';
	import { nativeSVGProps } from './svg.js';
	import MotionChildren from './MotionChildren.svelte';
	import type { MotionChildren as Children } from './motion-children.js';
	import { provideSVGContext } from './element-context.js';
	let {
		tag,
		createBinding,
		motion = {},
		ref = $bindable(),
		style,
		children,
		...attributes
	}: ComponentMotionProps & {
		tag: Tag;
		createBinding: MotionBindingFactory;
		ref?: SVGElementTagNameMap[Tag] | null;
		children?: Children;
		[attribute: string]: unknown;
	} = $props();
	provideSVGContext(untrack(() => tag !== 'foreignObject'));
	const factory = untrack(() => createBinding);
	const binding = factory(() => componentMotionOptions(motion, attributes, style), {
		namespace: 'svg',
		tag: untrack(() => tag),
		attributes: () => nativeComponentProps(attributes)
	});
	const nativeAttributes = $derived(nativeSVGProps(nativeComponentProps(attributes)));
	const motionTransition = binding.transition;
	function forwardRef(node: Element) {
		ref = node as SVGElementTagNameMap[Tag];
		return () => {
			if (ref === node) ref = null;
		};
	}
</script>

<svelte:element
	this={tag}
	xmlns="http://www.w3.org/2000/svg"
	{...nativeAttributes}
	{...binding.props}
	style={`${typeof style === 'string' ? style : ''};${binding.props.style}`}
	transition:motionTransition|global
	{@attach forwardRef}
>
	<MotionChildren {children} />
</svelte:element>
