<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';
	const notes = ['Make room.', 'Find a rhythm.', 'Keep moving.'];
	let selected = $state(0);
	let mode = $state<'sync' | 'wait'>('wait');
</script>

<div class="example">
	<div class="controls" role="group" aria-label="Presence sequence">
		<button aria-pressed={mode === 'sync'} onclick={() => (mode = 'sync')}>Sync</button>
		<button aria-pressed={mode === 'wait'} onclick={() => (mode = 'wait')}>Wait</button>
		<button onclick={() => (selected = (selected + 1) % notes.length)}>Next note</button>
	</div>
	<div class="stage">
		<AnimatePresence items={[selected]} key={(index) => index} {mode}>
			{#snippet children(index)}
				<motion.article
					reducedMotion="user"
					class="card"
					initial={{ opacity: 0, y: 28 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -28 }}
					transition={{ duration: 0.35 }}
				>
					<span>NOTE 0{index + 1}</span>
					<h3>{notes[index]}</h3>
				</motion.article>
			{/snippet}
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
	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 8px 14px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		background: var(--site-ink, #252821);
		color: var(--site-paper, #fffdf7);
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		position: relative;
		width: min(100%, 290px);
		height: 160px;
	}
	.stage :global(.card) {
		position: absolute;
		inset: 0;
		padding: 26px;
		border-radius: 4px;
		background: #edd1ba;
	}
	span {
		font-size: 9px;
		letter-spacing: 0.13em;
	}
	h3 {
		margin: 28px 0 0;
		font-size: 29px;
		font-weight: 500;
		letter-spacing: -0.05em;
	}
</style>
