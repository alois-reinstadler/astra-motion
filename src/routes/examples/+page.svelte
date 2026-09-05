<script lang="ts">
	import { onMount } from 'svelte';
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	import { resolve } from '$app/paths';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	const categories = [
		'All examples',
		'Layout',
		'Presence',
		'Components',
		'Scroll & timelines',
		'Routes'
	] as const;
	type Category = (typeof categories)[number];
	let category = $state<Category>('All examples');
	let query = $state('');
	const examples = [
		{
			title: 'Fieldwork — a studio in motion',
			description:
				'Four connected product interactions: a photographic contact sheet, editing desk, publishing queue and story.',
			category: 'Components',
			href: '/showcase',
			mark: '↗',
			tone: 'coral',
			tag: 'THE SHOWCASE'
		},
		{
			title: 'The layout collection',
			description: 'Flex, grid, intrinsic size, nested projection and lists in one place.',
			category: 'Layout',
			href: '/motion-lab',
			mark: '▦',
			tone: 'sage',
			tag: 'START HERE'
		},
		{
			title: 'Accordions, dialogs & cards',
			description: 'Real shadcn-svelte components with motion, focus and native exit retention.',
			category: 'Components',
			href: '/motion-lab/components',
			mark: '▱',
			tone: 'coral',
			tag: 'REAL COMPONENTS'
		},
		{
			title: 'Coordinated presence',
			description: 'Exit ordering, stagger, wait mode and changing your mind halfway through.',
			category: 'Presence',
			href: '/motion-lab/presence',
			mark: '◐',
			tone: 'cream',
			tag: 'INTERACTIVE'
		},
		{
			title: 'State & interactions',
			description: 'Initial and update targets, variants, MotionValues and pointer interactions.',
			category: 'Components',
			href: '/motion-lab/state',
			mark: '↗',
			tone: 'sage',
			tag: 'INTERACTIVE'
		},
		{
			title: 'Shared route elements',
			description: 'Follow a product from list to detail, then try browser back and forward.',
			category: 'Routes',
			href: '/motion-lab/product',
			mark: '⇄',
			tone: 'cream',
			tag: 'SVELTEKIT'
		},
		{
			title: 'Scroll-linked motion',
			description: 'Connect progress to MotionValues and test a contained scrolling surface.',
			category: 'Scroll & timelines',
			href: '/motion-lab/scroll',
			mark: '↓',
			tone: 'coral',
			tag: 'SCROLL TO TRY'
		},
		{
			title: 'Scoped timelines',
			description: 'Sequence a small scene with local selectors, playback and interruption.',
			category: 'Scroll & timelines',
			href: '/motion-lab/timelines',
			mark: '≋',
			tone: 'sage',
			tag: 'PLAYBACK'
		},
		{
			title: 'Automatic vs explicit',
			description: 'Compare observed layout changes with the optional layout.update boundary.',
			category: 'Layout',
			href: '/motion-lab/updates',
			mark: '⇆',
			tone: 'cream',
			tag: 'COMPARISON'
		},
		{
			title: 'Stress the edges',
			description: 'Larger rearrangements, scroll containers and repeated interaction.',
			category: 'Layout',
			href: '/motion-lab/extended',
			mark: '✳',
			tone: 'coral',
			tag: 'STRESS TEST'
		},
		{
			title: 'Inherited initial styles',
			description: 'Parent and child variants with a deterministic server-rendered first frame.',
			category: 'Components',
			href: '/motion-lab/inheritance',
			mark: '⌘',
			tone: 'sage',
			tag: 'SSR & HYDRATION'
		}
	] as const;
	const filtered = $derived(
		examples.filter(
			(example) =>
				(category === 'All examples' || example.category === category) &&
				`${example.title} ${example.description} ${example.category}`
					.toLowerCase()
					.includes(query.toLowerCase().trim())
		)
	);
</script>

<svelte:head
	><title>Examples — Astra Motion</title><meta
		name="description"
		content="Find Astra Motion examples by use case: layout, presence, real components, route transitions, scroll-linked animation and scoped timelines."
	/></svelte:head
>

