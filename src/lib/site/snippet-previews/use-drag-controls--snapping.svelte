<script lang="ts">
	import { motion, useDragControls, useMotionValue } from '$lib/motion/index.js';
	const controls = useDragControls();
	const x = useMotionValue(0);
	function begin(event: PointerEvent) {
		controls.start(event, { snapToCursor: true, distanceThreshold: 0 });
	}
</script>

<div class="snippet-stage">
	<button
		aria-label="Position the thumb on this track"
		onpointerdown={begin}
		onclick={(event) => {
			if (event.detail === 0) x.set(x.get() === 0 ? 180 : 0);
		}}
		style="position:relative;width:244px;max-width:100%;height:64px;touch-action:none;"
	>
		<motion.span
			drag="x"
			dragControls={controls}
			dragListener={false}
			dragMomentum={false}
			dragConstraints={{ left: 0, right: 180 }}
			dragElastic={0}
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: 62,
				height: 62,
				backgroundColor: '#d34123',
				borderRadius: 32,
				x
			}}
		/>
	</button>
	<p>Press anywhere on the track, then drag. Enter toggles the ends.</p>
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
