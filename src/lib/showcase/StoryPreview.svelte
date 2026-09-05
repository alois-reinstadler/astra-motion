<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { stagger, type AnimationPlaybackControlsWithThen } from 'motion';
	import { createScroll } from '../motion/scroll.svelte.js';
	import { createAnimate } from '../motion/animate.js';
	import { motionStore } from '../motion/values.js';
	import { photos } from './collection.js';

	const reading = createScroll();
	const progress = motionStore(reading.progress);
	const photograph = reading.animate({
		transform: ['translateY(0px)', 'translateY(-24px)']
	});
	const meter = reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
	const opening = createAnimate();
	let status = $state<'Ready' | 'Playing' | 'Paused' | 'Complete'>('Ready');
	let playback: AnimationPlaybackControlsWithThen | undefined;
	let revision = 0;
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
	function settleTransportForPolicy() {
		// A policy change stops/replaces playback; Motion does not resolve a
		// stopped control's completion promise. Keep the transport state truthful.
		if (reading.reducedMotion && (status === 'Playing' || status === 'Paused')) {
			revision++;
			playback = undefined;
			status = 'Complete';
		}
	}
	$effect(settleTransportForPolicy);

	function replay() {
		const current = ++revision;
		status = 'Playing';
		playback = opening.sequence([
			['.opening-kicker', { opacity: [0, 1] }, { duration: 0.5 }],
			[
				'.opening-line',
				{ y: [28, 0], opacity: [0, 1] },
				{ at: 0.15, duration: 1.2, delay: stagger(0.18), ease: [0.22, 1, 0.36, 1] }
			],
			['.opening-rule', { scaleX: [0, 1] }, { at: 0.5, duration: 1.2 }]
		]);
		void playback.then(() => {
			if (current === revision) status = 'Complete';
		});
	}

	function togglePlayback() {
		if (status === 'Playing') {
			playback?.pause();
			status = 'Paused';
		} else if (status === 'Paused') {
			playback?.play();
			status = 'Playing';
		} else replay();
	}

	onDestroy(() => revision++);
</script>

<div class="story-workbench" data-testid="story-workbench">
	<div class="reader-shell">
		<div class="reader-toolbar">
			<span>FIELD NOTES <span class="edition">/ 001</span></span>
			<span data-testid="story-progress-label">{Math.round($progress * 100)}% read</span>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (This native scroll region must be keyboard accessible.) -->
		<article
			class="reader"
			data-testid="story-reader"
			tabindex="0"
			aria-label="Field notes. Scroll to read the landscape story."
			{@attach reading.container}
		>
			<div class="reading-track" aria-hidden="true">
				<div
					data-testid="story-progress"
					style:width={reading.reducedMotion ? `${$progress * 100}%` : '100%'}
					style:visibility={$progress === 0 ? 'hidden' : 'visible'}
					{@attach meter}
				></div>
			</div>
			<div class="cover">
				<img
					data-testid="story-image"
					src={photos[0].src}
					alt={photos[0].alt}
					{@attach photograph}
				/>
				<div class="cover-label"><span>OBSERVATIONS FROM ABOVE</span><span>01—04</span></div>
				<h3>A slower kind<br />of looking.</h3>
			</div>
			<div class="editorial">
				<div class="byline"><span>THE FIELDWORK JOURNAL</span><span>1 MIN READ</span></div>
				<p class="standfirst">Distance changes what we notice.</p>
				<p>
					A line becomes a river. A crease becomes a mountain range. From far enough away, the
					familiar world begins to look like something drawn by hand.
				</p>
				<div class="observation">
					<span>01 / PAUSE</span>
					<p>Let your eyes follow one line.<br />See where it takes you.</p>
				</div>
				<figure>
					<img src={photos[2].src} alt={photos[2].alt} loading="lazy" />
					<figcaption><span>{photos[2].title}</span><span>{photos[2].location}</span></figcaption>
				</figure>
				<p>
					There is no single way to read a landscape. Start with a color, a shape, a small detail at
					the edge. Stay with it a little longer than you normally would.
				</p>
				<div class="colophon"><span>END OF FIELD NOTE</span><span aria-hidden="true">✳</span></div>
			</div>
		</article>
		<p class="reader-hint">Scroll the journal · or focus it and use your arrow keys</p>
	</div>

	<div class="opening-panel">
		<div class="opening-caption"><span>THE OPENING FRAME</span><span>01.7s</span></div>
		<div class="opening-preview" {@attach opening.attach} data-testid="story-opening">
			<p class="opening-kicker">A FIELDWORK INVITATION</p>
			<h3>
				<span class="opening-line">Look</span><span class="opening-line">a little</span><span
					class="opening-line italic">closer.</span
				>
			</h3>
			<div class="opening-rule" aria-hidden="true"></div>
		</div>
		<div class="sequence-controls">
			<button data-testid="story-play" onclick={togglePlayback} disabled={!hydrated}>
				<span aria-hidden="true">{status === 'Playing' ? 'Ⅱ' : '▷'}</span>
				{status === 'Playing' ? 'Pause' : status === 'Paused' ? 'Resume' : 'Play opening'}
			</button>
			<button
				class="replay"
				data-testid="story-replay"
				disabled={!hydrated}
				onclick={replay}
				aria-label="Replay opening">↻</button
			>
		</div>
		<p class="sequence-state" data-testid="story-sequence-state" role="status">{status}</p>
		<p class="opening-note">A small introduction. Play it, pause it, make it yours.</p>
	</div>
