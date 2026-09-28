<script lang="ts">
	import { motion, motionStore, useScroll } from '$lib/motion/index.js';
	let container = $state<HTMLDivElement>();
	function attachContainer(node: HTMLDivElement) {
		container = node;
		return () => {
			container = undefined;
		};
	}
	const { scrollX, scrollY, scrollYProgress } = useScroll(() => ({ container }));
	const x = motionStore(scrollX);
	const y = motionStore(scrollY);
	const progress = motionStore(scrollYProgress);
</script>

<div class="example">
	<div class="controls">
		<button onclick={() => container?.scrollTo({ top: 240, left: 120 })}>Move both axes</button
		><button onclick={() => container?.scrollTo(0, 0)}>Reset scroll</button>
	</div>
	<div class="track">
		<motion.div class="progress" style={{ scaleX: scrollYProgress, originX: 0 }} />
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll region needs focus for native keyboard scrolling.) -->
	<div
		class="viewport"
		{@attach attachContainer}
		tabindex="0"
		role="region"
		aria-label="Two-axis scroll area"
	>
		<div class="content">
			<p>Scroll down and across.</p>
			<p class="bottom">Both pixel values update together.</p>
		</div>
	</div>
	<output>X {Math.round($x)}px · Y {Math.round($y)}px · {Math.round($progress * 100)}%</output>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 16px;
		width: 100%;
		padding: 24px 18px;
		color: var(--site-ink, #252821);
	}
	.controls {
		display: flex;
		gap: 8px;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 20px;
		padding: 7px 12px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible,
	.viewport:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.track,
	.viewport {
		width: min(100%, 290px);
	}
	.track {
		height: 4px;
		background: #dfe5d1;
	}
	.track :global(.progress) {
		height: 100%;
		background: #d34123;
	}
	.viewport {
		position: relative;
		height: 180px;
		overflow: auto;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 4px;
	}
	.content {
		position: relative;
		width: 600px;
		height: 480px;
		padding: 20px;
		background: linear-gradient(140deg, #dfe5d1, #edd1ba);
		font-size: 13px;
	}
	.bottom {
		position: absolute;
		bottom: 20px;
		right: 20px;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
