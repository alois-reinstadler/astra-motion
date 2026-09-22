<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import MotionConfig from '$lib/motion/MotionConfig.svelte';
	import ContactSheet from '$lib/showcase/ContactSheet.svelte';
	import EditingDesk from '$lib/showcase/EditingDesk.svelte';
	import PublishingQueue from '$lib/showcase/PublishingQueue.svelte';
	import StoryPreview from '$lib/showcase/StoryPreview.svelte';
	import ShowcaseSource from '$lib/showcase/ShowcaseSource.svelte';
	import contactSource from '$lib/showcase/ContactSheet.svelte?raw';
	import deskSource from '$lib/showcase/EditingDesk.svelte?raw';
	import queueSource from '$lib/showcase/PublishingQueue.svelte?raw';
	import queueItemSource from '$lib/showcase/QueueItem.svelte?raw';
	import storySource from '$lib/showcase/StoryPreview.svelte?raw';
	import collectionSource from '$lib/showcase/collection.ts?raw';
	import { photos } from '$lib/showcase/collection.js';
	let reduced = $state(false);
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	const collectionFile = { name: 'collection.ts', source: collectionSource };
	const scenes = [
		{ id: 'contact-sheet', title: 'Collect' },
		{ id: 'editing-desk', title: 'Compose' },
		{ id: 'queue', title: 'Curate' },
		{ id: 'story', title: 'Read' }
	];
</script>

