<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	let changed = $state(false);
	const nodes = Array.from({ length: 100 }, (_, id) => ({
		id,
		motion: createMotion(() => ({
			initial: false,
			layout: true,
			animate: { opacity: changed ? 0.4 : 1, backgroundColor: changed ? '#0000ff' : '#ff0000' },
			transition: { duration: 0.4, ease: 'linear' }
		}))
	}));
</script>

<button onclick={() => (changed = !changed)}>Animate 100 paint states</button>
<div class="grid">
	{#each nodes as item (item.id)}
		<div data-motion-paint {...item.motion.props}></div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(10, 12px);
		gap: 2px;
	}
	.grid > div {
		width: 12px;
		height: 12px;
	}
</style>
