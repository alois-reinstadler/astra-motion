<script lang="ts">
	import { onMount } from 'svelte';
	import { createAnimate } from '$lib/motion/animate.js';
	import { stagger, type AnimationPlaybackControlsWithThen } from 'motion';
	const entrance = createAnimate();
	let playback: AnimationPlaybackControlsWithThen | undefined;
	function replayEntrance() {
		if (playback) {
			playback.time = 0;
			playback.play();
		}
	}

	let ready = $state(false);
	onMount(() => {
		ready = true;
		playback = entrance.sequence([
			[
				'.hero-line',
				{ y: ['110%', '0%'], rotate: [5, 0] },
				{ duration: 1.15, delay: stagger(0.14), ease: [0.16, 1, 0.3, 1] }
			],
			[
				'.hero-playground',
				{ clipPath: ['inset(48% 0 48% 0)', 'inset(0% 0 0% 0)'], opacity: [0, 1] },
				{ at: 0.18, duration: 1.2, ease: [0.76, 0, 0.24, 1] }
			],
			[
				'.entry-star',
				{ rotate: [-150, 0], scale: [0.2, 1] },
				{ at: 0.3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }
			],
			[
				'.hero-description, .hero-actions, .hero-note, .hero .eyebrow',
				{ opacity: [0, 1] },
				{ at: 0.6, duration: 0.7, delay: stagger(0.08) }
			]
		]);
	});
	import { resolve } from '$app/paths';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import CodeText from '$lib/site/CodeText.svelte';
	import { createLayout } from '$lib/motion/layout.js';
	const layout = createLayout({
		id: 'home-demo',
		transition: { type: 'spring', stiffness: 340, damping: 32 }
	});
	let mode = $state<'grid' | 'stack'>('grid');
	let reversed = $state(false);
	const pieces = [
		{ id: '01', name: 'Presence', symbol: '◒', color: 'coral' },
		{ id: '02', name: 'Layout', symbol: '↗', color: 'lime' },
		{ id: '03', name: 'Shared identity', symbol: '◎', color: 'cream' }
	];
	const ordered = $derived(reversed ? [...pieces].reverse() : pieces);
	const code = `const layout = createLayout();\n\n{#each items as item (item.id)}\n  <div {@attach layout()}>\n    <div {@attach layout({ mode: 'position' })}>\n      {item.name}\n    </div>\n  </div>\n{/each}`;
</script>

