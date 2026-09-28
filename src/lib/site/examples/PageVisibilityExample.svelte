<script lang="ts">
	import { usePageInView, useAnimationFrame } from '$lib/motion/index.js';
	const page = usePageInView();
	let running = $state(false);
	let frames = $state(0);
	useAnimationFrame(
		() => {
			frames++;
		},
		() => ({ enabled: running && page.current })
	);
</script>

<div class="example">
	<button aria-pressed={running} onclick={() => (running = !running)}
		>{running ? 'Stop counting' : 'Start counting'}</button
	>
	<output>{frames} frames</output>
	<p>Page is {page.current ? 'visible' : 'hidden'}. Switch to another tab to pause counting.</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 32px 18px;
		color: var(--site-ink, #252821);
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 22px;
		padding: 8px 14px;
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
	output {
		font-size: 30px;
		font-variant-numeric: tabular-nums;
	}
	p {
		max-width: 290px;
		margin: 0;
		text-align: center;
		font-size: 12px;
		line-height: 1.6;
		color: var(--site-muted, #67695e);
	}
</style>