<SiteFrame>
	<main id="site-content">
		<header class="examples-intro">
			<p class="eyebrow">THE EXAMPLE COLLECTION</p>
			<h1>Less imagining.<br /><em>More trying.</em></h1>
			<p>
				Real interfaces, small experiments and the occasional stress test.<br />Find what you’re
				building. Then give it a push.
			</p>
		</header>
		<div class="collection-tools">
			<nav aria-label="Filter examples">
				{#each categories as option (option)}<button
						disabled={!ready}
						aria-pressed={category === option}
						class:active={category === option}
						onclick={() => (category = option)}>{option}</button
					>{/each}
			</nav>
			<label
				><span class="sr-only">Search examples</span><span aria-hidden="true">⌕</span><input
					disabled={!ready}
					type="search"
					bind:value={query}
					placeholder="Find an example…"
				/></label
			>
		</div>
		<p class="result-count" aria-live="polite">
			{filtered.length}
			{filtered.length === 1 ? 'EXAMPLE' : 'EXAMPLES'}{category !== 'All examples'
				? ` / ${category.toUpperCase()}`
				: ''}
		</p>
		<div class="example-grid">
			{#each filtered as example (example.href)}<a class="example" href={resolve(example.href)}
					><div class="example-art {example.tone}" aria-hidden="true">
						<span class="art-index"
							>ASTRA / {String(examples.indexOf(example) + 1).padStart(2, '0')}</span
						><span class="art-mark">{example.mark}</span><span class="art-tag">{example.tag}</span>
					</div>
					<div class="example-content">
						<span class="example-category">{example.category}</span>
						<h2>{example.title}<span>↗</span></h2>
						<p>{example.description}</p>
					</div></a
				>{/each}
		</div>
		{#if filtered.length === 0}<div class="empty">
				<h2>No examples found.</h2>
				<p>Try another search or show the full collection.</p>
				<button
					disabled={!ready}
					onclick={() => {
						query = '';
						category = 'All examples';
					}}>Show all examples →</button
				>
			</div>{/if}
		<aside>
			<div>
				<h2>Want the map before the playground?</h2>
				<p>The documentation starts with one element and builds from there.</p>
			</div>
			<a href={resolve('/docs/[slug]', { slug: 'getting-started' })}
				>Read the getting started guide ↗</a
			>
		</aside>
	</main>
</SiteFrame>

<style>
	main {
		max-width: 1440px;
		padding: 0 56px;
		margin: auto;
	}
	.examples-intro {
		padding: 70px 0 52px;
	}
	.eyebrow {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1.6px;
		margin: 0 0 24px;
		color: var(--site-muted);
	}
	h1 {
		font-size: 72px;
		font-weight: 450;
		letter-spacing: -3.5px;
		line-height: 1.06;
		margin: 0;
	}
	h1 em {
		font-family: Georgia, serif;
		font-weight: 400;
		color: var(--site-accent);
		letter-spacing: -3px;
	}
	.examples-intro > p:last-child {
		color: var(--site-muted);
		line-height: 1.7;
		font-size: 15px;
		margin: 24px 0 0;
	}
	.collection-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 19px 0;
		border-top: 1px solid var(--site-line);
		border-bottom: 1px solid var(--site-line);
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	nav button {
		padding: 9px 12px;
		font-size: 11px;
	}
	nav .active {
		background: var(--site-ink);
		color: var(--site-bg);
	}
	nav button:hover:not(.active) {
		background: var(--site-panel);
	}
	label {
		display: flex;
		gap: 9px;
		align-items: center;
		border-bottom: 1px solid var(--site-line);
		padding: 8px 0;
	}
	label > span {
		font-size: 21px;
		line-height: 1;
	}
	input {
		background: transparent;
		font-size: 12px;
		width: 155px;
		min-width: 0;
	}
	input::placeholder {
		color: var(--site-muted);
	}
	.result-count {
		font:
			9px ui-monospace,
			monospace;
		color: var(--site-muted);
		letter-spacing: 1.2px;
		margin: 25px 0;
	}
	.example-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 35px 24px;
	}
	.example {
		text-decoration: none;
		min-width: 0;
	}
	.example-art {
		height: 220px;
		padding: 20px;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.sage {
		background: #dce5c2;
	}
	.coral {
		background: #e9a48b;
	}
	.cream {
		background: #e9e6d5;
	}
	.art-index,
	.art-tag {
		font:
			8px ui-monospace,
			monospace;
		letter-spacing: 1px;
		position: relative;
		z-index: 1;
	}
	.art-tag {
		align-self: flex-end;
	}
	.art-mark {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 115px;
		line-height: 1;
		font-family: Georgia, serif;
		font-weight: 400;
		transition: transform 220ms;
	}
	.example:hover .art-mark {
		transform: translate(-50%, -50%) rotate(-8deg);
	}
	.example-content {
		padding: 18px 0;
	}
	.example-category {
		font:
			9px ui-monospace,
			monospace;
		color: var(--site-muted);
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	.example h2 {
		font-size: 19px;
		font-weight: 550;
		margin: 11px 0;
		letter-spacing: -0.4px;
		display: flex;
		justify-content: space-between;
		gap: 15px;
	}
	.example h2 > span {
		font-weight: 400;
	}
	.example:hover h2 {
		color: var(--site-accent);
	}
	.example p {
		font-size: 12px;
		line-height: 1.8;
		color: var(--site-muted);
		max-width: 340px;
		margin: 0;
	}
	aside {
		border-top: 1px solid var(--site-line);
		margin-top: 45px;
		padding: 40px 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 25px;
	}
	aside h2 {
		font-size: 22px;
		font-weight: 450;
		letter-spacing: -0.6px;
		margin: 0;
	}
	aside p {
		font-size: 12px;
		color: var(--site-muted);
		margin: 10px 0 0;
	}
	aside a {
		font-size: 12px;
	}
	.empty {
		padding: 70px 0;
		text-align: center;
	}
	.empty h2 {
		font-size: 28px;
	}
	.empty p {
		color: var(--site-muted);
		margin: 15px 0;
	}
	.empty button {
		color: var(--site-accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.art-mark {
			transition: none;
		}
		.example:hover .art-mark {
			transform: translate(-50%, -50%);
		}
	}
	@media (max-width: 1050px) {
		.collection-tools {
			align-items: flex-start;
			flex-direction: column;
		}
		label {
			width: 100%;
		}
		input {
			width: 100%;
		}
		.example-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 750px) {
		main {
			padding: 0 24px;
		}
		.examples-intro {
			padding: 45px 0 35px;
		}
		h1 {
			font-size: 54px;
			letter-spacing: -2px;
		}
		h1 em {
			letter-spacing: -2px;
		}
		.examples-intro > p:last-child {
			font-size: 13px;
		}
		nav button {
			padding: 8px 10px;
		}
		.example-grid {
			grid-template-columns: 1fr;
			gap: 18px;
		}
		.example-art {
			height: 230px;
		}
		aside {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
