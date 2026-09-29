<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { motion, type MotionOptions } from '../motion/index.js';
	let { options = {} }: { options?: MotionOptions } = $props();
	let current = $state.raw<MotionOptions>(untrack(() => options));
	export function set(next: Partial<MotionOptions>) {
		current = { ...current, ...next };
	}
</script>

<motion.div data-upstream-target {...current} />
