<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { arc, motion } from '../motion/index.js';
	let {
		layout = false,
		enabled = true,
		distance = 400,
		rotate = false,
		compose = false,
		progress = 0.25
	}: {
		layout?: boolean;
		enabled?: boolean;
		distance?: number;
		rotate?: boolean;
		compose?: boolean;
		progress?: number;
	} = $props();
	let moved = $state(false);
	const path = $derived(enabled ? arc({ strength: 1, rotate }) : undefined);
	export function move() {
		moved = true;
	}
</script>

{#if layout}
	<div style="height:100px;position:relative">
		<motion.div
			data-upstream-arc
			layout="position"
			initial={false}
			style={{ position: 'absolute', left: moved ? distance : 0, top: 0, width: 20, height: 20 }}
			transition={{ layout: { duration: 10, ease: () => progress, path } }}
		/>
	</div>
{:else}
	<motion.div
		data-upstream-arc
		initial={{ x: 0, y: 0, rotate: 0 }}
		animate={{ x: moved ? distance : 0, y: 0, rotate: compose && moved ? 90 : 0 }}
		style={{ width: 20, height: 20 }}
		transition={{ duration: 10, ease: () => progress, path }}
	/>
{/if}
