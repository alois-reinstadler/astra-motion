<script lang="ts">
	import { motion, useScroll, useMotionValueEvent } from '$lib/motion/index.js';
	let container = $state<HTMLDivElement>();
	let hidden = $state(false);
	const { scrollY } = useScroll(() => ({ container }));
	useMotionValueEvent(scrollY, 'change', (next) => {
		const previous = scrollY.getPrevious() ?? next;
		if (next < 16 || next < previous - 2) hidden = false;
		else if (next > previous + 2) hidden = true;
	});
	function attachContainer(node: HTMLDivElement) {
		container = node;
		return () => {
			container = undefined;
		};
	}
</script>

<div class="example">
	<div class="controls">
		<button onclick={() => container?.scrollTo({ top: 220, behavior: 'instant' })}
			>Read further</button
		>
		<button
			onclick={() =>
				container?.scrollTo({ top: Math.max(0, container.scrollTop - 100), behavior: 'instant' })}
			>Scroll back</button
		>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The reading region supports native keyboard scrolling.) -->
	<div
		class="reader"
		role="region"
		aria-label="Reading a field note"
		tabindex="0"
		{@attach attachContainer}
	>
		<motion.header
			class="reading-header"
			animate={{ y: hidden ? -48 : 0 }}
			transition={{ duration: 0.18 }}
			aria-hidden={hidden}>Field notes · Coastal light</motion.header
		>
		<article>
			<h3>Leave room for discovery.</h3>
			<p>Scroll down to give the reading more space. Scroll up to bring the header back.</p>
			<p>
				A walk without a deadline. A notebook without a plan. Some of the best observations begin
				when you stop looking for something in particular.
			</p>
			<p>
				Past the station, the path opens to the coast. Take the long way and watch the light change.
			</p>
			<p>
				Keep a note of what caught your attention. Return to it when the next idea needs a place to
				begin.
			</p>
		</article>
	</div>
	<output aria-live="polite"
		>{hidden ? 'Header hidden while reading down' : 'Header visible'}</output
	>
	<p class="hint">
		The change listener compares the previous scroll position. Svelte state changes only when the
		direction changes.
	</p>
</div>

<style>
	.example {
		display: grid;
		gap: 18px;
		width: min(100%, 380px);
		margin: auto;
		color: var(--site-ink, #252821);
	}
	.controls {
		display: flex;
		gap: 10px;
	}
	button {
		padding: 8px 14px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	:is(button, .reader):focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.reader {
		height: 260px;
		overflow: auto;
		border: 1px solid var(--site-line, #d8d8cc);
		scrollbar-width: thin;
		scrollbar-color: var(--site-muted) transparent;
	}
	.example :global(.reading-header) {
		position: sticky;
		top: 0;
		height: 48px;
		display: flex;
		align-items: center;
		padding: 0 20px;
		background: #dfe5d1;
		color: #252821;
		font-size: 12px;
		z-index: 1;
	}
	article {
		padding: 0 20px 30px;
	}
	h3 {
		font-size: 22px;
		font-weight: 500;
		line-height: 1.2;
	}
	article p {
		font-size: 14px;
		line-height: 1.9;
		margin: 30px 0;
	}
	output,
	.hint {
		font-size: 12px;
		line-height: 1.6;
		margin: 0;
		color: var(--site-muted, #67695e);
	}
</style>
