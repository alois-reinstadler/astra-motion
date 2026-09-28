<script lang="ts">
	import { AnimateActivity, motion } from '$lib/motion/index.js';
	let visible = $state(true);
</script>

<div class="example">
	<button
		aria-expanded={visible}
		aria-controls="retained-editor"
		onclick={() => (visible = !visible)}
	>
		{visible ? 'Hide editor' : 'Show editor'}
	</button>
	<div class="stage">
		<AnimateActivity mode={visible ? 'visible' : 'hidden'} initial={false}>
			<motion.section
				reducedMotion="user"
				id="retained-editor"
				class="editor"
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -14 }}
				transition={{ duration: 0.25 }}
			>
				<label for="retained-draft">A thought to keep</label>
				<input id="retained-draft" placeholder="Write something here" />
				<p>Hide this panel, then show it again. The input keeps its value.</p>
			</motion.section>
		</AnimateActivity>
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
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		width: min(100%, 320px);
		min-height: 188px;
	}
	.stage :global(.editor) {
		display: grid;
		gap: 14px;
		padding: 24px;
		background: #e4dfce;
		border-radius: 4px;
	}
	label {
		font-size: 13px;
		font-weight: 550;
	}
	input {
		min-width: 0;
		width: 100%;
		border: 0;
		border-bottom: 1px solid #a9aa99;
		border-radius: 0;
		padding: 10px 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 15px;
	}
	p {
		margin: 0;
		color: var(--site-muted, #67695e);
		font-size: 11px;
		line-height: 1.6;
	}
</style>