<SiteFrame>
	<main id="site-content">
		<section class="hero" {@attach entrance.attach}>
			<div class="hero-copy">
				<p class="eyebrow"><span></span> A MOTION SYSTEM FOR SVELTE 5</p>
				<h1>
					<span class="line-mask"><span class="hero-line">Make room</span></span><span
						class="line-mask"><span class="hero-line">for <em>movement.</em></span></span
					>
				</h1>
				<p class="hero-description">
					Motion’s animation engine, connected to Svelte.<br />Animate your elements, from the first
					render to the final exit.
				</p>
				<div class="hero-actions">
					<a
						data-ui-control
						class="action primary"
						href={resolve('/docs/[slug]', { slug: 'getting-started' })}
						>Start building <span>↗</span></a
					><a data-ui-control class="action secondary" href={resolve('/examples')}
						>Explore examples <span>→</span></a
					>
				</div>
				<p class="hero-note">Native elements · Motion engine · No compiler required</p>
				<button data-ui-control class="replay-entrance" disabled={!ready} onclick={replayEntrance}
					><span aria-hidden="true">↺</span> Replay the entrance</button
				>
			</div>
			<div class="hero-playground">
				<div class="playground-bar">
					<span>01 / LIVE PLAYGROUND</span><span class="live-indicator">YOUR CSS, IN MOTION</span>
				</div>
				<div class="playground-stage" class:stack={mode === 'stack'}>
					<span class="entry-emblem" aria-hidden="true"><span class="entry-star">✳</span></span>
					{#each ordered as piece (piece.id)}
						<div class="motion-piece {piece.color}" {@attach layout()}>
							<div class="piece-top" {@attach layout({ mode: 'position' })}>
								<span>{piece.id}</span><span>↗</span>
							</div>
							<span class="piece-symbol" aria-hidden="true" {@attach layout({ mode: 'position' })}
								>{piece.symbol}</span
							><strong {@attach layout({ mode: 'position' })}>{piece.name}</strong>
						</div>
					{/each}
				</div>
				<div class="playground-controls">
					<div class="view-switch" role="group" aria-label="Layout mode">
						<button
							data-ui-control
							disabled={!ready}
							class:active={mode === 'grid'}
							aria-pressed={mode === 'grid'}
							onclick={() => (mode = 'grid')}>Grid</button
						><button
							data-ui-control
							disabled={!ready}
							class:active={mode === 'stack'}
							aria-pressed={mode === 'stack'}
							onclick={() => (mode = 'stack')}>Stack</button
						>
					</div>
					<button
						data-ui-control
						disabled={!ready}
						class="shuffle"
						onclick={() => (reversed = !reversed)}>Reorder <span>⇄</span></button
					>
				</div>
				<p class="playground-caption">Go ahead. Change your mind mid-animation.</p>
			</div>
		</section>
		<div class="principles">
			<span>SVELTE OWNS THE LIFECYCLE</span><i>+</i><span>MOTION POWERS THE ENGINE</span><i>+</i
			><span>THE BROWSER CONNECTS ROUTES</span>
		</div>
		<section class="introduction">
			<div>
				<p class="eyebrow">BUILT AROUND YOUR MARKUP</p>
				<h2>Change the layout.<br /><em>Keep the connection.</em></h2>
			</div>
			<p>
				Astra connects Svelte’s lifecycle to Motion’s animation engine. Elements enter and leave
				naturally. Layout follows your CSS. Shared identity carries through the change.
			</p>
		</section>
		<section class="code-feature">
			<div class="code-description">
				<span class="section-number">01 — LAYOUT</span>
				<h3>Let CSS lead.<br />Motion will follow.</h3>
				<p>
					Switch a grid. Reorder a list. Open a panel. Attach once and let ordinary state changes do
					the work.
				</p>
				<a href={resolve('/docs/[slug]', { slug: 'layout' })}>Learn about layout <span>→</span></a>
			</div>
			<div class="code-window">
				<div class="code-title"><span>CardList.svelte</span><span>SVELTE 5</span></div>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the code sample.) -->
				<pre tabindex="0" role="region" aria-label="Layout code example"><CodeText
						source={code}
						label="CardList.svelte"
						dark
					/></pre>
				<div class="code-footnote">An attachment. An actual div. That’s the idea.</div>
			</div>
		</section>
		<section class="feature-grid" aria-label="Motion capabilities">
			<a href={resolve('/docs/[slug]', { slug: 'presence' })}
				><span class="feature-mark" aria-hidden="true">◐</span><span class="section-number"
					>02 — PRESENCE</span
				>
				<h3>Good entrances.<br />Better goodbyes.</h3>
				<p>
					Sync, wait and popLayout. Svelte keeps the outgoing node alive while its exit finishes.
				</p>
				<span class="feature-link">Explore presence ↗</span></a
			><a href={resolve('/docs/[slug]', { slug: 'shared-layout' })}
				><span class="feature-mark" aria-hidden="true">⇄</span><span class="section-number"
					>03 — SHARED LAYOUT</span
				>
				<h3>A new place.<br />The same thing.</h3>
				<p>Connect tabs, cards and views with scoped identities and coordinated layout groups.</p>
				<span class="feature-link">Connect shared elements ↗</span></a
			><a href={resolve('/docs/[slug]', { slug: 'routes' })}
				><span class="feature-mark" aria-hidden="true">↗</span><span class="section-number"
					>04 — ROUTES</span
				>
				<h3>Keep the story<br />moving.</h3>
				<p>Enhance SvelteKit navigation with native View Transitions and shared route elements.</p>
				<span class="feature-link">Build route transitions ↗</span></a
			>
		</section>
		<section class="next-step">
			<div>
				<p class="eyebrow">FROM FIRST TRY TO REAL INTERFACE</p>
				<h2>Find your next move.</h2>
			</div>
			<div class="journeys">
				<a href={resolve('/docs/[slug]', { slug: 'getting-started' })}
					><span>01</span>
					<div>
						<strong>Learn the essentials</strong>
						<p>A guided path through the API.</p>
					</div>
					<b>↗</b></a
				><a href={resolve('/examples')}
					><span>02</span>
					<div>
						<strong>Try something real</strong>
						<p>Examples organized by what you’re building.</p>
					</div>
					<b>↗</b></a
				><a href={resolve('/motion-lab')}
					><span>03</span>
					<div>
						<strong>Push the edges</strong>
						<p>Stress tests, comparisons and experiments.</p>
					</div>
					<b>↗</b></a
				>
			</div>
		</section>
		<aside class="beta-note">
			<span>WORKING BETA</span>
			<p>
				Available from the repository. Start with one interaction and read the supported scope and
				known limits before adopting it.
			</p>
			<a href={resolve('/status')}>Read project status ↗</a>
		</aside>
	</main>
