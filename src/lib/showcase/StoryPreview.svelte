<script lang="ts">
	import { onDestroy, untrack, tick } from 'svelte';
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
	const replacement = createAnimate();
	const space = ' ';
	const chapters = [
		['A slower kind', 'of looking.'],
		['Where the water', 'holds its breath.'],
		['A thousand shades', 'of blue.'],
		['Every river', 'finds a way.']
	];
	let chapter = $state(0);
	let requested = 0;
	let navigation = 0;
	let replacing = $state(false);
	let entering = $state(false);
	let readerElement: HTMLElement;
	const currentPhoto = $derived(photos[chapter]);
	async function settleChapter() {
		const current = ++navigation;
		replacement.stop();
		replacing = false;
		entering = false;
		chapter = requested;
		await tick();
		if (current !== navigation || !replacement.current) return;
		replacement.animate(
			'.cover-photograph, .story-word',
			{ opacity: 1, x: 0, y: 0, scale: 1 },
			{ duration: 0 }
		);
	}
	function settleNavigationForPolicy() {
		if (reading.reducedMotion && replacing) void settleChapter();
	}
	$effect(settleNavigationForPolicy);
	async function changeChapter(direction: -1 | 1) {
		requested = (requested + direction + chapters.length) % chapters.length;
		readerElement.scrollTop = 0;
		if (reading.reducedMotion) return settleChapter();
		const current = ++navigation;
		replacing = true;
		await replacement.sequence([
			['.cover-photograph', { x: -direction * 45, opacity: 0 }, { duration: 0.25, ease: 'easeIn' }],
			[
				'.story-word',
				{ y: -direction * 65, opacity: 0 },
				{
					at: 0,
					duration: 0.2,
					delay: stagger(0.025, { from: direction === 1 ? 'first' : 'last' })
				}
			]
		]);
		if (current !== navigation) return;
		entering = true;
		chapter = requested;
		await tick();
		if (current !== navigation || !replacement.current) return;
		await replacement.sequence([
			[
				'.cover-photograph',
				{ x: [direction * 85, 0], scale: [1.06, 1], opacity: [0, 1] },
				{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }
			],
			[
				'.story-word',
				{ y: [direction * 65, 0], opacity: [0, 1] },
				{
					at: 0.08,
					duration: 0.65,
					delay: stagger(0.06, { from: direction === 1 ? 'first' : 'last' }),
					ease: [0.22, 1, 0.36, 1]
				}
			]
		]);
		if (current === navigation) {
			replacing = false;
			entering = false;
		}
	}
	let status = $state<'Ready' | 'Playing' | 'Paused' | 'Complete'>('Ready');
	let playback: AnimationPlaybackControlsWithThen | undefined;
	let revision = 0;
	let hydrated = $state(false);
	$effect(() =>
		untrack(() => {
			hydrated = true;
		})
	);
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
				'.planet',
				{ rotate: [-18, 0], scale: [0.72, 1] },
				{ at: 0, duration: 1.7, ease: [0.22, 1, 0.36, 1] }
			],
			[
				'.planet-strip:nth-child(odd)',
				{ x: [-180, 0], opacity: [0, 1] },
				{ at: 0.05, duration: 1.35, delay: stagger(0.12), ease: [0.22, 1, 0.36, 1] }
			],
			[
				'.planet-strip:nth-child(even)',
				{ x: [180, 0], opacity: [0, 1] },
				{ at: 0.14, duration: 1.35, delay: stagger(0.12), ease: [0.22, 1, 0.36, 1] }
			],
			['.orbit-grid', { scale: [0.65, 1], opacity: [0, 1] }, { at: 0.1, duration: 1.7 }],
			[
				'.satellite-ring',
				{ rotate: [-150, 210], opacity: [0, 1] },
				{ at: 0.2, duration: 2.2, ease: [0.22, 1, 0.36, 1] }
			],
			[
				'.opening-line',
				{ y: [24, 0], opacity: [0, 1] },
				{ at: 0.65, duration: 1.2, delay: stagger(0.18), ease: [0.22, 1, 0.36, 1] }
			],
			['.opening-rule', { scaleX: [0, 1] }, { at: 0.2, duration: 2.2 }]
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

	onDestroy(() => {
		revision++;
		navigation++;
	});
