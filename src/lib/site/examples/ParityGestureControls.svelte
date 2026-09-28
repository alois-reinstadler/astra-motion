<script lang="ts">
	import {
		motion,
		useDragControls,
		useMotionValue,
		useMotionValueEvent
	} from '$lib/motion/index.js';
	const controls = useDragControls();
	const x = useMotionValue(0);
	let position = $state(0);
	useMotionValueEvent(x, 'change', (value) => (position = Math.round(value)));
</script>

<div class="demo">
	<div class="track" aria-hidden="true">
		<motion.div
			class="thumb"
			drag="x"
			dragControls={controls}
			dragListener={false}
			dragConstraints={{ left: 0, right: 200 }}
			dragElastic={false}
			dragMomentum={false}
			style={{ x }}
		/>
	</div>
	<button class="handle" type="button" onpointerdown={(event) => controls.start(event)}>
		Drag from this handle
	</button>
	<label
		>Position <input
			aria-label="Handle position"
			type="range"
			min="0"
			max="200"
			value={position}
			oninput={(event) => x.set(Number(event.currentTarget.value))}
		/> <output>{position}</output></label
	>
	<div class="actions">
		<button type="button" onclick={() => controls.stop()}>Stop drag</button>
		<button type="button" onclick={() => controls.cancel()}>Cancel drag</button>
	</div>
	<p>The thumb ignores direct pointer presses. The handle starts its gesture.</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: center;
		gap: 18px;
		color: #252821;
		font-size: 12px;
	}
	.track {
		position: relative;
		width: 240px;
		height: 40px;
		border-radius: 20px;
		background: #eeeee5;
	}
	.demo :global(.thumb) {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #bc3c21;
	}
	button {
		padding: 9px 12px;
		border: 1px solid #bfc8ae;
		border-radius: 5px;
		background: #fffdf7;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.handle {
		touch-action: none;
		cursor: grab;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	label {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	input {
		width: 130px;
		accent-color: #536c40;
	}
	output {
		width: 24px;
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	p {
		max-width: 290px;
		margin: 0;
		color: #62695a;
		font-size: 11px;
		text-align: center;
		line-height: 1.6;
	}
</style>