</div>

<style>
	.story-workbench {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(220px, 1fr);
		gap: clamp(24px, 4vw, 56px);
		padding: clamp(20px, 4vw, 48px);
		background: var(--field-ink, #222720);
		color: var(--field-paper, #f5f3e9);
	}
	.reader-shell,
	.opening-panel {
		min-width: 0;
	}
	.reader-toolbar,
	.opening-caption,
	.byline,
	.cover-label,
	.colophon {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-family: 'Courier New', monospace;
		font-size: 10px;
		letter-spacing: 0.06em;
	}
	.reader-toolbar {
		padding-bottom: 14px;
	}
	.edition,
	.opening-caption,
	.reader-hint,
	.opening-note {
		color: #b5bbae;
	}
	.reader {
		height: 530px;
		overflow: auto;
		overscroll-behavior: auto;
		background: var(--field-paper, #f5f3e9);
		color: var(--field-ink, #222720);
		scrollbar-color: #78836e #e6e5dc;
		scrollbar-width: thin;
	}
	.reader:focus-visible {
		outline: 3px solid var(--field-accent, #cf4a2a);
		outline-offset: 5px;
	}
	.reading-track {
		position: sticky;
		top: 0;
		height: 3px;
		z-index: 2;
		background: #dedfd3;
	}
	.reading-track > div {
		height: 100%;
		background: var(--field-accent, #cf4a2a);
		transform-origin: left;
	}
	.cover {
		height: 350px;
		position: relative;
		overflow: hidden;
		background: #515b45;
		isolation: isolate;
	}
	.cover > img {
		position: absolute;
		width: 100%;
		height: calc(100% + 28px);
		object-fit: cover;
	}
	.cover::after {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(transparent, #131b16bd);
		content: '';
	}
	.cover > img {
		z-index: -2;
	}
	.cover-label {
		position: absolute;
		top: 22px;
		left: 24px;
		right: 24px;
		color: #fffaf0;
		font-size: 8px;
	}
	.cover h3 {
		position: absolute;
		left: 24px;
		right: 20px;
		bottom: 26px;
		margin: 0;
		color: #fffaf0;
		font:
			normal clamp(35px, 4vw, 59px)/0.98 Georgia,
			serif;
		letter-spacing: -0.05em;
	}
	.editorial {
		padding: 26px clamp(20px, 4vw, 38px) 30px;
	}
	.byline {
		color: color-mix(in srgb, var(--field-muted, #707869) 85%, var(--field-ink, #222720));
		font-size: 8px;
	}
	.editorial p {
		font-size: 13px;
		line-height: 1.8;
		margin: 18px 0;
	}
	.editorial .standfirst {
		font:
			normal clamp(26px, 3vw, 35px)/1.12 Georgia,
			serif;
		letter-spacing: -0.035em;
		margin-top: 30px;
	}
	.observation {
		border-block: 1px solid var(--field-line, #d3d8c9);
		margin: 28px 0;
		padding: 24px 0 12px;
	}
	.observation > span {
		color: var(--field-accent, #cf4a2a);
		font:
			9px 'Courier New',
			monospace;
	}
	.observation p {
		font:
			italic 23px/1.3 Georgia,
			serif;
		margin-top: 15px;
	}
	figure {
		margin: 26px 0;
	}
	figure img {
		display: block;
		width: 100%;
		height: 190px;
		object-fit: cover;
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 5px;
		font:
			8px/1.5 'Courier New',
			monospace;
		margin-top: 8px;
		color: color-mix(in srgb, var(--field-muted, #707869) 85%, var(--field-ink, #222720));
	}
	.colophon {
		border-top: 1px solid var(--field-line, #d3d8c9);
		padding-top: 22px;
		margin-top: 28px;
		align-items: center;
		font-size: 8px;
	}
	.colophon > span:last-child {
		font-size: 28px;
		color: var(--field-accent, #cf4a2a);
	}
	.reader-hint {
		font-size: 10px;
		line-height: 1.6;
		margin: 14px 0 0;
	}
	.opening-panel {
		padding-top: 1px;
	}
	.opening-caption {
		font-size: 9px;
		padding-bottom: 28px;
	}
	.opening-preview {
		border-top: 1px solid #535a4e;
		padding-top: 24px;
	}
	.opening-kicker {
		font:
			8px 'Courier New',
			monospace;
		letter-spacing: 0.07em;
		color: #b5bbae;
		margin: 0 0 35px;
	}
	.opening-preview h3 {
		margin: 0;
		font:
			normal clamp(46px, 5.1vw, 74px)/0.98 Georgia,
			serif;
		letter-spacing: -0.05em;
	}
	.opening-line {
		display: block;
	}
	.italic {
		font-style: italic;
		color: #dca88f;
	}
	.opening-rule {
		height: 2px;
		background: #dca88f;
		transform-origin: left;
		width: 52px;
		margin: 32px 0 38px;
	}
	.sequence-controls {
		display: flex;
		gap: 8px;
	}
	button {
		border: 1px solid #717c68;
		background: transparent;
		color: inherit;
		border-radius: 0;
		padding: 12px 15px;
		min-height: 44px;
		cursor: pointer;
		font-size: 11px;
		display: flex;
		gap: 9px;
		align-items: center;
		justify-content: center;
	}
	button:disabled {
		cursor: wait;
		opacity: 0.55;
	}
	button:hover {
		border-color: #e2c1aa;
		background: #30392a;
	}
	button:focus-visible {
		outline: 2px solid #e2c1aa;
		outline-offset: 4px;
	}
	.replay {
		min-width: 44px;
		font-size: 20px;
		padding: 8px;
	}
	.sequence-state {
		min-height: 15px;
		font:
			9px 'Courier New',
			monospace;
		color: #dca88f;
		margin: 14px 0 0;
	}
	.opening-note {
		font-size: 12px;
		line-height: 1.7;
		max-width: 210px;
		margin-top: 29px;
	}
	@media (max-width: 680px) {
		.story-workbench {
			grid-template-columns: minmax(0, 1fr);
			padding: 18px;
			gap: 35px;
		}
		.reader {
			height: 460px;
		}
		.cover {
			height: 310px;
		}
		.cover h3 {
			font-size: 40px;
			left: 20px;
		}
		.cover-label {
			left: 20px;
			right: 20px;
			font-size: 7px;
		}
		.opening-preview h3 {
			font-size: 65px;
		}
		.opening-panel {
			padding: 0 10px 10px;
		}
		.opening-note {
			max-width: none;
		}
	}
</style>
