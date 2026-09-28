<script lang="ts">
	import { untrack } from 'svelte';
	import { readSVGContext } from './element-context.js';
	import type { MotionBindingFactory } from './motion-types.js';
	import {
		componentMotionOptions,
		nativeComponentProps,
		type ComponentMotionProps
	} from './component-props.js';
	import { nativeSVGProps } from './svg.js';
	import MotionChildren from './MotionChildren.svelte';
	import type { MotionChildren as Children } from './motion-children.js';
	import type { MotionElement } from './motion-types.js';
	let {
		tag,
		createBinding,
		motion = {},
		ref = $bindable(),
		style,
		children,
		...attributes
	}: ComponentMotionProps & {
		tag: 'a' | 'script' | 'style' | 'title';
		createBinding: MotionBindingFactory;
		ref?: MotionElement | null;
		children?: Children;
		[key: string]: unknown;
	} = $props();
	const svg = readSVGContext() || untrack(() => attributes.xmlns === 'http://www.w3.org/2000/svg');
	const factory = untrack(() => createBinding);
	const binding = factory(() => componentMotionOptions(motion, attributes, style), {
		namespace: svg ? 'svg' : 'html',
		tag: untrack(() => tag),
		attributes: () => nativeComponentProps(attributes)
	});
	const native = $derived(
		svg ? nativeSVGProps(nativeComponentProps(attributes)) : nativeComponentProps(attributes)
	);
	const motionTransition = binding.transition;
	function forwardRef(node: MotionElement) {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	}
</script>

<svelte:element
	this={tag}
	xmlns={svg ? 'http://www.w3.org/2000/svg' : undefined}
	{...native}
	{...binding.props}
	style={`${typeof style === 'string' ? style : ''};${binding.props.style}`}
	transition:motionTransition|global
	{@attach forwardRef}
>
	<MotionChildren {children} />
</svelte:element>
