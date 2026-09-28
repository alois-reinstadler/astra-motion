<script lang="ts">
	import { motion, type Transition } from '$lib/motion/index.js';
	let selected = $state('spring');
	let moved = $state(false);
	const transition = $derived<Transition>(
		selected === 'spring'
			? { type: 'spring', stiffness: 140, damping: 12 }
			: { type: 'tween', duration: 0.8, ease: selected === 'linear' ? 'linear' : 'easeInOut' }
	);
</script>

<div class="example">
	<div class="stage">
		<motion.div
			class="tile"
			aria-hidden="true"
			reducedMotion="user"
			animate={{ x: moved ? 100 : -100 }}
			{transition}
		/>
	</div>
	<div class="controls">
		<label
			>Transition <select bind:value={selected}
				><option value="spring">Spring</option><option value="linear">Linear tween</option><option
					value="ease">Eased tween</option
				></select
			></label
		><button onclick={() => (moved = !moved)}>Move tile</button>
	</div>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 28px 16px;
		color: var(--site-ink, #252821);
	}
	:is(button, select) {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 9px 18px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	:is(button, select):focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		display: grid;
		place-items: center;
		width: min(100%, 340px);
		min-height: 180px;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 12px;
		font-size: 12px;
	}
	.example :global(.tile) {
		width: 64px;
		height: 64px;
		border-radius: 16px;
		background: var(--site-accent, #d34123);
	}
</style>
