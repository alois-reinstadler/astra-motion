<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createComponentMotion } from '../motion/component-motion.js';
	import type { MotionOptions } from '../motion/motion.svelte.js';
	let {
		motion = {},
		children,
		id
	}: { motion?: MotionOptions; children?: Snippet; id?: string } = $props();
	const binding = createComponentMotion(() => motion);
</script>

<div {id} {...binding.props}>{@render children?.()}</div>
