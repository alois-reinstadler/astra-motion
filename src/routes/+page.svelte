<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { createAnimate } from '$lib/motion/animate.js';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import DocCode from '$lib/site/DocCode.svelte';
	import HomeLayoutExample from '$lib/site/examples/HomeLayoutExample.svelte';
	import homeSource from '$lib/site/examples/HomeLayoutExample.svelte?raw';
	const entrance = createAnimate();
	onMount(() => {
		entrance.sequence([
			['.hero-line', { y: ['110%', '0%'] }, { duration: 0.8, ease: [0.16, 1, 0.3, 1] }],
			[
				'.hero-playground',
				{ clipPath: ['inset(48% 0 48% 0)', 'inset(0% 0 0% 0)'], opacity: [0, 1] },
				{ at: 0.12, duration: 0.9, ease: [0.76, 0, 0.24, 1] }
			]
		]);
	});
	const source = homeSource.replaceAll("'$lib/motion/index.js'", "'astra-motion'");
	const snippet = `<motion.div layout layoutGroup={layout}>\n  <strong {@attach layout({ mode: 'position' })}>\n    {piece.name}\n  </strong>\n</motion.div>`;
</script>

<SiteFrame>
	<main id="site-content">
		<section class="hero" {@attach entrance.attach}>
			<div class="hero-copy">
				<p class="eyebrow">ANIMATION FOR SVELTE 5</p>
				<h1>
					<span class="line-mask"><span class="hero-line">Make room</span></span><span
						class="line-mask"><span class="hero-line">for <em>movement.</em></span></span
					>
				</h1>
				<p class="hero-description">
					Animate what changes in your interface: a button’s state, a panel’s size, a card’s final
					exit. Motion’s engine, connected to Svelte.
				</p>
				<div class="hero-actions">
					<a class="action primary" href={resolve('/docs/[slug]', { slug: 'getting-started' })}
						>Start building</a
					>
					<a class="action secondary" href={resolve('/examples')}>Explore examples</a>
				</div>
				<p class="hero-note">Svelte 5 · Native elements · Respects reduced motion</p>
			</div>
			<div class="hero-playground"><HomeLayoutExample /></div>
		</section>
		<section class="code-feature" aria-labelledby="layout-heading">
			<div class="code-description">
				<p class="eyebrow">THE INTERACTION ABOVE</p>
				<h2 id="layout-heading">Your CSS changes.<br /><em>The elements follow.</em></h2>
				<p>
					Grid and Stack change the CSS layout. Reorder changes the keyed list. The same three
					elements stay mounted while Astra animates their new positions and sizes.
				</p>
				<p>
					The surface uses layout projection. Its text uses position-only projection to stay
					readable as the surface scales.
				</p>
				<a href={resolve('/docs/[slug]', { slug: 'layout' })}>Learn automatic layout</a>
			</div>
			<div class="code-sample">
				<DocCode source={snippet} label="Layout and readable content · excerpt" />
				<details>
					<summary>Complete playground source</summary><DocCode
						{source}
						label="HomeLayoutExample.svelte"
					/>
				</details>
			</div>
		</section>
		<section class="next-step" aria-labelledby="next-heading">
			<div>
				<p class="eyebrow">BUILD FROM HERE</p>
				<h2 id="next-heading">One interaction.<br /><em>Then your interface.</em></h2>
			</div>
			<div class="journeys">
				<a href={resolve('/docs')}
					><span>01</span>
					<div>
						<strong>Learn the essentials</strong>
						<p>Install Astra, animate an element, then build on it.</p>
					</div></a
				>
				<a href={resolve('/examples')}
					><span>02</span>
					<div>
						<strong>Find a working example</strong>
						<p>Choose the behavior you need, with its guide and source.</p>
					</div></a
				>
				<a href={resolve('/showcase')}
					><span>03</span>
					<div>
						<strong>Explore a complete application</strong>
						<p>See layout, presence and scroll work together in Fieldwork.</p>
					</div></a
				>
			</div>
		</section>
		<aside class="beta-note">
			<span>WORKING BETA</span>
			<p>
				Available as a local package from the repository. Review the supported scope before adopting
				it.
			</p>
			<a href={resolve('/status')}>Project status</a>
		</aside>
	</main>
