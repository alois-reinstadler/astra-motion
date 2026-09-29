<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	const answerId = $props.id();
	let open = $state(false);
	const panel = motion.bind({
		initial: { height: 0, opacity: 0 },
		animate: { height: 'auto', opacity: 1 },
		exit: { height: 0, opacity: 0 },
		transition: { duration: 0.2 },
		reducedMotion: 'user'
	});
	const reveal = panel.transition;
</script>

<div class="snippet-stage">
	<button aria-expanded={open} aria-controls={answerId} onclick={() => (open = !open)}>
		How does removal work?
	</button>
	{#if open}
		<div id={answerId} class="answer" {...panel.props} transition:reveal|global>
			<p>The native branch remains mounted until its exit finishes.</p>
		</div>
	{/if}
</div>

<style>
	.snippet-stage {
		display: grid;
		justify-items: start;
		gap: 16px;
		width: min(100%, 360px);
		min-height: 180px;
		margin: auto;
		color: #252821;
		font-size: 14px;
		line-height: 1.6;
	}
	.snippet-stage :global(button) {
		font: inherit;
		color: inherit;
		padding: 10px 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
		background: #f7f7f0;
		cursor: pointer;
	}
	.snippet-stage :global(button:disabled) {
		opacity: 0.5;
		cursor: default;
	}
	.snippet-stage :global(:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}

	.answer {
		overflow: hidden;
	}
</style>
