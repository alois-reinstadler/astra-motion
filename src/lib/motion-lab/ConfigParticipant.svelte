<script lang="ts">
	import { createLayout, type LayoutOptions } from '$lib/motion/layout.js';
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import ForwardedMotion from './ForwardedMotion.svelte';
	let {
		prefix,
		changed,
		enabled,
		shared,
		mode
	}: {
		prefix: string;
		changed: boolean;
		enabled: boolean;
		shared: string;
		mode: LayoutOptions['mode'];
	} = $props();
	const layout = createLayout();
	const motion = createMotion(() => ({
		initial: { opacity: 0, x: -12 },
		animate: { opacity: 1, x: changed ? 70 : 0 },
		exit: { opacity: 0 },
		layout: enabled ? { id: `${prefix}-${shared}`, mode } : false
	}));
</script>

<div
	style:display="flex"
	style:width="320px"
	style:justify-content={changed ? 'flex-end' : 'flex-start'}
>
	<div
		data-testid={`${prefix}-layout`}
		style="width:40px;height:30px;background:gray"
		{@attach layout()}
	>
		Layout
	</div>
</div>
<ForwardedMotion {...motion.props} transition={motion.transition} data-testid={`${prefix}-motion`}>
	Motion
</ForwardedMotion>
