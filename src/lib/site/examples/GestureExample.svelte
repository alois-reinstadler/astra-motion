<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createMotion, motionStore, motionValue } from '$lib/motion/index.js';

	let saved = $state(false);
	const button = createMotion({
		whileHover: { y: -3, scale: 1.03 },
		whileTap: { scale: 0.95 },
		whileFocus: { scale: 1.03 },
		transition: { type: 'spring', stiffness: 400, damping: 24 }
	});
	const x = motionValue(0);
	const position = motionStore(x);
	const handle = createMotion({
		style: { x },
		drag: 'x',
		dragConstraints: { left: 0, right: 168 },
		dragMomentum: false,
		whileDrag: { scale: 1.08 },
		transition: { type: 'spring', stiffness: 400, damping: 24 }
	});
	onDestroy(() => x.destroy());
</script>

<div class="example">
	<div class="button-demo">
		<p class="eyebrow">A LITTLE FEEDBACK</p>
		<button
			class="save"
			type="button"
			aria-pressed={saved}
			onclick={() => (saved = !saved)}
			{...button.props}
		>
			<span aria-hidden="true">{saved ? '✓' : '+'}</span>
			{saved ? 'Saved to collection' : 'Save to collection'}
		</button>
		<p class="hint">Hover, press, or focus.</p>
	</div>
	<div class="drag-demo">
		<div class="drag-heading">
			<span>TAKE IT FOR A SLIDE</span><span aria-hidden="true">↔</span>
		</div>
		<div class="track" aria-hidden="true">
			<div class="rail"></div>
			<div class="handle" {...handle.props}><span>↔</span></div>
		</div>
		<label
			><span>Or move with a slider</span><input
				aria-label="Position of the draggable tile"
				type="range"
				min="0"
				max="168"
				step="1"
				bind:value={$position}
			/></label
		>
	</div>
</div>

<style>
	.example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.button-demo {
		display: grid;
		justify-items: center;
		padding: 19px 0 24px;
	}
	.eyebrow {
		margin: 0 0 22px;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.1em;
	}
	.save {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-width: 199px;
		padding: 13px 17px;
		border: 0;
		border-radius: 4px;
		background: #bc3c21;
		color: #fffaf1;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}
	.save span {
		font-size: 19px;
		line-height: 1;
	}
	.save:focus-visible {
		outline: 2px solid #252821;
		outline-offset: 5px;
	}
	.hint {
		margin: 17px 0 0;
		font-size: 11px;
		color: #707367;
	}
	.drag-demo {
		display: grid;
		justify-items: center;
		gap: 15px;
		padding: 20px 12px 18px;
		background: #eeeee5;
		border-radius: 4px;
	}
	.drag-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 216px;
		max-width: 100%;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.08em;
	}
	.drag-heading > span:last-child {
		font-size: 19px;
		line-height: 1;
		font-weight: 400;
	}
	.track {
		position: relative;
		width: 216px;
		height: 48px;
	}
	.rail {
		position: absolute;
		inset: 23px 0 auto;
		height: 1px;
		background: #bcc3ac;
	}
	.rail::before,
	.rail::after {
		position: absolute;
		content: '';
		width: 5px;
		height: 5px;
		top: -2px;
		border-radius: 50%;
		background: #929d83;
	}
	.rail::after {
		right: 0;
	}
	.handle {
		position: relative;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 4px;
		background: #dfe5d1;
		border: 1px solid #bfc8ae;
		box-sizing: border-box;
		cursor: grab;
		user-select: none;
	}
	.handle:active {
		cursor: grabbing;
	}
	.handle span {
		font-size: 25px;
	}
	label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 216px;
		gap: 10px;
		font-size: 10px;
		color: #656b5c;
	}
	input {
		width: 73px;
		min-width: 0;
		accent-color: #536c40;
		cursor: pointer;
	}
	input:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}
</style>
