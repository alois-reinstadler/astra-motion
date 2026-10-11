<script lang="ts">
	import { AnimatePresence, MotionConfig, motion } from '$lib/motion/index.js';
	let expanded = $state(false);
</script>

<MotionConfig transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 } }}>
	<div class="pair">
		<motion.article class="card" layout style={{ width: expanded ? 380 : 240 }}>
			<h3>Without protection</h3>
			<p class="note">
				The spring scales this paragraph while the card resizes. Watch the glyphs stretch.
			</p>
			<AnimatePresence present={expanded} mode="popLayout">
				<motion.p
					class="detail"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ opacity: { duration: 0.18 } }}
				>
					Room 2 · Coastal light — afternoons with nowhere else to be.
				</motion.p>
			</AnimatePresence>
			<button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
				{expanded ? 'Close session' : 'Read session'}
			</button>
		</motion.article>

		<motion.article class="card" layout style={{ width: expanded ? 380 : 240 }}>
			<motion.h3 layout="position">With layout="position"</motion.h3>
			<motion.div layout="position" class="body">
				<p class="note">
					The inner boundary corrects the inherited scale, so the text only rewraps.
				</p>
				<AnimatePresence present={expanded} mode="popLayout">
					<motion.p
						layout="position"
						class="detail"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ opacity: { duration: 0.18 } }}
					>
						Room 2 · Coastal light — afternoons with nowhere else to be.
					</motion.p>
				</AnimatePresence>
			</motion.div>
			<motion.button
				layout="position"
				type="button"
				aria-expanded={expanded}
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? 'Close session' : 'Read session'}
			</motion.button>
		</motion.article>
	</div>
</MotionConfig>

<style>
	.pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
		align-items: start;
	}
	.pair :global(.card) {
		position: relative;
		justify-self: start;
		padding: 20px;
		border: 1px solid #ddded3;
		border-radius: 10px;
		background: #fffdf7;
		overflow: clip;
		box-sizing: border-box;
		max-width: 100%;
		color: #252821;
	}
	.pair :global(h3) {
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
	.pair :global(button) {
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
	.pair :global(button:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	@media (max-width: 640px) {
		.pair {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
