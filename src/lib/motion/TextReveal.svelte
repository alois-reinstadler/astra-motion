<script lang="ts">
	import TextVisual from './TextVisual.svelte';
	import { createInView } from './in-view.svelte.js';
	import { useTextPolicy } from './text-policy.svelte.js';
	import type { TextRevealProps } from './text-types.js';
	let {
		text,
		as = 'span',
		effect = 'fade',
		split = 'whole',
		stagger = 0,
		direction = 'up',
		distance = 12,
		duration,
		locale = 'en',
		trigger = 'mount',
		visible = true,
		once = true,
		viewport = {},
		...attributes
	}: TextRevealProps = $props();
	let host = $state<HTMLElement>();
	const policy = useTextPolicy();
	const inView = createInView(
		() => (trigger === 'viewport' && !policy.reduced ? host : undefined),
		() => ({ ...viewport, once })
	);
	const show = $derived(
		policy.reduced ||
			trigger === 'mount' ||
			(trigger === 'state'
				? visible
				: typeof IntersectionObserver === 'undefined' || inView.current)
	);
	const options = $derived({ effect, split, stagger, direction, distance, duration, locale });
</script>

<svelte:element this={as} {...attributes} bind:this={host}>
	<span class="semantic">{text}</span><TextVisual {text} {options} visible={show} />
</svelte:element>

<style>
	.semantic {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
