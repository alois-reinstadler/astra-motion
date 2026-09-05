<script lang="ts">
	import { resolve } from '$app/paths';
	import { authoringExamples } from '$lib/motion-lab/authoring-examples.js';
	let copied = $state<string>();
	let copyError = $state(false);
	async function copy(id: string, source: string) {
		try {
			await navigator.clipboard.writeText(source);
			copied = id;
			copyError = false;
		} catch {
			copyError = true;
		}
	}
</script>

<svelte:head>
	<title>Astra / A field guide to motion</title>
	<meta
		name="description"
		content="Complete Svelte-native motion examples: presence, layout, shared elements, scroll and timelines."
	/>
</svelte:head>

<main>
	<header>
		<a class="brand" href={resolve('/motion-lab')}>astra<span>®</span></a><a
			href={resolve('/motion-lab')}>Back to the laboratory ↗</a
		>
	</header>
	<div class="intro">
		<p class="eyebrow">THE AUTHORING GUIDE / 001</p>
		<h1>Ordinary markup.<br /><em>Extraordinary movement.</em></h1>
		<p class="lede">
			Start with the smallest tool for the job. Keep your native elements, your CSS and Svelte’s
			lifecycle.
		</p>
	</div>
	<div class="principles">
		<p><strong>01</strong> CSS chooses the layout.</p>
		<p><strong>02</strong> Svelte keeps the exiting DOM.</p>
		<p><strong>03</strong> Motion does the animation.</p>
	</div>
	<p class="note">
		Start with <code>astra-motion/state/lite</code> for state and presence. Choose
		<code>astra-motion/state</code> when you also need layout or gestures. Layout, scroll and timelines
		have independent entry points.
	</p>
	<div class="body">
		<aside>
			<nav aria-label="Guide examples">
				<p class="eyebrow">CHOOSE A PATTERN</p>
				{#each authoringExamples as example, index (example.id)}<a href={`#${example.id}`}
						><span>{String(index + 1).padStart(2, '0')}</span>{example.title}</a
					>{/each}<a href="#good-shapes"><span>12</span>Keep text & images natural</a>
			</nav>
		</aside>
		<div class="examples">
			{#each authoringExamples as example, index (example.id)}
				<section id={example.id}>
					<p class="eyebrow">PATTERN {String(index + 1).padStart(2, '0')}</p>
					<h2>{example.title}</h2>
					<p class="summary">{example.summary}</p>
					<div class="source-head">
						<span
							>{example.id === 'routes'
								? '+layout.svelte'
								: example.id === 'component'
									? 'MotionCard.svelte'
									: 'Example.svelte'}</span
						><button
							onclick={() => copy(example.id, example.source)}
							aria-label={`Copy ${example.title} example`}
							>{copied === example.id ? 'Copied ✓' : 'Copy source'}</button
						>
					</div>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll long source lines.) -->
					<pre role="region" tabindex="0" aria-label={`${example.title} Svelte source`}><code
							>{example.source}</code
						></pre>
					<p class="note">{example.note}</p>
					<a class="try" href={resolve(example.lab)}>Try the interactive lab <span>↗</span></a>
				</section>
			{/each}
			<section id="good-shapes" class="shapes">
				<p class="eyebrow">A SMALL DESIGN CONTRACT</p>
				<h2>Movement should never<br />change the material.</h2>
				<p class="summary">
					Layout animates a rectangle with transforms. A resizing rectangle also scales its contents
					unless those contents participate in correction.
				</p>
				<ul>
					<li>
						<strong>Text:</strong> attach position projection to an existing block or flex content host
						inside a resizing surface. Plain inline text is not a transformable host.
					</li>
					<li>
						<strong>Images:</strong> use a stable aspect ratio and intentional
						<code>object-fit</code>. Choose <code>mode: 'preserve-aspect'</code> when a shared image should
						move without stretching between shapes.
					</li>
					<li>
						<strong>Transforms:</strong> put rotation and scale in Motion’s <code>style</code> or animation
						targets. A projected node cannot also have an independent CSS transform owner.
					</li>
					<li>
						<strong>Accordions:</strong> animate intrinsic height with Svelte’s reveal transition when
						that better fits the content. Every resizing box does not need scale projection.
					</li>
				</ul>
				<p class="note">
					The lab includes regression coverage for these patterns. Arbitrary transformed ancestors,
					3D scenes and every browser’s clipping behavior remain outside the current guarantee.
				</p>
			</section>
		</div>
	</div>
	<p class="feedback" role="status">
		{copyError
			? 'Clipboard unavailable. Select and copy the source directly.'
			: copied
				? 'Example copied to clipboard.'
				: ''}
	</p>
	<footer>
		<span>ASTRA / SVELTE 5 MOTION</span><span
			>Native elements. Explicit ownership. No compiler plugin.</span
		>
	</footer>
</main>

<style>
	:global(body) {
		background: #f5f4ee;
	}
	main {
		max-width: 1320px;
		margin: auto;
		padding: 30px 48px 0;
		color: #252722;
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	header,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}
	header {
		padding-bottom: 30px;
		border-bottom: 1px solid #d9dbd1;
	}
	a {
		color: inherit;
		text-decoration: none;
	}
	header > a:last-child,
	footer {
		font-size: 12px;
	}
	.brand {
		font-size: 30px;
		font-weight: 750;
		letter-spacing: -2px;
	}
	.brand span {
		font-size: 11px;
		vertical-align: top;
		letter-spacing: 0;
	}
	.intro {
		padding: 74px 0 50px;
	}
	.eyebrow {
		font-size: 10px;
		font-weight: 650;
		letter-spacing: 1.7px;
	}
	.intro .eyebrow {
		margin-bottom: 22px;
	}
	h1 {
		font-size: clamp(42px, 5.1vw, 70px);
		line-height: 1.08;
		letter-spacing: -3px;
		font-weight: 500;
	}
	em {
		font-family: Georgia, serif;
		font-weight: 400;
	}
	.lede {
		max-width: 510px;
		margin-top: 26px;
		font-size: 17px;
		line-height: 1.6;
		color: #666b5f;
	}
	.principles {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-block: 1px solid #d9dbd1;
		padding: 24px 0;
		gap: 20px;
		font-size: 13px;
	}
	.principles strong {
		margin-right: 10px;
		color: #75816d;
		font-size: 11px;
	}
	.body {
		display: grid;
		grid-template-columns: 235px minmax(0, 1fr);
		gap: 60px;
		padding-top: 52px;
	}
	aside nav {
		position: sticky;
		top: 28px;
	}
	nav > p {
		margin-bottom: 22px;
	}
	nav a {
		display: flex;
		gap: 12px;
		padding: 9px 0;
		font-size: 12px;
		color: #62665c;
	}
	nav a:hover {
		color: #171a13;
	}
	nav span {
		font-size: 10px;
		color: #868c7d;
		font-variant-numeric: tabular-nums;
	}
	section {
		scroll-margin-top: 30px;
		padding-bottom: 58px;
		margin-bottom: 42px;
		border-bottom: 1px solid #d9dbd1;
	}
	h2 {
		margin: 14px 0;
		font-size: 31px;
		letter-spacing: -1px;
		line-height: 1.15;
		font-weight: 500;
	}
	.summary {
		max-width: 660px;
		font-size: 15px;
		line-height: 1.7;
		margin-bottom: 24px;
		color: #62665c;
	}
	.source-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #e8eae1;
		padding: 12px 18px;
		border: 1px solid #d8dccd;
		border-bottom: 0;
		border-radius: 8px 8px 0 0;
		font-size: 11px;
	}
	.source-head span {
		color: #65705b;
	}
	button {
		cursor: pointer;
		background: #fff9;
		border: 1px solid #c9cebf;
		border-radius: 4px;
		padding: 5px 10px;
		font-size: 11px;
	}
	button:hover {
		background: #fff;
	}
	pre {
		overflow-x: auto;
		max-width: 100%;
		background: #eceee7;
		padding: 22px 20px;
		border: 1px solid #d8dccd;
		border-radius: 0 0 8px 8px;
		font-size: 12px;
		line-height: 1.75;
		tab-size: 2;
	}
	code {
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	}
	.note {
		font-size: 12px;
		color: #68705f;
		line-height: 1.7;
		margin-top: 18px;
	}
	.try {
		display: inline-flex;
		align-items: center;
		gap: 40px;
		padding: 16px 0 2px;
		font-size: 12px;
		font-weight: 650;
	}
	.try:hover {
		text-decoration: underline;
	}
	.shapes ul {
		padding-left: 20px;
		font-size: 14px;
		line-height: 1.8;
	}
	.shapes li {
		margin: 14px 0;
	}
	.shapes code {
		font-size: 12px;
	}
	.feedback {
		position: fixed;
		bottom: 20px;
		right: 20px;
		padding: 0;
		font-size: 12px;
		background: #252722;
		color: white;
		border-radius: 5px;
	}
	.feedback:not(:empty) {
		padding: 12px 18px;
	}
	footer {
		padding: 25px 0;
		border-top: 1px solid #d9dbd1;
		color: #737a69;
	}
	:focus-visible {
		outline: 2px solid #6a8045;
		outline-offset: 4px;
	}
	@media (max-width: 850px) {
		main {
			padding: 22px 24px 0;
		}
		.body {
			grid-template-columns: minmax(0, 1fr);
			gap: 34px;
		}
		aside nav {
			position: static;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 20px;
		}
		nav > p {
			grid-column: 1 / -1;
			margin-bottom: 8px;
		}
		.principles {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.intro {
			padding-top: 50px;
		}
		h1 {
			letter-spacing: -2px;
		}
		footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}
	}
	@media (max-width: 450px) {
		main {
			padding-inline: 18px;
		}
		h1 {
			font-size: 38px;
		}
		.intro {
			padding-top: 42px;
		}
		header > a:last-child {
			font-size: 10px;
		}
		pre {
			font-size: 11px;
			padding: 16px 12px;
		}
	}
</style>
