<script lang="ts">
	import { motion, motionStore, useMotionValue, useMotionTemplate } from '$lib/motion/index.js';
	const blur = useMotionValue(0);
	const filter = useMotionTemplate`blur(${blur}px) saturate(${120}%)`;
	const current = motionStore(filter);
</script>

<div class="example">
	<label
		>Blur <input
			aria-label="Blur"
			type="range"
			min="0"
			max="8"
			step="0.5"
			value="0"
			oninput={(event) => blur.set(event.currentTarget.valueAsNumber)}
		/></label
	>
	<motion.div class="tile" style={{ filter }} aria-hidden="true">A</motion.div>
	<output>{$current}</output>
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
	.example :global(.tile) {
		display: grid;
		place-items: center;
		width: 100px;
		height: 100px;
		border-radius: 5px;
		background: #edd1ba;
		color: #d34123;
		font-size: 64px;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