</SiteFrame>

<style>
	main {
		max-width: 1440px;
		margin: auto;
		padding: 0 56px;
	}
	.hero {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: 64px;
		padding: 74px 0 64px;
		align-items: center;
	}
	.hero-playground {
		min-width: 0;
	}
	.eyebrow {
		font:
			10px/1.7 ui-monospace,
			monospace;
		letter-spacing: 1.7px;
		margin: 0 0 26px;
	}
	h1 {
		font-size: clamp(64px, 6.7vw, 102px);
		letter-spacing: -6px;
		line-height: 1.04;
		font-weight: 500;
		margin: 0;
	}
	.line-mask {
		display: block;
		overflow: clip;
		padding-bottom: 0.12em;
		margin-bottom: -0.12em;
	}
	.hero-line {
		display: block;
	}
	em {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 400;
		color: var(--site-accent);
	}
	.hero-description {
		font-size: 19px;
		color: var(--site-muted);
		line-height: 1.6;
		margin: 28px 0;
		max-width: 470px;
	}
	.hero-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.action {
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
		font-size: 11px;
		margin-top: 20px;
	}
	h2 {
		font-size: 37px;
		font-weight: 450;
		line-height: 1.18;
		letter-spacing: -1.5px;
		margin: 0;
	}
	.code-feature {
		display: grid;
		grid-template-columns: 1fr 1.25fr;
		gap: 55px;
		border-top: 1px solid var(--site-line);
		border-bottom: 1px solid var(--site-line);
		padding: 52px 0;
		align-items: start;
	}
	.code-description p:not(.eyebrow) {
		max-width: 390px;
		color: var(--site-muted);
		font-size: 14px;
		line-height: 1.8;
		margin: 20px 0;
	}
	.code-description a {
		font-size: 13px;
		text-underline-offset: 4px;
	}
	.code-sample {
		min-width: 0;
	}
	details {
		margin-top: 22px;
	}
	summary {
		cursor: pointer;
		font-size: 13px;
		padding: 12px 0;
	}
	.next-step {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: 70px;
		padding: 68px 0;
	}
	.journeys a {
		display: flex;
		gap: 22px;
		border-top: 1px solid var(--site-line);
		padding: 23px 0;
		align-items: baseline;
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
		font-size: 13px;
		line-height: 1.7;
		margin: 6px 0 0;
	}
	.journeys a:hover strong {
		color: var(--site-accent);
	}
	.beta-note {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 30px;
		padding: 12px 0 38px;
		font-size: 11px;
	}
	.beta-note > span {
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.beta-note p {
		color: var(--site-muted);
		line-height: 1.7;
		margin: 0;
		max-width: 540px;
	}
	a:focus-visible,
	summary:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: 5px;
	}
	@media (max-width: 1050px) {
		.hero {
			gap: 30px;
		}
		h1 {
			font-size: 72px;
			letter-spacing: -4px;
		}
		.code-feature {
			gap: 35px;
		}
	}
	@media (max-width: 750px) {
		main {
			padding: 0 24px;
		}
		.hero {
			grid-template-columns: 1fr;
			padding: 48px 0;
			gap: 38px;
		}
		h1 {
			font-size: clamp(52px, 11vw, 80px);
			letter-spacing: -3.5px;
		}
		.hero-description {
			font-size: 17px;
		}
		.code-feature,
		.next-step {
			grid-template-columns: 1fr;
			gap: 25px;
			padding: 40px 0;
		}
		h2 {
			font-size: 32px;
		}
		.beta-note {
			grid-template-columns: 1fr;
			gap: 12px;
			padding: 0 0 35px;
		}
	}
</style>
