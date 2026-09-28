<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let expanded = $state(false);
</script>

<div class="demo">
	<motion.article
		class="card"
		layout
		style={{ width: expanded ? 310 : 230 }}
		transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 } }}
	>
		<motion.div layout="position" class="content">
			<p class="eyebrow">FIELD NOTES</p>
			<h3>Leave room for a new idea.</h3>
			<button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
				{expanded ? 'Close the note' : 'Read the note'}
			</button>
		</motion.div>
		{#if expanded}
			<motion.p
				class="detail"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.18 }}
			>
				Change the real width and content. Layout animation connects the measured sizes while the
				inner text keeps its proportions.
			</motion.p>
		{/if}
	</motion.article>
</div>

<style>
	.demo {
		display: grid;
		place-items: center;
		min-height: 290px;
		color: #252821;
	}
	.demo :global(.card) {
		max-width: 100%;
		box-sizing: border-box;
		padding: 23px;
		border: 1px solid #ddded3;
		border-radius: 10px;
		background: #fffdf7;
	}
	.demo :global(.content) {
		position: relative;
	}
	.eyebrow {
		margin: 0 0 13px;
		color: #62695a;
		font-size: 9px;
		letter-spacing: 0.1em;
	}
	h3 {
		margin: 0 0 19px;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}
	button {
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
	.demo :global(.detail) {
		margin: 18px 0 0;
		color: #62695a;
		font-size: 12px;
		line-height: 1.6;
	}
</style>
