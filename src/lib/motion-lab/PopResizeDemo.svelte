<script lang="ts">
	import { AnimatePresence, motion, updateLayout } from '../motion/index.js';

	let expanded = $state(true);
	let exiting = $state(false);
	let slow = $state(false);
	let clip = $state(false);
	let explicit = $state(false);
	const duration = $derived(slow ? 3 : 0.8);

	function toggle() {
		const change = () => {
			exiting = expanded;
			expanded = !expanded;
		};
		if (explicit) updateLayout(change);
		else change();
	}

	function complete() {
		if (!expanded) exiting = false;
	}
</script>

<section class="demo" aria-label="Simultaneous resize and exit demo">
	<div class="toolbar">
		<button type="button" onclick={toggle} aria-expanded={expanded}>
			{expanded ? 'Collapse and fade' : 'Expand again'}
		</button>
		<span class="status" aria-live="polite">
			{expanded ? 'Expanded' : exiting ? 'Fading while resizing' : 'Collapsed'}
		</span>
	</div>
	<div class="options">
		<label><input type="checkbox" bind:checked={slow} /> Slow motion</label>
		<label><input type="checkbox" bind:checked={clip} /> Clip to card</label>
		<label><input type="checkbox" bind:checked={explicit} /> Explicit transaction</label>
	</div>
	<div class="stage">
		<motion.article
			data-pop-demo-card
			layout
			class="card"
			style={{ width: expanded ? 420 : 240, overflow: clip ? 'clip' : 'visible' }}
			transition={{ layout: { duration, ease: 'easeInOut' } }}
		>
			<AnimatePresence
				present={expanded}
				mode="popLayout"
				initial={false}
				onExitComplete={complete}
			>
				<motion.p
					data-pop-demo-text
					layout="position"
					class="copy"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration, ease: 'linear', layout: { duration, ease: 'easeInOut' } }}
				>
					Keep your eyes on these line breaks. The card gets narrower while this paragraph fades,
					but the words keep their original wrapping and proportions. Click again before the fade
					finishes to reverse it.
				</motion.p>
			</AnimatePresence>
		</motion.article>
	</div>
	<p class="hint">
		Both changes start together. With clipping off, the preserved text can extend beyond the
		shrinking outline. Turn clipping on to see why keeping the exit box and keeping every character
		inside the card are separate choices.
	</p>
</section>

<style>
	.demo {
		border: 1px solid #d9d8d0;
		border-radius: 12px;
		padding: clamp(18px, 4vw, 32px);
		background: #fffdf7;
	}
	.toolbar,
	.options {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}
	button {
		border: 1px solid #252821;
		border-radius: 6px;
		padding: 12px 18px;
		background: #252821;
		color: #fffdf7;
		font: inherit;
		cursor: pointer;
		min-width: 180px;
	}
	button:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}
	.status,
	.options,
	.hint {
		font-size: 13px;
		color: #62695a;
	}
	.options {
		margin-top: 22px;
	}
	label {
		display: flex;
		align-items: center;
		gap: 7px;
		cursor: pointer;
	}
	input {
		accent-color: #bc3c21;
	}
	.stage {
		padding: 40px 0 24px;
		min-height: 340px;
	}
	.stage :global(.card) {
		position: relative;
		box-sizing: border-box;
		max-width: 100%;
		height: 270px;
		padding: 24px;
		border: 1px solid #bc3c21;
		border-radius: 8px;
		background: #f4f0e5;
	}
	.stage :global(.copy) {
		margin: 0;
		max-width: 100%;
		font-size: 17px;
		line-height: 1.65;
		color: #252821;
	}
	.hint {
		max-width: 65ch;
		margin: 0;
		line-height: 1.7;
	}
</style>
