<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';
	let index = $state(0);
	let direction = $state(1);
	const slide = $derived({ id: index, title: `Slide ${index + 1}` });
	function move(step: number) {
		direction = step;
		index += step;
	}
</script>

<div class="snippet-stage">
	<div>
		<button onclick={() => move(-1)}>Previous</button> <button onclick={() => move(1)}>Next</button>
	</div>
	<div style="display:grid;width:100%;overflow:hidden;">
		<AnimatePresence items={[slide]} key={(item) => item.id} custom={direction}
			>{#snippet children(item)}<motion.article
					style="grid-area:1/1;padding:24px;background:#e4dfce;border-radius:12px;"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					variants={{ exit: (direction: number) => ({ x: direction * -120, opacity: 0 }) }}
					exit="exit">{item.title}</motion.article
				>{/snippet}</AnimatePresence
		>
	</div>
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
