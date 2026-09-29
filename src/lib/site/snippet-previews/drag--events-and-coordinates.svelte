<script lang="ts">
	import { MotionConfig, motion, correctParentTransform } from '$lib/motion/index.js';
	let parent = $state<HTMLDivElement>();
	const transformPoint = correctParentTransform(() => parent);
</script>

<div class="snippet-stage">
	<div
		{@attach (node) => {
			parent = node;
			return () => {
				parent = undefined;
			};
		}}
		style="transform:scale(0.75);padding:28px;border:1px dashed #738064;"
	>
		<MotionConfig transformPagePoint={transformPoint}
			><motion.div
				drag
				dragMomentum={false}
				style="width:80px;height:80px;background:#d34123;border-radius:12px;touch-action:none;"
			/></MotionConfig
		>
	</div>
	<p>Drag inside the scaled parent.</p>
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