</SiteFrame>

<style>
	.line-mask {
		display: block;
		overflow: clip;
		padding-bottom: 0.12em;
		margin-bottom: -0.12em;
	}
	.hero-line {
		display: block;
		transform-origin: left bottom;
	}
	.entry-emblem {
		position: absolute;
		inset: 0;
		z-index: -1;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.entry-star {
		display: block;
		font-size: 500px;
		line-height: 1;
		color: #64734c;
	}
	.replay-entrance {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 28px;
		min-height: 36px;
		font:
			10px ui-monospace,
			monospace;
		color: var(--site-muted);
	}
	.replay-entrance span {
		font-size: 18px;
		color: var(--site-accent);
	}
	.replay-entrance:hover {
		color: var(--site-accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.replay-entrance {
			display: none;
		}
	}

	main {
		max-width: 1440px;
		margin: auto;
		padding: 0 56px;
	}
	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 64px;
		padding: 68px 0 64px;
		align-items: center;
	}
	.eyebrow {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1.7px;
		display: flex;
		align-items: center;
		gap: 9px;
		margin: 0 0 30px;
	}
	.eyebrow > span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--site-accent);
	}
	h1 {
		font-size: clamp(64px, 6.7vw, 102px);
		letter-spacing: -6px;
		line-height: 1.02;
		font-weight: 500;
		margin: 0;
	}
	em {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 400;
		color: var(--site-accent);
		letter-spacing: -5px;
	}
	.hero-description {
		font-size: 20px;
		color: var(--site-muted);
		line-height: 1.5;
		margin: 28px 0;
	}
	.hero-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.action {
		display: flex;
		align-items: center;
		gap: 30px;
		padding: 16px 20px;
		font-size: 13px;
		font-weight: 550;
		text-decoration: none;
	}
	.primary {
		background: var(--site-ink);
		color: #f7f7f0;
	}
	.primary:hover {
		background: var(--site-accent);
	}
	.secondary {
		border: 1px solid var(--site-line);
	}
	.secondary:hover {
		border-color: var(--site-ink);
	}
	.hero-note {
		color: var(--site-muted);
		font-size: 10px;
		margin-top: 20px;
	}
	.hero-playground {
		min-width: 0;
	}
	.playground-bar {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1px;
		margin-bottom: 18px;
	}
	.live-indicator {
		color: var(--site-muted);
	}
	.playground-stage {
		background: #252b22;
		padding: 25px;
		min-height: 425px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 13px;
		align-content: center;
		position: relative;
		overflow: hidden;
		isolation: isolate;
		background-image: radial-gradient(#717a5f 0.8px, transparent 0.8px);
		background-size: 15px 15px;
	}
	.motion-piece {
		height: 143px;
		padding: 15px 18px;
		position: relative;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		color: #252821;
	}
	.motion-piece:first-of-type {
		grid-row: span 2;
		height: 299px;
	}
	.motion-piece.coral {
		background: #eb6b4c;
	}
	.motion-piece.lime {
		background: #d6e3a4;
	}
	.motion-piece.cream {
		background: #faf9ed;
	}
	.piece-top {
		display: flex;
		justify-content: space-between;
		font:
			10px ui-monospace,
			monospace;
	}
	.piece-symbol {
		font-size: 56px;
		line-height: 1;
		align-self: center;
	}
	.motion-piece strong {
		font-size: 13px;
		font-weight: 550;
	}
	.playground-stage.stack {
		grid-template-columns: 1fr;
	}
	.stack .motion-piece {
		height: 95px;
		grid-row: auto;
		flex-direction: row;
		align-items: center;
	}
	.stack .piece-top {
		align-self: flex-start;
		min-width: 36px;
		gap: 8px;
	}
	.stack .motion-piece strong {
		min-width: 100px;
	}
	.playground-controls {
		display: flex;
		justify-content: space-between;
		padding: 16px 0;
		border-bottom: 1px solid var(--site-line);
	}
	.view-switch {
		display: flex;
		border: 1px solid var(--site-line);
		padding: 3px;
	}
	.view-switch button {
		padding: 6px 17px;
		font-size: 11px;
	}
	.view-switch .active {
		background: var(--site-ink);
		color: #fff;
	}
	.shuffle {
		font-size: 12px;
	}
	.shuffle span {
		font-size: 19px;
		margin-left: 14px;
	}
	.playground-caption {
		font:
			10px ui-monospace,
			monospace;
		color: var(--site-muted);
		margin: 12px 0 0;
	}
	.principles {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 18px;
		border-top: 1px solid var(--site-line);
		border-bottom: 1px solid var(--site-line);
		padding: 25px 0;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.principles i {
		font-style: normal;
		color: var(--site-accent);
		font-size: 18px;
	}
	.introduction {
		display: grid;
		grid-template-columns: 1.15fr 1fr;
		gap: 120px;
		align-items: end;
		padding: 90px 0 50px;
	}
	h2 {
		font-size: 42px;
		font-weight: 450;
		line-height: 1.15;
		letter-spacing: -1.8px;
		margin: 0;
	}
	h2 em {
		letter-spacing: -1.7px;
	}
	.introduction .eyebrow {
		margin-bottom: 20px;
	}
	.introduction > p {
		color: var(--site-muted);
		font-size: 16px;
		line-height: 1.8;
		margin: 0;
	}
	.code-feature {
		display: grid;
		grid-template-columns: 1fr 1.25fr;
		background: var(--site-panel);
		border: 1px solid var(--site-line);
		margin-bottom: 20px;
	}
	.code-description {
		padding: 45px;
	}
	.section-number {
		display: block;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1px;
		color: var(--site-muted);
	}
	h3 {
		font-size: 31px;
		line-height: 1.2;
		font-weight: 450;
		letter-spacing: -1px;
		margin: 25px 0 18px;
	}
	.code-description p {
		max-width: 310px;
		font-size: 14px;
		color: var(--site-muted);
		line-height: 1.75;
	}
	.code-description a {
		font-size: 12px;
		display: inline-block;
		margin-top: 20px;
	}
	.code-description a span {
		margin-left: 25px;
	}
	.code-window {
		background: #252821;
		color: #edeee5;
		margin: 24px 24px 24px 0;
		min-width: 0;
	}
	.code-title {
		padding: 18px 22px;
		border-bottom: 1px solid #41463c;
		display: flex;
		justify-content: space-between;
		font:
			10px ui-monospace,
			monospace;
		color: #bdc5b3;
	}
	pre {
		overflow-x: auto;
		padding: 25px;
		font:
			13px/1.9 ui-monospace,
			monospace;
		color: #dce8c7;
		margin: 0;
	}
	.code-footnote {
		font-size: 10px;
		color: #bdc5b3;
		padding: 0 25px 20px;
	}
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 20px;
	}
	.feature-grid > a {
		padding: 32px;
		border: 1px solid var(--site-line);
		text-decoration: none;
	}
	.feature-grid > a:hover {
		background: var(--site-panel);
	}
	.feature-mark {
		display: block;
		font-size: 40px;
		color: var(--site-accent);
		margin-bottom: 25px;
	}
	.feature-grid h3 {
		font-size: 28px;
	}
	.feature-grid p {
		color: var(--site-muted);
		font-size: 13px;
		line-height: 1.8;
	}
	.feature-link {
		display: block;
		font-size: 11px;
		margin-top: 30px;
	}
	.next-step {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: 70px;
		padding: 90px 0;
	}
	.next-step h2 {
		max-width: 300px;
	}
	.next-step .eyebrow {
		margin-bottom: 25px;
	}
	.journeys a {
		display: flex;
		gap: 22px;
		border-top: 1px solid var(--site-line);
		padding: 24px 0;
		align-items: center;
		text-decoration: none;
	}
	.journeys a:last-child {
		border-bottom: 1px solid var(--site-line);
	}
	.journeys > a > span {
		font:
			10px ui-monospace,
			monospace;
		color: var(--site-accent);
	}
	.journeys strong {
		font-size: 17px;
		font-weight: 550;
	}
	.journeys p {
		color: var(--site-muted);
		font-size: 12px;
		margin: 6px 0 0;
	}
	.journeys b {
		font-weight: 400;
		margin-left: auto;
	}
	.journeys a:hover strong {
		color: var(--site-accent);
	}
	.beta-note {
		display: grid;
		grid-template-columns: 1fr 1.6fr auto;
		align-items: center;
		gap: 30px;
		padding: 26px 0 38px;
	}
	.beta-note > span {
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.beta-note p {
		color: var(--site-muted);
		font-size: 11px;
		line-height: 1.7;
		margin: 0;
	}
	.beta-note a {
		font-size: 11px;
	}
	@media (max-width: 1050px) {
		.hero {
			gap: 35px;
		}
		h1 {
			font-size: 75px;
			letter-spacing: -4px;
		}
		h1 em {
			letter-spacing: -4px;
		}
		.introduction {
			gap: 45px;
		}
		.feature-grid > a {
			padding: 25px;
		}
		.principles {
			font-size: 8px;
		}
		.hero-actions {
			gap: 8px;
		}
		.action {
			padding: 14px;
			gap: 15px;
		}
	}
	@media (max-width: 750px) {
		main {
			padding: 0 24px;
		}
		.hero {
			grid-template-columns: 1fr;
			padding: 52px 0 40px;
			gap: 42px;
		}
		h1 {
			font-size: clamp(59px, 12vw, 90px);
			letter-spacing: -3px;
		}
		h1 em {
			letter-spacing: -3px;
		}
		.eyebrow {
			font-size: 11px;
			letter-spacing: 1.3px;
		}
		.hero-description {
			font-size: 18px;
		}
		.playground-stage {
			min-height: 350px;
			padding: 18px;
		}
		.principles {
			flex-direction: column;
			gap: 10px;
			padding: 20px 0;
			font-size: 9px;
		}
		.principles i {
			display: none;
		}
		.introduction {
			grid-template-columns: 1fr;
			gap: 25px;
			padding: 55px 0 30px;
		}
		h2 {
			font-size: 36px;
		}
		.code-feature {
			grid-template-columns: 1fr;
		}
		.code-description {
			padding: 28px;
		}
		.code-window {
			margin: 0 16px 16px;
		}
		pre {
			font-size: 11px;
			padding: 20px;
		}
		.feature-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.feature-grid > a {
			padding: 28px;
		}
		.feature-mark {
			float: right;
			margin: 0;
		}
		.feature-grid h3 {
			margin: 20px 0 15px;
		}
		.feature-link {
			margin-top: 18px;
		}
		.next-step {
			grid-template-columns: 1fr;
			gap: 30px;
			padding: 55px 0 30px;
		}
		.beta-note {
			grid-template-columns: 1fr;
			gap: 12px;
			padding: 25px 0 35px;
		}
	}
</style>
