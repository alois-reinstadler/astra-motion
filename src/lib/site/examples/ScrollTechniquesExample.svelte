<script lang="ts">
	import { motion, useScroll } from '$lib/motion/index.js';
	let container = $state<HTMLDivElement>();
	function attachContainer(node: HTMLDivElement) {
		container = node;
		return () => {
			container = undefined;
		};
	}
	const { scrollYProgress } = useScroll(() => ({ container }));
</script>

<div class="example">
	<p>The bar follows scroll continuously. The note animates when it enters.</p>
	<div class="track">
		<motion.div class="bar" style={{ scaleX: scrollYProgress, originX: 0 }} />
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll region needs focus for native keyboard scrolling.) -->
	<div
		class="viewport"
		{@attach attachContainer}
		tabindex="0"
		role="region"
		aria-label="Scroll techniques"
	>
		<div class="spacer">Scroll to discover the note.</div>
		<motion.article
			class="note"
			reducedMotion="user"
			initial={{ opacity: 0.3, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ root: () => container, amount: 0.7 }}
			transition={{ duration: 0.25 }}>A change of perspective.</motion.article
		>
		<div class="spacer"></div>
	</div>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 14px;
		width: 100%;
		padding: 24px 18px;
		color: var(--site-ink, #252821);
	}
	p {
		max-width: 300px;
		margin: 0;
		font-size: 12px;
		line-height: 1.6;
		text-align: center;
		color: var(--site-muted, #67695e);
	}
	.track,
	.viewport {
		width: min(100%, 300px);
	}
	.track {
		height: 4px;
		background: #dfe5d1;
	}
	.track :global(.bar) {
		height: 100%;
		background: #d34123;
	}
	.viewport {
		position: relative;
		height: 190px;
		overflow: auto;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 4px;
	}
	.viewport:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.spacer {
		height: 210px;
		padding: 22px;
		font-size: 12px;
	}
	.viewport :global(.note) {
		display: grid;
		place-items: center;
		margin: 0 20px;
		padding: 22px;
		min-height: 110px;
		background: #edd1ba;
		border-radius: 4px;
		font-size: 22px;
		letter-spacing: -0.04em;
	}
</style>
