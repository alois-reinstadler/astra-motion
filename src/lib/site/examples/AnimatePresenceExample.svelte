<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';
	let visible = $state(true);
</script>

<div class="example">
	<button aria-expanded={visible} onclick={() => (visible = !visible)}>
		{visible ? 'Dismiss note' : 'Show note'}
	</button>
	<div class="stage">
		<AnimatePresence present={visible} initial={false}>
			<motion.aside
				reducedMotion="user"
				class="note"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -16 }}
				transition={{ duration: 0.25 }}
			>
				<span>A LITTLE REMINDER</span>
				<p>Make room for your next idea.</p>
			</motion.aside>
		</AnimatePresence>
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
		width: min(100%, 290px);
		min-height: 150px;
	}
	.stage :global(.note) {
		padding: 26px;
		background: #dfe5d1;
		border-radius: 4px;
	}
	span {
		font-size: 9px;
		letter-spacing: 0.13em;
	}
	p {
		margin: 20px 0 0;
		font-size: 23px;
		line-height: 1.25;
		letter-spacing: -0.04em;
	}
</style>