<SiteFrame>
	<main id="site-content" class="fieldwork">
		<header class="showcase-intro" class:motion-reduced={reduced}>
			<div class="intro-top">
				<span>ASTRA IN PRACTICE / 001</span><a
					href={resolve('/docs/[slug]', { slug: 'getting-started' })}>Build with Astra ↗</a
				>
			</div>
			<div class="intro-main">
				<div class="intro-landscape" aria-hidden="true">
					{#each [photos[0], photos[2], photos[1]] as photo, index (photo.id)}
						<div class="landscape-panel" style:--panel={index}>
							<img src={photo.src} alt="" fetchpriority={index === 0 ? 'high' : 'auto'} />
						</div>
					{/each}
				</div>
				<div>
					<p class="eyebrow">A STUDIO IN MOTION</p>
					<h1><span class="fieldwork-title">Fieldwork</span><span aria-hidden="true">✳</span></h1>
				</div>
				<p class="intro-copy">
					A little space for<br /><em>big observations.</em><small
						>Four connected ideas for interfaces that feel alive. Open a photograph. Rearrange your
						desk. Make something yours.</small
					>
				</p>
			</div>
			<div class="intro-bottom">
				<nav aria-label="Showcase scenes">
					{#each scenes as scene, index (scene.id)}<a href={`#${scene.id}`}
							><span>0{index + 1}</span> {scene.title}</a
						>{/each}
				</nav>
				<label class="motion-preference"
					><input
						type="checkbox"
						disabled={!ready}
						bind:checked={reduced}
						data-testid="showcase-reduced"
					/> Reduce motion</label
				>
			</div>
		</header>
		<MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
			<section id="contact-sheet" aria-labelledby="contact-heading">
				<div class="scene-caption">
					<div>
						<p class="eyebrow">01 / SHARED PERSPECTIVES</p>
						<h2 id="contact-heading">Small details.<br /><em>Bigger picture.</em></h2>
					</div>
					<div>
						<p>
							A contact sheet becomes a closer look. Pick a photograph, change the view, follow what
							catches your eye.
						</p>
						<a href={resolve('/docs/[slug]', { slug: 'shared-layout' })}>Shared layout guide ↗</a>
					</div>
				</div>
				<ContactSheet /><ShowcaseSource
					files={[{ name: 'ContactSheet.svelte', source: contactSource }, collectionFile]}
				/>
			</section>
			<section id="editing-desk" aria-labelledby="desk-heading">
				<div class="scene-caption">
					<div>
						<p class="eyebrow">02 / SPACE THAT ADAPTS</p>
						<h2 id="desk-heading">A desk that works<br /><em>the way you do.</em></h2>
					</div>
					<div>
						<p>
							Write a headline. Find the right tone. Move your tools aside and give the page a
							little breathing room.
						</p>
						<a href={resolve('/docs/[slug]', { slug: 'layout' })}>Layout guide ↗</a>
					</div>
				</div>
				<EditingDesk /><ShowcaseSource
					files={[{ name: 'EditingDesk.svelte', source: deskSource }, collectionFile]}
				/>
			</section>
			<section id="queue" aria-labelledby="queue-heading">
				<div class="scene-caption">
					<div>
						<p class="eyebrow">03 / A CHANGE OF ORDER</p>
						<h2 id="queue-heading">Good stories<br /><em>take a few edits.</em></h2>
					</div>
					<div>
						<p>
							Build an issue from your favourite frames. Reorder, remove, reconsider. There’s always
							room to change your mind.
						</p>
						<a href={resolve('/docs/[slug]', { slug: 'presence' })}>Presence guide ↗</a>
					</div>
				</div>
				<PublishingQueue /><ShowcaseSource
					files={[
						{ name: 'PublishingQueue.svelte', source: queueSource },
						{ name: 'QueueItem.svelte', source: queueItemSource },
						collectionFile
					]}
				/>
			</section>
			<section id="story" aria-labelledby="story-heading">
				<div class="scene-caption">
					<div>
						<p class="eyebrow">04 / FIND YOUR OWN PACE</p>
						<h2 id="story-heading">Less scrolling past.<br /><em>More taking in.</em></h2>
					</div>
					<div>
						<p>
							A journal to linger in. Follow the landscape as you read, then assemble a world from
							six fragments.
						</p>
						<a href={resolve('/docs/[slug]', { slug: 'scroll' })}>Scroll &amp; sequence guides ↗</a>
					</div>
				</div>
				<StoryPreview /><ShowcaseSource
					files={[{ name: 'StoryPreview.svelte', source: storySource }, collectionFile]}
				/>
			</section>
		</MotionConfig>
		<aside class="colophon" aria-label="Showcase credits">
			<div>
				<span class="colophon-mark" aria-hidden="true">✳</span>
				<h2>Made to move.<br /><em>Open to explore.</em></h2>
				<p>Native Svelte elements. Motion’s animation engine.<br />Astra brings them together.</p>
				<a class="docs-cta" href={resolve('/docs/[slug]', { slug: 'getting-started' })}
					>Make your first move <span>↗</span></a
				>
			</div>
			<div class="credits">
				<h3>A NOTE ON FIELDWORK</h3>
				<p>
					This is a fictional editorial workspace, built to show real motion interactions. Edits are
					local to this page. Source viewers contain the components you’re using.
				</p>
				<h3>SEEN FROM ABOVE</h3>
				<p>
					Photography from the NASA Image and Video Library. Titles and notes are editorial labels
					for this demo.
				</p>
				<ul>
					{#each photos as photo (photo.id)}<li>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><!-- External NASA record, not an application route. -->
							<a href={photo.source} target="_blank" rel="noreferrer">{photo.location} ↗</a>
						</li>{/each}
				</ul>
				<p class="fine-print">
					Used under <a
						href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
						target="_blank"
						rel="noreferrer">NASA media guidelines</a
					>. This independent project is not affiliated with or endorsed by NASA.
				</p>
			</div>
		</aside>
	</main>
</SiteFrame>

<style>
	.intro-landscape {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		z-index: -2;
		gap: 4px;
	}
	.landscape-panel {
		overflow: hidden;
		animation: landscape-reveal 1.3s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		animation-delay: calc(var(--panel) * 120ms);
	}
	.landscape-panel img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.intro-main::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(180deg, #131b1610, #131b1688 35%, #131b16ed);
	}
	.intro-main h1 {
		color: #fffaf0;
		font-size: clamp(70px, 9.5vw, 130px);
	}
	.intro-main h1 .fieldwork-title {
		display: inline;
		font: inherit;
		letter-spacing: inherit;
		margin: 0;
		vertical-align: baseline;
	}
	.intro-main .eyebrow {
		color: #f0b99b;
	}
	.intro-main .intro-copy small {
		color: #e0e4d7;
	}
	.intro-main > div:not(.intro-landscape),
	.intro-main > .intro-copy {
		animation: title-arrive 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s backwards;
	}
	@keyframes landscape-reveal {
		from {
			clip-path: inset(100% 0 0);
		}
		to {
			clip-path: inset(0);
		}
	}
	@keyframes title-arrive {
		from {
			opacity: 0;
			translate: 0 45px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}
	.motion-reduced .landscape-panel,
	.motion-reduced .intro-main > div,
	.motion-reduced .intro-main > .intro-copy {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.landscape-panel,
		.intro-main > div:not(.intro-landscape),
		.intro-main > .intro-copy {
			animation: none;
		}
	}

	.fieldwork {
		--field-ink: #222720;
		--field-paper: #f5f3e9;
		--field-accent: #ba3e21;
		--field-muted: #626b5b;
		--field-line: #d3d8c9;
		max-width: 1328px;
		padding: 0 56px;
		margin: auto;
	}
	.showcase-intro {
		padding: 32px 0 0;
	}
	.intro-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1px;
		color: #626b5b;
	}
	.intro-top a {
		color: #4b5643;
		text-decoration: none;
		letter-spacing: 0;
		font:
			11px 'Instrument Sans Variable',
			sans-serif;
	}
	.intro-main {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		align-items: end;
		gap: 40px;
		padding: 190px 36px 36px;
		margin: 25px 0 0;
		min-height: 380px;
		position: relative;
		isolation: isolate;
		overflow: hidden;
		background: #232820;
		color: #fffaf0;
	}
	.eyebrow {
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1.8px;
		color: #ba3e21;
		margin: 0 0 20px;
	}
	h1 {
		font:
			normal clamp(70px, 10.5vw, 144px)/0.88 Georgia,
			serif;
		letter-spacing: -8px;
		margin: 0;
		color: #222720;
	}
	h1 span {
		font:
			15px 'Instrument Sans Variable',
			sans-serif;
		vertical-align: top;
		display: inline-block;
		margin: 12px 0 0 9px;
		letter-spacing: 0;
	}
	.intro-copy {
		font-size: 27px;
		line-height: 1.2;
		letter-spacing: -0.6px;
		max-width: 320px;
		margin: 0 0 2px;
	}
	.intro-copy em {
		font-family: Georgia, serif;
		font-weight: 400;
	}
	.intro-copy small {
		display: block;
		font-size: 12px;
		line-height: 1.85;
		letter-spacing: 0;
		color: #626b5b;
		margin-top: 20px;
		max-width: 285px;
	}
	.intro-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid #d3d8c9;
		border-bottom: 1px solid #d3d8c9;
		padding: 20px 0;
		gap: 20px;
	}
	.intro-bottom nav {
		display: flex;
		gap: 32px;
	}
	.intro-bottom nav a {
		font-size: 12px;
		text-decoration: none;
	}
	.intro-bottom nav span {
		font:
			8px ui-monospace,
			monospace;
		color: #626b5b;
		margin-right: 5px;
	}
	.motion-preference {
		font-size: 10px;
		color: #626b5b;
		display: flex;
		align-items: center;
		gap: 7px;
		cursor: pointer;
		white-space: nowrap;
	}
	.motion-preference input {
		accent-color: #ba3e21;
		width: 13px;
		height: 13px;
	}
	section {
		padding-top: 78px;
		scroll-margin-top: 24px;
	}
	.scene-caption {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 50px;
		align-items: end;
		margin-bottom: 30px;
	}
	.scene-caption .eyebrow {
		font-size: 8px;
		margin-bottom: 17px;
	}
	h2 {
		font-size: 35px;
		font-weight: 450;
		letter-spacing: -1.3px;
		line-height: 1.1;
		margin: 0;
	}
	h2 em {
		font-family: Georgia, serif;
		font-weight: 400;
	}
	.scene-caption > div:last-child {
		max-width: 310px;
		padding-bottom: 3px;
	}
	.scene-caption > div > p:not(.eyebrow) {
		font-size: 12px;
		line-height: 1.8;
		color: #626b5b;
		margin: 0 0 14px;
	}
	.scene-caption a {
		font-size: 10px;
		color: #4b5643;
		text-underline-offset: 4px;
	}
	.colophon {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 80px;
		border-top: 1px solid #d3d8c9;
		padding: 70px 0 80px;
		margin-top: 90px;
	}
	.colophon-mark {
		font-size: 49px;
		color: #ba3e21;
		display: block;
		margin-bottom: 22px;
	}
	.colophon h2 {
		font-size: 38px;
	}
	.colophon > div > p {
		font-size: 12px;
		line-height: 1.8;
		color: #626b5b;
		margin: 20px 0;
	}
	.docs-cta {
		display: inline-flex;
		gap: 42px;
		align-items: center;
		background: #ba3e21;
		color: #fff8ed;
		padding: 15px 20px;
		text-decoration: none;
		font-size: 12px;
		border-radius: 4px;
		margin-top: 6px;
	}
	.credits h3 {
		font:
			8px ui-monospace,
			monospace;
		letter-spacing: 1.5px;
		margin: 0 0 12px;
		color: #4b5643;
	}
	.credits h3:not(:first-child) {
		margin-top: 30px;
	}
	.credits p {
		font-size: 11px !important;
		margin: 0 0 13px !important;
	}
	.credits ul {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 9px;
		margin: 18px 0;
	}
	.credits li {
		font-size: 9px;
	}
	.credits a {
		text-decoration: underline;
		color: #4b5643;
		text-underline-offset: 3px;
	}
	.credits .fine-print {
		font-size: 9px !important;
	}
	.fieldwork a:focus-visible {
		outline: 2px solid #ba3e21;
		outline-offset: 5px;
	}
	@media (max-width: 900px) {
		.fieldwork {
			padding: 0 32px;
		}
		.intro-main {
			gap: 25px;
			grid-template-columns: 1.2fr 1fr;
		}
		h1 {
			letter-spacing: -5px;
		}
		.intro-copy {
			font-size: 23px;
		}
		.intro-bottom nav {
			gap: 19px;
		}
		.scene-caption,
		.colophon {
			gap: 40px;
			grid-template-columns: 1.2fr 1fr;
		}
	}
	@media (max-width: 600px) {
		.intro-main h1 {
			font-size: clamp(55px, 16vw, 78px);
			letter-spacing: -4px;
		}
		.intro-main {
			min-height: 400px;
		}
		.intro-landscape {
			grid-template-columns: 2fr 1fr;
		}
		.landscape-panel:last-child {
			display: none;
		}
		.fieldwork {
			padding: 0 20px;
		}
		.showcase-intro {
			padding-top: 25px;
		}
		.intro-top {
			font-size: 7px;
		}
		.intro-top a {
			font-size: 9px;
		}
		.intro-main {
			grid-template-columns: 1fr;
			padding: 95px 22px 28px;
			gap: 30px;
		}
		h1 {
			font-size: clamp(62px, 19vw, 78px);
			letter-spacing: -5px;
		}
		.intro-copy {
			font-size: 23px;
		}
		.intro-copy small {
			max-width: 310px;
			font-size: 11px;
			margin-top: 14px;
		}
		.intro-bottom {
			align-items: flex-start;
			flex-direction: column;
			gap: 17px;
			padding: 18px 0;
		}
		.intro-bottom nav {
			width: 100%;
			justify-content: space-between;
			gap: 8px;
		}
		.intro-bottom nav a {
			font-size: 11px;
		}
		.intro-bottom nav span {
			font-size: 7px;
			margin-right: 2px;
		}
		.motion-preference {
			font-size: 9px;
		}
		section {
			padding-top: 53px;
		}
		.scene-caption {
			grid-template-columns: 1fr;
			gap: 17px;
			margin-bottom: 22px;
		}
		h2 {
			font-size: 31px;
		}
		.scene-caption > div:last-child {
			max-width: 330px;
		}
		.scene-caption > div > p:not(.eyebrow) {
			font-size: 11px;
		}
		.colophon {
			grid-template-columns: 1fr;
			gap: 42px;
			margin-top: 60px;
			padding: 45px 0 55px;
		}
		.colophon h2 {
			font-size: 34px;
		}
		.credits {
			max-width: 380px;
		}
	}
</style>
