<script lang="ts">
	import { MotionConfig, motion } from '$lib/motion/index.js';
	let reduced = $state(false);
	let moved = $state(false);
	let duration = $state(0.6);
</script>

<div class="example">
	<MotionConfig
		reducedMotion={reduced ? 'always' : 'user'}
		transition={{ duration, ease: 'easeInOut' }}
	>
		<div class="stage">
			<motion.div
				class="tile"
				aria-hidden="true"
				initial={false}
				animate={{ x: moved ? 95 : -95, opacity: moved ? 0.35 : 1 }}
			/>
		</div>
	</MotionConfig>
	<div class="controls">
		<label><input type="checkbox" bind:checked={reduced} /> Always reduce motion</label><label
			>Duration <input type="range" min="0.2" max="1.2" step="0.1" bind:value={duration} /></label
		><button onclick={() => (moved = !moved)}>Animate with policy</button>
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
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 9px 18px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	:is(button, input):focus-visible {
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