</script>

<div class="story-workbench" data-testid="story-workbench">
	<div class="reader-shell">
		<div class="reader-toolbar">
			<span>FIELD NOTES <span class="edition">/ 00{chapter + 1}</span></span>
			<span data-testid="story-progress-label">{Math.round($progress * 100)}% read</span>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (This native scroll region must be keyboard accessible.) -->
		<article
			class="reader"
			data-testid="story-reader"
			tabindex="0"
			aria-label="Field notes. Scroll to read the landscape story."
			{@attach reading.container}
			{@attach (node) => {
				readerElement = node;
			}}
		>
			<div class="reading-track" aria-hidden="true">
				<div
					data-testid="story-progress"
					style:width={reading.reducedMotion ? `${$progress * 100}%` : '100%'}
					style:visibility={$progress === 0 ? 'hidden' : 'visible'}
					{@attach meter}
				></div>
			</div>
			<div class="cover" class:entering {@attach replacement.attach}>
				<div class="cover-photograph">
					<img
						data-testid="story-image"
						src={currentPhoto.src}
						alt={currentPhoto.alt}
						{@attach photograph}
					/>
				</div>
				<div class="cover-label">
					<span>OBSERVATIONS FROM ABOVE</span><span>0{chapter + 1}—04</span>
				</div>
				<h3 aria-label={chapters[chapter].join(' ')} data-testid="story-title">
					{#each chapters[chapter] as line (line)}
						<span class="title-line" aria-hidden="true"
							>{#each line.split(' ') as word, index (index)}<span class="word-mask"
									><span class="story-word">{word}</span></span
								>{space}{/each}</span
						>
					{/each}
				</h3>
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
		<div class="chapter-controls" role="group" aria-label="Browse field notes">
			<button
				type="button"
				data-testid="story-previous"
				disabled={!hydrated}
				onclick={() => changeChapter(-1)}><span aria-hidden="true">←</span> Previous</button
			>
			<span
				class="chapter-count"
				role="status"
				aria-label={`Field note ${chapter + 1} of ${chapters.length}`}
				>0{chapter + 1} <span>/ 04</span></span
			>
			<button
				type="button"
				data-testid="story-next"
				disabled={!hydrated}
				onclick={() => changeChapter(1)}>Next <span aria-hidden="true">→</span></button
			>
		</div>
		<p class="reader-hint">Scroll the journal · or focus it and use your arrow keys</p>
	</div>

	<div class="opening-panel">
		<div class="opening-caption"><span>EARTH IN MOTION</span><span>02.4s</span></div>
		<div class="opening-preview" {@attach opening.attach} data-testid="story-opening">
			<p class="opening-kicker">SIX FRAGMENTS. ONE WORLD.</p>
			<div
				class="orbit-art"
				role="img"
				aria-label="Six photographic strips assemble into a blue planet inside orbital rings."
			>
				<svg class="orbit-grid" viewBox="0 0 300 300" aria-hidden="true">
					<circle cx="150" cy="150" r="143" />
					<ellipse cx="150" cy="150" rx="143" ry="58" transform="rotate(-30 150 150)" />
					<path d="M150 0v18m0 264v18M0 150h18m264 0h18" />
				</svg>
				<div class="planet" aria-hidden="true">
					{#each [0, 1, 2, 3, 4, 5] as strip (strip)}
						<div
							class="planet-strip"
							style:background-image={`url(${photos[2].src})`}
							style:background-position={`center ${strip * 20}%`}
						></div>
					{/each}
				</div>
				<div class="satellite-ring" aria-hidden="true"><span class="satellite"></span></div>
				<span class="orbit-coordinate" aria-hidden="true">21° N / 72° W</span>
			</div>
			<h3>
				<span class="opening-line">One world.</span><span class="opening-line italic"
					>Endless motion.</span
				>
			</h3>
			<div class="opening-rule" aria-hidden="true"></div>
		</div>
		<div class="sequence-controls">
			<button data-testid="story-play" onclick={togglePlayback} disabled={!hydrated}>
				<span aria-hidden="true">{status === 'Playing' ? 'Ⅱ' : '▷'}</span>
				{status === 'Playing' ? 'Pause' : status === 'Paused' ? 'Resume' : 'Play composition'}
			</button>
			<button
				class="replay"
				data-testid="story-replay"
				disabled={!hydrated}
				onclick={replay}
				aria-label="Replay composition">↻</button
			>
		</div>
		<p class="sequence-state" data-testid="story-sequence-state" role="status">{status}</p>
		<p class="opening-note">
			From fragments to a whole. Replay the assembly, or pause anywhere along the orbit.
		</p>
	</div>
</div>

<style>
	.entering .story-word {
		opacity: 0;
	}
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
	.cover-photograph img {
		position: absolute;
		width: 100%;
		height: calc(100% + 28px);
		object-fit: cover;
	}
	.cover::after {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(180deg, #131b16bf, #131b1600 40%, #131b16d9);
		content: '';
	}
	.cover-photograph {
		position: absolute;
		inset: 0;
		z-index: -2;
	}
	.title-line {
		display: block;
	}
	.word-mask {
		display: inline-block;
		overflow: clip;
		vertical-align: top;
		padding-bottom: 0.13em;
		margin-bottom: -0.13em;
	}
	.story-word {
		display: inline-block;
	}
	.chapter-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 18px;
	}
	.chapter-controls button {
		min-width: 90px;
		padding-inline: 10px;
	}
	.chapter-count {
		font:
			11px 'Courier New',
			monospace;
		white-space: nowrap;
	}
	.chapter-count > span {
		color: #b5bbae;
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
		margin: 0 0 18px;
	}
	.opening-preview h3 {
		margin: 0;
		font:
			normal clamp(29px, 3.1vw, 43px)/1.04 Georgia,
			serif;
		letter-spacing: -0.05em;
	}
	.orbit-art {
		position: relative;
		width: 100%;
		max-width: 300px;
		aspect-ratio: 1;
		margin: 0 auto 28px;
		isolation: isolate;
	}
	.orbit-grid {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: none;
		stroke: #839174;
		stroke-width: 0.7;
	}
	.planet {
		position: absolute;
		inset: 16%;
		border-radius: 50%;
		overflow: hidden;
		background: #142b36;
		box-shadow: 0 0 40px #83b3ad15;
	}
	.planet::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow:
			inset -18px -12px 28px #00111bbf,
			inset 2px 2px 12px #d3f4e94d;
		pointer-events: none;
	}
	.planet-strip {
		height: calc(100% / 6);
		width: 100%;
		background-size: 100% 600%;
		background-repeat: no-repeat;
	}
	.satellite-ring {
		position: absolute;
		inset: 2%;
		border-radius: 50%;
	}
	.satellite {
		position: absolute;
		top: 50%;
		right: -4px;
		width: 9px;
		height: 9px;
		margin-top: -4.5px;
		border-radius: 50%;
		background: #e9a07f;
		box-shadow: 0 0 0 5px #e9a07f15;
	}
	.orbit-coordinate {
		position: absolute;
		bottom: 17%;
		right: 0;
		padding: 5px;
		background: #222720;
		color: #b5bbae;
		font:
			7px 'Courier New',
			monospace;
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
		margin: 22px 0 25px;
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
			font-size: 38px;
		}
		.opening-panel {
			padding: 0 10px 10px;
		}
		.opening-note {
			max-width: none;
		}
	}
</style>
