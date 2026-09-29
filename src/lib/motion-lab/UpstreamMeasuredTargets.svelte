<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { motion, useMotionValue, type MotionOptions } from '../motion/index.js';
	let {
		options = {},
		external = false,
		content = false
	}: { options?: MotionOptions; external?: boolean; content?: boolean } = $props();
	let current = $state.raw<MotionOptions>(untrack(() => options));
	const x = useMotionValue(0);
	export function set(next: Partial<MotionOptions>) {
		current = { ...current, ...next };
	}
</script>

<section style="width:400px;height:200px;position:relative">
	<motion.div
		data-upstream-measured
		{...current}
		style={{ ...current.style, ...(external ? { x } : {}) }}
	>
		{#if content}<div style="height:100px;width:100px"></div>{/if}
	</motion.div>
</section>
