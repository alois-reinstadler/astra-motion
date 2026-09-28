<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let saved = $state(false);
	let feedback = $state('Ready');
</script>

<div class="demo">
	<p class="eyebrow">SMALL, USEFUL FEEDBACK</p>
	<motion.button
		type="button"
		class="save"
		aria-pressed={saved}
		onclick={() => (saved = !saved)}
		whileHover={{ y: -3 }}
		whileTap={{ scale: 0.95 }}
		whileFocus={{ scale: 1.04 }}
		onHoverStart={() => (feedback = 'Hovering')}
		onHoverEnd={() => (feedback = 'Ready')}
		onTapStart={() => (feedback = 'Pressed')}
		onTap={() => (feedback = 'Released inside')}
		onTapCancel={() => (feedback = 'Press cancelled')}
		transition={{ type: 'spring', stiffness: 420, damping: 30 }}
	>
		{saved ? 'Saved to collection' : 'Save to collection'}
	</motion.button>
	<output aria-live="polite">{feedback}</output>
	<p class="hint">Hover, press, or Tab to focus. The native button owns the click.</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: center;
		gap: 22px;
		padding: 28px 14px;
		color: #252821;
	}
	.eyebrow {
		margin: 0;
		font-size: 9px;
		letter-spacing: 0.1em;
	}
	.demo :global(.save) {
		padding: 15px 22px;
		border: 0;
		border-radius: 5px;
		background: #bc3c21;
		color: #fffaf1;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	.demo :global(.save:focus-visible) {
		outline: 2px solid #252821;
		outline-offset: 5px;
	}
	output {
		font-size: 12px;
	}
	.hint {
		margin: 0;
		max-width: 280px;
		color: #62695a;
		font-size: 11px;
		text-align: center;
	}
</style>
