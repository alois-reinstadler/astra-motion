<script lang="ts">
	import { asset } from '$app/paths';
	import { untrack } from 'svelte';
	import { createLayout, type LayoutOptions } from '../motion/layout.js';
	let {
		method,
		mode,
		nested,
		compact,
		expanded
	}: {
		method: 'automatic' | 'explicit' | 'static';
		mode: LayoutOptions['mode'];
		nested: boolean;
		compact: boolean;
		expanded: boolean;
	} = $props();
	// The parent keys the fixture when diagnostic settings change.
	const layout = untrack(() =>
		createLayout({
			automatic: method === 'automatic',
			reducedMotion: 'never',
			transition: { duration: 0.8, ease: 'linear' }
		})
	);
</script>

<article
	data-probe="surface"
	class:compact
	{@attach method === 'static' ? undefined : layout({ mode })}
>
	<div
		data-probe="copy"
		{@attach method !== 'static' && nested ? layout({ mode: 'position' }) : undefined}
	>
		<small>FIELDWORK / FRACTIONAL LAYOUT</small>
		<h2>A quiet immensity</h2>
		<p>Wind gives the desert its handwriting. Fine text, thin strokes and an orbital photograph.</p>
	</div>
	<div
		data-probe="image"
		{@attach method !== 'static' && nested ? layout({ mode: 'preserve-aspect' }) : undefined}
	>
		<img src={asset('/showcase/namib.jpg')} alt="Parallel dunes in the Namib Desert" />
	</div>
	<section data-probe="accordion" {@attach method === 'static' ? undefined : layout({ mode })}>
		<strong
			data-probe="label"
			{@attach method !== 'static' && nested ? layout({ mode: 'position' }) : undefined}
			>Intrinsic height, ordinary document flow.</strong
		>
		{#if expanded}
			<p
				data-probe="body"
				{@attach method !== 'static' && nested ? layout({ mode: 'position' }) : undefined}
			>
				The browser determines this height. The parent can also narrow the whole surface from
				outside this component. Nested projection compensates for the parent scale while the text
				wraps at its final width. Repeat, interrupt and reverse this change to inspect the cached
				starting box.
			</p>
		{/if}
	</section>
</article>

<style>
	article {
		width: min(100%, 903.5px);
		padding: 23.375px;
		box-sizing: border-box;
		background: #f5f3e9;
		color: #222720;
	}
	article.compact {
		width: min(100%, 631.25px);
	}
	small {
		font:
			11px/1.5 ui-monospace,
			monospace;
		letter-spacing: 1.375px;
	}
	h2 {
		font:
			42px/1.15 Georgia,
			serif;
		margin: 12.25px 0;
	}
	p {
		font:
			15px/1.65 system-ui,
			sans-serif;
		margin: 12.375px 0;
	}
	img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
	}
	[data-probe='image'] {
		width: 54.375%;
		margin: 18.375px 0;
	}
	section {
		padding: 16.375px;
		background: #dfe7d6;
	}
	strong {
		display: block;
		font:
			16px/1.5 system-ui,
			sans-serif;
	}
</style>
