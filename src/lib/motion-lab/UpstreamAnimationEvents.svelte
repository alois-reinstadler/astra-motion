<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { motion, type MotionOptions } from '../motion/index.js';
	let {
		options = {},
		child = false,
		childStart,
		childComplete
	}: {
		options?: MotionOptions;
		child?: boolean;
		childStart?: MotionOptions['onAnimationStart'];
		childComplete?: MotionOptions['onAnimationComplete'];
	} = $props();
	let current = $state.raw<MotionOptions>(untrack(() => options));
	export function set(next: Partial<MotionOptions>) {
		current = { ...current, ...next };
	}
</script>

<motion.div data-upstream-event="parent" {...current}>
	{#if child}
		<motion.div
			data-upstream-event="child"
			variants={{ hidden: { x: 0 }, visible: { x: 80 } }}
			transition={{ duration: 0.08 }}
			onAnimationStart={childStart}
			onAnimationComplete={childComplete}
		/>
	{/if}
</motion.div>
