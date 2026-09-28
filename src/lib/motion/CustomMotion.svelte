<script lang="ts">
	import { untrack, type Component } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { MotionCreateOptions } from './create-motion.js';
	import type { MotionBindingFactory } from './motion-types.js';
	import {
		componentMotionOptions,
		nativeComponentProps,
		type ComponentMotionProps
	} from './component-props.js';
	import type { MotionElement } from './motion-types.js';
	import MotionChildren from './MotionChildren.svelte';
	import type { MotionChildren as Children } from './motion-children.js';
	import { readSVGContext, provideSVGContext } from './element-context.js';
	import { isSVGComponentTag, nativeSVGProps } from './svg.js';
	let {
		component,
		createBinding,
		options,
		values,
		ref = $bindable()
	}: {
		createBinding: MotionBindingFactory;
		component: string | Component<Record<string, unknown>>;
		options: MotionCreateOptions;
		values: ComponentMotionProps & Record<string, unknown>;
		ref?: MotionElement | null;
	} = $props();
	const tag = untrack(() => (typeof component === 'string' ? component : undefined));
	const namespace =
		untrack(() => options.namespace) ??
		(readSVGContext() || isSVGComponentTag(tag) ? 'svg' : 'html');
	provideSVGContext(namespace === 'svg' && tag !== 'foreignObject');
	const voidTag =
		tag !== undefined &&
		new Set([
			'area',
			'base',
			'br',
			'col',
			'embed',
			'hr',
			'img',
			'input',
			'link',
			'meta',
			'param',
			'source',
			'track',
			'wbr'
		]).has(tag);
	const factory = untrack(() => createBinding);
	const binding = factory(() => componentMotionOptions(values.motion ?? {}, values, values.style), {
		namespace,
		tag,
		attributes: () => {
			const attributes = nativeComponentProps(values);
			// Svelte owns the child snippet and its subscriptions. Exposing a
			// MotionValue child to the engine creates a second textContent writer.
			delete attributes.children;
			return attributes;
		}
	});
	const motionTransition = binding.transition;
	const forwardRef: Attachment<MotionElement> = (node) => {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	};
	function forwarded() {
		const allowed = options.forwardMotionProps ? values : nativeComponentProps(values);
		const result: Record<PropertyKey, unknown> = {};
		for (const key of Reflect.ownKeys(allowed)) {
			if (key === 'motion' || key === 'ref' || key === 'style') continue;
			if (key === 'children') continue;
			const descriptor = Object.getOwnPropertyDescriptor(values, key);
			Object.defineProperty(result, key, {
				enumerable: true,
				configurable: true,
				get: () => values[key as string],
				...(descriptor?.set
					? {
							set: (value: unknown) => {
								values[key as string] = value;
							}
						}
					: {})
			});
		}
		return result;
	}
	const attributes = $derived(
		namespace === 'svg' && typeof component === 'string' ? nativeSVGProps(forwarded()) : forwarded()
	);
	const children = $derived(values.children as Children | undefined);
	const style = $derived(
		`${typeof values.style === 'string' ? values.style : ''};${binding.props.style}`
	);
</script>

{#snippet renderedChildren()}<MotionChildren {children} />{/snippet}
{#if typeof component === 'string'}
	{#if voidTag}
		<svelte:element
			this={component}
			{...attributes}
			{...binding.props}
			{style}
			transition:motionTransition|global
			{@attach forwardRef}
		/>
	{:else}
		<svelte:element
			this={component}
			xmlns={namespace === 'svg' ? 'http://www.w3.org/2000/svg' : undefined}
			{...attributes}
			{...binding.props}
			{style}
			transition:motionTransition|global
			{@attach forwardRef}
		>
			{@render renderedChildren()}
		</svelte:element>
	{/if}
{:else}
	{@const Custom = component}
	<Custom
		{...attributes}
		{...binding.props}
		{style}
		children={children === undefined ? undefined : renderedChildren}
		{@attach forwardRef}
	/>
{/if}
