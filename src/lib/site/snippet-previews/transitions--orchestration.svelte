<script lang="ts">
	import { motion, stagger } from '$lib/motion/index.js';
	let visible = $state(false);
	const variants = {
		hidden: { opacity: 0.3 },
		visible: {
			opacity: 1,
			transition: { when: 'beforeChildren', delayChildren: stagger(0.06, { from: 'center' }) }
		}
	};
</script>

<div class="snippet-stage">
	<button onclick={() => (visible = !visible)}>Toggle stagger</button>
	<motion.div
		{variants}
		initial="hidden"
		animate={visible ? 'visible' : 'hidden'}
		style="display:flex;gap:8px;"
	>
		{#each [1, 2, 3, 4, 5] as item (item)}<motion.div
				variants={{ hidden: { y: 20, opacity: 0.3 }, visible: { y: 0, opacity: 1 } }}
				style="padding:12px;background:#d34123;color:white;border-radius:6px;">{item}</motion.div
			>{/each}
	</motion.div>
</div>

<style>
	.snippet-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		min-height: 180px;
		width: min(100%, 360px);
		margin: auto;
		color: #252821;
		font-size: 14px;
		line-height: 1.6;
	}
	.snippet-stage :global(button) {
		font: inherit;
		color: inherit;
		padding: 10px 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
		background: #f7f7f0;
		cursor: pointer;
	}
	.snippet-stage :global(button:disabled) {
		opacity: 0.5;
		cursor: default;
	}
	.snippet-stage :global(:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}
	.snippet-stage :global(input),
	.snippet-stage :global(select) {
		max-width: 100%;
		padding: 6px;
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		background: #f7f7f0;
		color: inherit;
		font: inherit;
	}
	.snippet-stage :global(svg) {
		overflow: visible;
		fill: #d34123;
		touch-action: none;
	}
	.snippet-stage :global(li) {
		padding: 6px 12px;
	}
</style>
