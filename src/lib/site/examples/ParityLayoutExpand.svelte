<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';
	let expanded = $state(false);
	let card = $state<HTMLElement | null>(null);
	let detail = $state<HTMLParagraphElement | null>(null);
	let exitSize = $state<{ width: number; height: number }>();
	let exitText = $state<{
		left: number;
		top: number;
		width: number;
		height: number;
		scaleX: number;
		scaleY: number;
	}>();
	const detailStyle = $derived(
		exitText
			? { ...exitText, position: 'absolute' as const, margin: 0, originX: 0, originY: 0 }
			: undefined
	);
	const detailLayout = $derived(exitText ? false : ('position' as const));
	function toggle() {
		if (expanded && card) {
			// A close can interrupt expansion: hold the currently painted size, not its destination.
			const bounds = card.getBoundingClientRect();
			exitSize = { width: bounds.width, height: bounds.height };
			if (detail) {
				const text = detail.getBoundingClientRect();
				const style = getComputedStyle(detail);
				const width = parseFloat(style.width);
				const height = parseFloat(style.height);
				// Preserve the text's current wrapping and inherited scale when the card stops resizing.
				exitText = {
					left: text.left - bounds.left - card.clientLeft,
					top: text.top - bounds.top - card.clientTop,
					width,
					height,
					scaleX: text.width / width,
					scaleY: text.height / height
				};
			}
		} else {
			exitSize = undefined;
			exitText = undefined;
		}
		expanded = !expanded;
	}
	function finishExit() {
		if (!expanded) {
			exitSize = undefined;
			exitText = undefined;
		}
	}
</script>

<div class="demo">
	<motion.article
		bind:ref={card}
		class="card"
		layout
		style={{
			width: expanded ? 310 : (exitSize?.width ?? 230),
			height: exitSize?.height,
			borderRadius: 10
		}}
		transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 } }}
	>
		<motion.div layout="position" class="content" style={{ width: exitText?.width }}>
			<p class="eyebrow">FIELD NOTES</p>
			<h3>Leave room for a new idea.</h3>
			<button type="button" aria-expanded={expanded} onclick={toggle}>
				{expanded ? 'Close the note' : 'Read the note'}
			</button>
		</motion.div>
		<!-- Correct scale while entering; the captured exit box takes over during the fade. -->
		<AnimatePresence present={expanded} onExitComplete={finishExit}>
			<motion.p
				bind:ref={detail}
				layout={detailLayout}
				class="detail"
				style={detailStyle}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.18 }}
			>
				Change the real width and content. Layout animation connects the measured sizes while the
				inner text keeps its proportions.
			</motion.p>
		</AnimatePresence>
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
		position: relative;
		overflow: clip;
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
