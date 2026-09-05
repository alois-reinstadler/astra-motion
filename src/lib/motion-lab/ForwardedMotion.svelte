<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { MotionBinding } from '$lib/motion/motion.svelte.js';
	let {
		transition,
		children,
		...props
	}: HTMLAttributes<HTMLDivElement> & { transition: MotionBinding['transition'] } = $props();
</script>

<div {...props} transition:transition|global>{@render children?.()}</div>
