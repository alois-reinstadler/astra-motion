<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toMotionValue, motion } from '$lib/motion/index.js';
	let progress = $state(0);
	const opacity = toMotionValue(() => progress / 100);
	onDestroy(() => opacity.destroy());
</script>

<label>Opacity <input type="range" min="0" max="100" bind:value={progress} /></label>
<motion.div style={{ opacity }}>Preview</motion.div>
