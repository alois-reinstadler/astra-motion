<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let drawn = $state(false);
	let zoomed = $state(false);
</script>

<div class="example">
	<div class="stage">
		<motion.svg
			width="320"
			height="180"
			viewBox="0 0 320 180"
			aria-label="An animated curved line"
			role="img"
			reducedMotion="user"
			animate={{ viewBox: zoomed ? '60 25 200 112.5' : '0 0 320 180' }}
			transition={{ duration: 0.5 }}
		>
			<motion.path
				d="M 35 125 C 95 10 220 170 285 55"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				initial={{ pathLength: 0.05 }}
				animate={{ pathLength: drawn ? 1 : 0.05 }}
				transition={{ duration: 0.8, ease: 'easeInOut' }}
			/>
			<motion.circle
				cy="125"
				r="7"
				fill="var(--site-accent,#d34123)"
				initial={false}
				animate={{ cx: drawn ? 285 : 35, cy: drawn ? 55 : 125, r: drawn ? 11 : 7 }}
				transition={{ duration: 0.8 }}
			/>
		</motion.svg>
	</div>
	<div class="controls">
		<button aria-pressed={drawn} onclick={() => (drawn = !drawn)}>Draw line</button><button
			aria-pressed={zoomed}
			onclick={() => (zoomed = !zoomed)}>Zoom view</button
		>
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
	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 12px;
		font-size: 12px;
	}
</style>
