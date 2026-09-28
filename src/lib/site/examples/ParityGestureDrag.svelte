<script lang="ts">
	import { motion, useMotionValue } from '$lib/motion/index.js';
	let bounds = $state<HTMLDivElement | null>();
	let elastic = $state(0.35);
	let momentum = $state(true);
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	function reset() {
		x.jump(0);
		y.jump(0);
	}
</script>

<div class="demo">
	<motion.div class="bounds" bind:ref={bounds}>
		<motion.div
			class="tile"
			drag
			dragConstraints={() => bounds}
			dragElastic={elastic}
			dragMomentum={momentum}
			style={{ x, y }}
			whileDrag={{ scale: 1.04 }}
		>
			Move me
		</motion.div>
	</motion.div>
	<label
		>Elasticity <input
			aria-label="Drag elasticity"
			type="range"
			min="0"
			max="1"
			step="0.05"
			bind:value={elastic}
		/> <output>{elastic.toFixed(2)}</output></label
	>
	<label><input type="checkbox" bind:checked={momentum} /> Continue with release momentum</label>
	<div class="actions">
		<button
			type="button"
			onclick={() =>
				x.set(Math.min(Math.max(0, (bounds?.clientWidth ?? 84) - 84), Number(x.get()) + 24))}
			>Move right</button
		>
		<button type="button" onclick={reset}>Reset position</button>
	</div>
	<p>Try pulling beyond the edge. The buttons provide a pointer-free alternative.</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 360px;
		margin: auto;
		color: #252821;
		font-size: 12px;
	}
	.demo :global(.bounds) {
		position: relative;
		height: 170px;
		margin: 10px 0 22px;
		border: 1px dashed #929d83;
		border-radius: 8px;
		background: #eeeee5;
	}
	.demo :global(.tile) {
		display: grid;
		place-items: center;
		width: 84px;
		height: 64px;
		border-radius: 6px;
		background: #dfe5d1;
		border: 1px solid #bfc8ae;
		cursor: grab;
		touch-action: none;
	}
	label {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 12px 0;
	}
	input {
		accent-color: #536c40;
	}
	input[type='range'] {
		flex: 1;
		min-width: 0;
	}
	output {
		width: 28px;
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	button {
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		padding: 7px 10px;
		background: #fffdf7;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	p {
		color: #62695a;
		font-size: 11px;
		line-height: 1.6;
	}
</style>
