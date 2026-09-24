<script lang="ts">
	import { resolve } from '$app/paths';
	import { createScroll } from '../motion/scroll.svelte.js';
	import { motionStore } from '../motion/values.js';
	let reduced = $state(false);
	let mounted = $state(true);
	let extra = $state(false);
	const reader = createScroll(() => ({ reducedMotion: reduced ? 'always' : 'user' }));
	const chapters = createScroll(() => ({
		reducedMotion: reduced ? 'always' : 'user',
		offset: ['start end', 'end start']
	}));
	const horizontal = createScroll({ axis: 'x' });
	const progress = motionStore(reader.progress);
	const chapterProgress = motionStore(chapters.progress);
	const horizontalProgress = motionStore(horizontal.progress);
	const fill = reader.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
	const reveal = chapters.animate({ opacity: [0.25, 1], y: [64, 0] });
	const marker = horizontal.animate({ transform: ['translateX(0px)', 'translateX(240px)'] });
	export function readProgress() {
		return reader.progress.get();
	}
</script>

<main>
	<header>
		<a href={resolve('/motion-lab')}> Motion lab</a>
		<p class="eyebrow">25 / SCROLL</p>
		<h1>Follow the reading.</h1>
		<p class="intro">
			Container progress, section reveals, and horizontal tracking. Scroll each panel, reverse
			direction, then resize it.
		</p>
		<div class="controls">
			<button onclick={() => (reduced = !reduced)}>Reduced motion: {reduced ? 'on' : 'off'}</button>
			<button onclick={() => (mounted = !mounted)}
				>{mounted ? 'Unmount' : 'Remount'} scroller</button
			>
			<button onclick={() => (extra = !extra)}>{extra ? 'Remove' : 'Add'} content</button>
		</div>
	</header>
	<div class="readout">
		Reader {Math.round($progress * 100)}% · Section {Math.round($chapterProgress * 100)}% ·
		Horizontal {Math.round($horizontalProgress * 100)}%
	</div>
	{#if mounted}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll this panel.) -->
		<section
			class="reading"
			data-testid="scroll-container"
			{@attach reader.container}
			{@attach chapters.container}
			tabindex="0"
			aria-label="Scrollable reading example"
		>
			<div class="meter"><div data-testid="scroll-fill" {@attach fill}></div></div>
			<div class="chapter">
				<span>01</span>
				<h2>Keep the page in charge.</h2>
				<p>Normal document flow defines this reading space. Motion follows its scroll position.</p>
			</div>
			<div class="chapter featured" {@attach chapters.target}>
				<div data-testid="scroll-reveal" {@attach reveal}>
					<span>02</span>
					<h2>Enter the frame.</h2>
					<p>
						This section tracks its journey from the bottom edge to the top edge. Its target
						geometry is independent of the animated child.
					</p>
				</div>
			</div>
			{#if extra}<div class="chapter">
					<span>+</span>
					<h2>A little more room.</h2>
					<p>Added content extends the reading distance. Scroll again to recalculate the range.</p>
				</div>{/if}
			<div class="chapter">
				<span>03</span>
				<h2>Reverse whenever.</h2>
				<p>There is no queued animation. The scroll position remains the source of truth.</p>
			</div>
		</section>
	{/if}
	<section class="horizontal-demo">
		<h2>A different direction.</h2>
		<div class="marker-track"><div data-testid="scroll-marker" {@attach marker}></div></div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll this panel.) -->
		<div
			class="horizontal"
			data-testid="horizontal-container"
			{@attach horizontal.container}
			tabindex="0"
			aria-label="Horizontal scrolling example"
		>
			{#each ['Gather', 'Arrange', 'Explore', 'Return'] as label, index (label)}<div>
					<span>0{index + 1}</span>
					<h3>{label}</h3>
				</div>{/each}
		</div>
	</section>
	<p class="note">
		Reduced motion completes linked visual effects immediately; progress values continue to describe
		the page. With unsupported native scroll timelines, Motion supplies its JavaScript fallback.
	</p>
</main>

<style>
	:global(body) {
		background: #f5f2e9;
		color: #29352c;
	}
	main {
		max-width: 1040px;
		margin: auto;
		padding: 48px 24px 80px;
	}
	a {
		color: inherit;
		text-underline-offset: 4px;
	}
	.eyebrow {
		margin-top: 42px;
		font-size: 12px;
		letter-spacing: 0.16em;
	}
	h1 {
		font-size: clamp(40px, 7vw, 76px);
		line-height: 1;
		letter-spacing: -0.055em;
		margin: 16px 0 24px;
	}
	.intro {
		max-width: 580px;
		line-height: 1.65;
	}
	.controls {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin: 24px 0;
	}
	button {
		padding: 10px 14px;
		border: 1px solid #bac1b5;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
	}
	button:hover {
		background: #e5e8dc;
	}
	.readout {
		margin: 28px 0 12px;
		font-variant-numeric: tabular-nums;
		font-size: 14px;
	}
	.reading {
		position: relative;
		height: 420px;
		overflow: auto;
		border: 1px solid #aab5a5;
		border-radius: 12px;
		resize: vertical;
		min-height: 180px;
		background: #fffdf6;
	}
	.meter {
		position: sticky;
		top: 0;
		height: 5px;
		z-index: 2;
		background: #dde3d5;
	}
	.meter > div {
		height: 100%;
		background: #be593b;
		transform-origin: 0 50%;
	}
	.chapter {
		min-height: 410px;
		padding: 64px clamp(28px, 7vw, 90px);
		box-sizing: border-box;
	}
	.chapter span,
	.horizontal span {
		font-size: 13px;
		opacity: 0.6;
	}
	.chapter h2 {
		max-width: 450px;
		font-size: clamp(28px, 5vw, 48px);
		line-height: 1.1;
		letter-spacing: -0.04em;
		margin: 18px 0;
	}
	.chapter p {
		max-width: 420px;
		line-height: 1.7;
	}
	.featured {
		background: #dee6d7;
		overflow: hidden;
	}
	.horizontal-demo {
		margin-top: 38px;
	}
	.horizontal-demo h2 {
		font-size: 26px;
		letter-spacing: -0.03em;
	}
	.marker-track {
		width: 256px;
		padding: 12px 0;
	}
	.marker-track > div {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #be593b;
	}
	.horizontal {
		position: relative;
		display: flex;
		gap: 16px;
		overflow-x: auto;
		border-radius: 10px;
		padding-bottom: 12px;
	}
	.horizontal > div {
		flex: 0 0 340px;
		padding: 32px;
		background: #dee6d7;
		border-radius: 10px;
	}
	.horizontal h3 {
		font-size: 32px;
		margin: 30px 0 0;
		letter-spacing: -0.035em;
	}
	.note {
		max-width: 680px;
		font-size: 14px;
		line-height: 1.7;
		margin-top: 28px;
		color: #66715f;
	}
</style>
