<script lang="ts">
	import { motion, motionStore, useSpring, useReducedMotion } from '$lib/motion/index.js';
	let target = $state(0);
	let gentle = $state(false);
	const x = useSpring(0, () => ({ stiffness: gentle ? 100 : 300, damping: gentle ? 18 : 26 }));
	const value = motionStore(x);
	const reduced = useReducedMotion();
	function move(next: number) {
		target = next;
		x.set(next);
		if (reduced.current !== false) x.jump(next);
	}
</script>

<div class="example">
	<label
		>Target <input
			aria-label="Spring target"
			type="range"
			min="-90"
			max="90"
			value="0"
			oninput={(event) => move(event.currentTarget.valueAsNumber)}
		/></label
	>
	<div class="stage"><motion.div class="dot" style={{ x }} /></div>
	<div class="controls">
		<label><input type="checkbox" bind:checked={gentle} /> Gentle spring</label><button
			onclick={() => x.jump(target)}>Jump to target</button
		>
	</div>
	<output>{Math.round($value)}px</output>
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
	input[type='range'] {
		width: 220px;
	}
	input {
		accent-color: var(--site-accent, #d34123);
	}
	.stage {
		display: grid;
		place-items: center;
		width: 260px;
		height: 75px;
	}
	.stage :global(.dot) {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #d34123;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	.controls label {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	button {
		border: 0;
		border-bottom: 1px solid var(--site-line, #d8d8cc);
		background: transparent;
		color: inherit;
		padding: 5px 0;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
