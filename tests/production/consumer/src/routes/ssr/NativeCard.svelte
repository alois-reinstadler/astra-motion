<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MotionBinding } from 'astra-motion/state';
	let {
		motion,
		children
	}: { motion?: Pick<MotionBinding, 'props' | 'transition'>; children: Snippet } = $props();
	const transition = (node: HTMLElement) => (motion ? motion.transition(node) : { duration: 0 });
</script>

<article data-testid="native-card" {...motion?.props} transition:transition>
	{@render children()}
</article>
