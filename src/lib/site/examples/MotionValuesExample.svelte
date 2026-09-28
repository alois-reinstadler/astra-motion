<script lang="ts">
	import { motion, motionStore, useMotionValue, useTransform } from '$lib/motion/index.js';
	const x = useMotionValue(0);
	const opacity = useTransform(x, [-90, 0, 90], [0.35, 1, 0.35]);
	const position = motionStore(x);
</script>

<div class="example">
	<label
		>Position <input
			aria-label="Position"
			type="range"
			min="-90"
			max="90"
			value="0"
			oninput={(event) => x.set(event.currentTarget.valueAsNumber)}
		/></label
	>
	<div class="stage">
		<motion.div class="dot" style={{ x, opacity }} /><motion.div
			class="dot companion"
			style={{ x }}
		/>
	</div>
	<output>Both positions: {Math.round($position)}px</output>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 20px;
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
		justify-items: center;
		gap: 12px;
		width: 260px;
		padding: 15px;
	}
	.stage :global(.dot) {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #d34123;
	}
	.stage :global(.companion) {
		width: 28px;
		height: 28px;
		background: #859575;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
