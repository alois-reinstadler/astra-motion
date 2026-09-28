<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let moved = $state(false);
</script>

<div class="example">
	<div class="stage">
		<motion.div
			class="tile"
			aria-hidden="true"
			reducedMotion="user"
			animate={{
				x: moved ? 90 : -90,
				rotate: moved ? 90 : 0,
				borderRadius: moved ? '50%' : '16px'
			}}
			transition={{ type: 'spring', stiffness: 180, damping: 18 }}
		/>
	</div>
	<button aria-pressed={moved} onclick={() => (moved = !moved)}>Change target</button>
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
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		display: grid;
		place-items: center;
		width: min(100%, 340px);
		min-height: 180px;
	}
	.example :global(.tile) {
		width: 64px;
		height: 64px;
		border-radius: 16px;
		background: var(--site-accent, #d34123);
	}
</style>
