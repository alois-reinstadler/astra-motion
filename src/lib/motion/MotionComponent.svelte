<script lang="ts" module>
	import type { HTMLAttributes, SvelteHTMLElements } from 'svelte/elements';
	import type { MotionOptions } from './motion.svelte.js';

	export type MotionTag = keyof HTMLElementTagNameMap & keyof SvelteHTMLElements;
	type NativeProps<Tag extends MotionTag> = Tag extends MotionTag ? SvelteHTMLElements[Tag] : never;
	export type MotionProps<Tag extends MotionTag = 'div'> = NativeProps<Tag> & {
		as?: Tag;
		motion?: MotionOptions;
		ref?: HTMLElement | null;
	};
</script>

<script lang="ts" generics="Tag extends MotionTag = 'div'">
	import { untrack } from 'svelte';
	import { createComponentMotion } from './component-motion.js';
	let {
		as = 'div' as Tag,
		motion = {},
		ref = $bindable(),
		style,
		children,
		...attributes
	}: MotionProps<Tag> = $props();
	const initialTag = untrack(() => as);
	const tag = $derived.by(() => {
		if (as !== initialTag) {
			throw new Error(
				'Astra Motion: as must stay unchanged while mounted. Wrap Motion in {#key tag} to change its element.'
			);
		}
		return as;
	});
	const binding = createComponentMotion(() => motion);
	const motionTransition = binding.transition;
	// Keep tag-specific attributes on the public API; the dynamic element forwards them unchanged.
	// @ts-expect-error TS2590: generic native event unions exceed TypeScript's internal forwarding limit.
	const elementAttributes = $derived(attributes as unknown as HTMLAttributes<HTMLElement>);
	const voidTags = new Set([
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
	]);
</script>

{#if voidTags.has(tag)}
	<svelte:element
		this={tag}
		bind:this={ref}
		{...elementAttributes}
		{...binding.props}
		style={`${style ?? ''};${binding.props.style}`}
		transition:motionTransition|global
	/>
{:else}
	<svelte:element
		this={tag}
		bind:this={ref}
		{...elementAttributes}
		{...binding.props}
		style={`${style ?? ''};${binding.props.style}`}
		transition:motionTransition|global
	>
		{@render children?.()}
	</svelte:element>
{/if}
