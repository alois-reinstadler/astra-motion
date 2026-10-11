<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';

	let plain = $state<HTMLElement | null>(null);
	let safe = $state<HTMLElement | null>(null);
	let plainBox = $state<{ width: number; height: number }>();
	let safeBox = $state<{ width: number; height: number }>();
	let expanded = $state(false);

	function toggle() {
		if (expanded) {
			const a = plain?.getBoundingClientRect();
			const b = safe?.getBoundingClientRect();
			plainBox = a ? { width: a.width, height: a.height } : undefined;
			safeBox = b ? { width: b.width, height: b.height } : undefined;
		} else {
			plainBox = undefined;
			safeBox = undefined;
		}
		expanded = !expanded;
	}
</script>

<div class="pair">
	<motion.article
		bind:ref={plain}
		class="card"
		layout
		style={{ width: expanded ? 380 : (plainBox?.width ?? 240), height: plainBox?.height }}
		transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 } }}
	>
		<h3>Without protection</h3>
		<p class="note">
			The spring scales this paragraph while the card resizes. Watch the glyphs stretch.
		</p>
		<AnimatePresence present={expanded} onExitComplete={() => (plainBox = undefined)}>
			<motion.p
				class="detail"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.18 }}
			>
				Room 2 · Coastal light — afternoons with nowhere else to be.
			</motion.p>
		</AnimatePresence>
		<button type="button" aria-expanded={expanded} onclick={toggle}>
			{expanded ? 'Close session' : 'Read session'}
		</button>
	</motion.article>

	<motion.article
		bind:ref={safe}
		class="card"
		layout
		style={{ width: expanded ? 380 : (safeBox?.width ?? 240), height: safeBox?.height }}
		transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 } }}
	>
		<h3>With layout="position"</h3>
		<motion.div layout="position" class="body">
			<p class="note">The inner boundary corrects the inherited scale, so the text only rewraps.</p>
			<AnimatePresence present={expanded} onExitComplete={() => (safeBox = undefined)}>
				<motion.p
					class="detail"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18 }}
				>
					Room 2 · Coastal light — afternoons with nowhere else to be.
				</motion.p>
			</AnimatePresence>
		</motion.div>
		<button type="button" aria-expanded={expanded} onclick={toggle}>
			{expanded ? 'Close session' : 'Read session'}
		</button>
	</motion.article>
</div>

<style>
	.pair {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		align-items: flex-start;
	}
	.pair :global(.card) {
		padding: 20px;
		border: 1px solid #ddded3;
		border-radius: 10px;
		background: #fffdf7;
		overflow: clip;
		box-sizing: border-box;
		max-width: 100%;
		color: #252821;
	}
	h3 {
		margin: 0 0 10px;
		font-size: 16px;
		font-weight: 550;
	}
	.note {
		margin: 0;
		color: #62695a;
		font-size: 12px;
		line-height: 1.6;
	}
	.pair :global(.detail) {
		margin: 12px 0 0;
		color: #62695a;
		font-size: 12px;
		line-height: 1.6;
	}
	button {
		margin-top: 14px;
		padding: 8px 10px;
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		background: #dfe5d1;
		color: inherit;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
</style>
