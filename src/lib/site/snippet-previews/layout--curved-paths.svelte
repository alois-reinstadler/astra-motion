<script lang="ts">
	import { arc, motion } from '$lib/motion/index.js';
	const path = arc({ strength: 0.7, rotate: 0.3 });
	let moved = $state(false);
</script>

<div class="snippet-stage">
	<button onclick={() => (moved = !moved)}>Move along arc</button>
	<div style="width:100%;height:120px;position:relative;">
		<motion.div
			layout
			transition={{ layout: { duration: 0.8, path } }}
			style={{
				position: 'absolute',
				left: moved ? 'calc(100% - 64px)' : 0,
				top: 30,
				width: 64,
				height: 64,
				backgroundColor: '#d34123',
				borderRadius: 12
			}}
		/>
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
