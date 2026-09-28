<script lang="ts">
	import { motion, useReducedMotion } from '$lib/motion/index.js';
	const reduced = useReducedMotion();
	let moved = $state(false);
</script>

<div class="example">
	<button onclick={() => (moved = !moved)}>Change state</button>
	<div class="stage">
		<motion.div
			class="card"
			initial={false}
			animate={{ x: moved && reduced.current === false ? 70 : 0, opacity: moved ? 0.45 : 1 }}
			transition={{ duration: 0.3 }}>A</motion.div
		>
	</div>
	<p aria-live="polite">
		{reduced.current === null
			? 'Preference not measured yet'
			: reduced.current
				? 'Reduced motion: fade only'
				: 'Full motion: move and fade'}
	</p>
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
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 22px;
		padding: 8px 14px;
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
		width: 250px;
		height: 110px;
	}
	.stage :global(.card) {
		display: grid;
		place-items: center;
		width: 70px;
		height: 80px;
		border-radius: 4px;
		background: #dfe5d1;
		font-size: 38px;
	}
	p {
		margin: 0;
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
