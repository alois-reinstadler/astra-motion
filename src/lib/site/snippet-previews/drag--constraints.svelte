<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let bounds = $state<HTMLDivElement>();
</script>

<div class="snippet-stage">
	<div
		{@attach (node) => {
			bounds = node;
			return () => {
				bounds = undefined;
			};
		}}
		style="width:100%;height:160px;border:1px dashed #738064;border-radius:12px;padding:12px;"
	>
		<motion.div
			drag
			dragConstraints={() => bounds}
			dragElastic={0.2}
			style="width:64px;height:64px;background:#d34123;border-radius:12px;touch-action:none;"
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
