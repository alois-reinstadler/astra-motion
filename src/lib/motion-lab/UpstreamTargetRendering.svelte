<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { motion, useAnimate, type MotionOptions } from '../motion/index.js';
	let { options = {}, svg = false }: { options?: MotionOptions; svg?: boolean } = $props();
	let current = $state.raw<MotionOptions>(untrack(() => options));
	const [scope, animate] = useAnimate();
	export function set(next: Partial<MotionOptions>) {
		current = { ...current, ...next };
	}
	export const api = () => ({ scope, animate });
</script>

<section {@attach scope.attach}>
	{#if svg}
		<svg width="120" height="60" viewBox="0 0 120 60"
			><motion.path data-upstream-render d="M0 20L100 20" {...current} /></svg
		>
	{:else}
		<motion.div data-upstream-render {...current} />
	{/if}
</section>
