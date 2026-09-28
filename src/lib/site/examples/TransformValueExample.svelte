<script lang="ts">
	import { motion, motionStore, useMotionValue, useTransform } from '$lib/motion/index.js';
	const progress = useMotionValue(50);
	const { scale, backgroundColor } = useTransform(progress, [0, 100], {
		scale: [0.75, 1.25],
		backgroundColor: ['#dfe5d1', '#edd1ba']
	});
	const currentScale = motionStore(scale);
</script>

<div class="example">
	<label
		>Source <input
			aria-label="Transform source"
			type="range"
			min="0"
			max="100"
			value="50"
			oninput={(event) => progress.set(event.currentTarget.valueAsNumber)}
		/></label
	>
	<div class="stage">
		<motion.div class="tile" style={{ scale, backgroundColor }} aria-hidden="true">A</motion.div>
	</div>
	<output>Scale {$currentScale.toFixed(2)} · one source, two outputs</output>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 28px 18px;
		color: var(--site-ink, #252821);
	}
	label {
		display: grid;
		gap: 10px;
		font-size: 12px;
	}
	input {
		width: 220px;
		accent-color: var(--site-accent, #d34123);
	}
	.stage {
		display: grid;
		place-items: center;
		height: 120px;
		width: 200px;
	}
	.stage :global(.tile) {
		display: grid;
		place-items: center;
		width: 80px;
		height: 80px;
		border-radius: 5px;
		color: #d34123;
		font-size: 46px;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
